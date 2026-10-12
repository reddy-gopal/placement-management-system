import { useCallback, useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getMyCompany, saveMyCompany } from '../../services/companyApi';
import { listDrives } from '../../services/driveApi';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import Alert from '../../components/ui/Alert';
import FormField, { describedBy, inputClassName } from '../../components/ui/FormField';
import Modal from '../../components/ui/Modal';
import { ErrorState, LoadingState } from '../../components/ui/States';
import { Toast, dangerSolidClassName } from '../../components/recruiter/RecruiterUi';
import { deleteMyCompany } from '../../components/recruiter/recruiterData';
import { companyToForm, toCompanyPayload, validateCompanyForm } from '../../components/recruiter/companyForm';
import { monogram } from '../../utils/format';

/** The company plus how many of its drives are open (shown under the name; optional). */
async function loadCompany() {
  const company = await getMyCompany();
  if (!company) return { company: null, openDrives: null };
  const openDrives = await listDrives({ status: 'OPEN', limit: 1 })
    .then((result) => result.total)
    .catch(() => null);
  return { company, openDrives };
}

/** 80px logo tile: the logo image when it loads, otherwise the monogram. */
function CompanyAvatar({ company }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className="grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-xl border border-line bg-subtle text-[26px] font-semibold"
    >
      {company.logoUrl && !failed ? (
        <img src={company.logoUrl} alt="" onError={() => setFailed(true)} className="h-full w-full bg-white object-contain" />
      ) : (
        monogram(company.name)
      )}
    </span>
  );
}

/** Create / edit form. `editing` adds the guidance hints and a Cancel button. */
function CompanyForm({ form, errors, onChange, onSubmit, onCancel, saving, submitLabel, savingLabel, serverError, editing }) {
  const field = (name, label, { type = 'text', placeholder, hint, required = false } = {}) => {
    const id = `company-${name}`;
    return (
      <FormField id={id} label={label} required={required} hint={hint} error={errors[name]}>
        <input
          id={id}
          type={type}
          value={form[name]}
          onChange={(event) => onChange(name, event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={describedBy(id, { error: errors[name], hint })}
          aria-required={required || undefined}
          className={inputClassName(Boolean(errors[name]))}
        />
      </FormField>
    );
  };
  const descriptionHint = editing ? 'Shown to students on every drive. 2–4 sentences works best.' : undefined;

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={editing ? 'Edit company profile' : 'Create company profile'}
      className="flex flex-col gap-6 rounded-[10px] border border-ink p-5 sm:p-7"
    >
      {serverError && <Alert variant="error">{serverError}</Alert>}
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Company name', { required: true, placeholder: 'e.g. Arcline Systems' })}
        {field('industry', 'Industry', { placeholder: 'e.g. Fintech' })}
      </div>
      <FormField id="company-description" label="Description" hint={descriptionHint}>
        <textarea
          id="company-description"
          rows={4}
          value={form.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="What the company does, size, locations"
          aria-describedby={describedBy('company-description', { hint: descriptionHint })}
          className="input"
        />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        {field('website', 'Website', { type: 'url', placeholder: 'https://' })}
        {field('logoUrl', 'Logo URL', { type: 'url', placeholder: 'https://', hint: editing ? 'Square image, at least 128 px.' : undefined })}
        {field('contactEmail', 'Contact email', { type: 'email', placeholder: 'campus@company.com' })}
        {field('contactPhone', 'Contact phone', { type: 'tel', placeholder: '+91' })}
      </div>
      <div className="flex justify-end gap-2.5 border-t border-line pt-5">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} aria-busy={saving} className="btn">
          {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

function DetailRow({ label, children, last = false }) {
  return (
    <div className={`grid gap-1.5 border-t border-line py-4 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6 ${last ? 'border-b' : ''}`}>
      <dt className="eyebrow pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

const orDash = (value) => value || <span className="text-muted">—</span>;

function CompanyDetails({ company }) {
  return (
    <section aria-label="Company details">
    <dl className="flex flex-col">
      <DetailRow label="About">
        {company.description ? <p className="whitespace-pre-line leading-[1.65] text-[#2a2a2e]">{company.description}</p> : orDash()}
      </DetailRow>
      <DetailRow label="Industry">{orDash(company.industry)}</DetailRow>
      <DetailRow label="Website">
        {company.website ? (
          <a href={company.website} target="_blank" rel="noreferrer" className="break-all underline underline-offset-2 hover:text-muted">
            {company.website} ↗
          </a>
        ) : (
          orDash()
        )}
      </DetailRow>
      <DetailRow label="Contact email">
        {company.contactEmail ? (
          <a href={`mailto:${company.contactEmail}`} className="break-all hover:text-muted">
            {company.contactEmail}
          </a>
        ) : (
          orDash()
        )}
      </DetailRow>
      <DetailRow label="Contact phone">{company.contactPhone ? <span className="font-mono">{company.contactPhone}</span> : orDash()}</DetailRow>
      <DetailRow label="Logo URL" last>
        {company.logoUrl ? <span className="break-all font-mono text-xs text-muted">{company.logoUrl}</span> : orDash()}
      </DetailRow>
    </dl>
    </section>
  );
}

function DeleteCompanyDialog({ company, open, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (deleting) return;
    setError('');
    onClose();
  };

  const confirm = async () => {
    setDeleting(true);
    setError('');
    try {
      const result = await deleteMyCompany();
      setDeleting(false);
      onDeleted(result.message);
    } catch (err) {
      setDeleting(false);
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Delete ${company.name}?`}
      className="max-w-115"
      footer={
        <>
          <button type="button" onClick={close} disabled={deleting} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={deleting} aria-busy={deleting} className={dangerSolidClassName}>
            {deleting ? 'Deleting…' : 'Delete company'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 p-5">
        <p className="text-sm leading-[1.55] text-muted">
          This permanently removes your company profile. You’ll need to create a new one before you can post or manage job
          drives. Companies that already have job drives can’t be deleted.
        </p>
        {error && <Alert variant="error">{error}</Alert>}
      </div>
    </Modal>
  );
}

export default function CompanyProfile() {
  const { data, status, error, reload, setData } = useAsync(loadCompany, []);
  const company = data?.company ?? null;
  useDashboardIdentity(company ? { subtitle: company.name } : null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => companyToForm(null));
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hideToast = useCallback(() => setToast(''), []);

  const resetForm = (source) => {
    setForm(companyToForm(source));
    setErrors({});
    setSubmitAttempted(false);
    setServerError('');
  };

  const updateField = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (submitAttempted) setErrors(validateCompanyForm(next));
    else if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  };

  const startEditing = () => {
    resetForm(company);
    setToast('');
    setEditing(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSubmitAttempted(true);
    const validationErrors = validateCompanyForm(form);
    setErrors(validationErrors);
    const firstInvalid = Object.keys(validationErrors)[0];
    if (firstInvalid) {
      document.getElementById(`company-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    setServerError('');
    try {
      const result = await saveMyCompany(toCompanyPayload(form), { exists: Boolean(company) });
      setData((current) => ({ ...current, company: result.company, openDrives: current?.openDrives ?? 0 }));
      setToast(company ? 'Company profile saved' : 'Company profile created · you can now post drives');
      setEditing(false);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleted = () => {
    setConfirmDelete(false);
    setData({ company: null, openDrives: null });
    resetForm(null);
    setEditing(false);
    setToast('Company profile deleted');
  };

  if (status === 'loading') return <LoadingState label="Loading company profile…" rows={4} />;
  if (status === 'error') return <ErrorState title="We couldn’t load your company profile." message={error} onRetry={reload} />;

  const toastBar = <Toast message={toast} onDismiss={hideToast} />;

  if (!company) {
    return (
      <div className="flex max-w-220 flex-col gap-8">
        {toastBar}
        <section className="flex flex-col gap-2">
          <span className="eyebrow">Step 1 of 1 · Required</span>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[32px]">Set up your company</h1>
          <p className="max-w-140 text-sm leading-[1.55] text-muted">
            You need a company profile before you can post job drives or review applications. Students see these details on
            every drive.
          </p>
        </section>
        <CompanyForm
          form={form}
          errors={errors}
          onChange={updateField}
          onSubmit={handleSubmit}
          saving={saving}
          submitLabel="Create company profile"
          savingLabel="Creating…"
          serverError={serverError}
        />
      </div>
    );
  }

  const subtitle = [
    company.industry,
    data.openDrives !== null && data.openDrives !== undefined && `${data.openDrives} open drive${data.openDrives === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex max-w-220 flex-col gap-8">
      {toastBar}
      <section className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-5">
          <CompanyAvatar company={company} />
          <div className="min-w-0">
            <h1 className="break-words text-[28px] font-semibold tracking-[-0.03em] sm:text-[32px]">{company.name}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {editing ? (
          <span className="rounded border border-ink bg-lime px-2 py-1 font-mono text-[11px] tracking-[0.06em]">EDITING</span>
        ) : (
          <button type="button" onClick={startEditing} className="btn btn-secondary">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit profile
          </button>
        )}
      </section>

      {editing ? (
        <CompanyForm
          form={form}
          errors={errors}
          onChange={updateField}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
          saving={saving}
          submitLabel="Save changes"
          savingLabel="Saving…"
          serverError={serverError}
          editing
        />
      ) : (
        <>
          <CompanyDetails company={company} />
          <section
            aria-label="Danger zone"
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#f3c6c8] p-5"
          >
            <div>
              <h2 className="text-sm font-semibold">Delete company profile</h2>
              <p className="mt-1 text-[13px] text-muted">You’ll need to create a new one before posting or managing drives.</p>
            </div>
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-danger">
              Delete company…
            </button>
          </section>
        </>
      )}

      <DeleteCompanyDialog
        company={company}
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
