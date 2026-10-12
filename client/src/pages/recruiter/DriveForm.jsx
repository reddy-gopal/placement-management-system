import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getMyCompany } from '../../services/companyApi';
import { createDrive, getDrive, updateDrive } from '../../services/driveApi';
import { useDashboardIdentity, usePageTitle } from '../../components/layout/dashboardIdentity';
import Alert from '../../components/ui/Alert';
import CompanyLogo from '../../components/ui/CompanyLogo';
import FormField, { describedBy, fieldHintId, inputClassName } from '../../components/ui/FormField';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { NoCompanyState, RecruiterHeader } from '../../components/recruiter/RecruiterUi';
import {
  DRIVE_FIELD_IDS,
  DRIVE_FIELD_LABELS,
  DRIVE_SECTIONS,
  driveToForm,
  eligibilitySummary,
  toDrivePayload,
  validateDriveForm,
} from '../../components/recruiter/driveForm';
import { BRANCHES } from '../../constants/studentProfile';
import { EMPLOYMENT_TYPE_LABELS, daysUntil, employmentTypeLabel, formatLpa, toDateInputValue } from '../../utils/format';

/** The recruiter's company and, when editing, the drive being edited. */
async function loadFormData(driveId) {
  const company = await getMyCompany();
  if (!company) return { company: null, drive: null };
  const drive = driveId ? await getDrive(driveId) : null;
  return { company, drive };
}

const companyIdOf = (drive) => (drive?.companyId && typeof drive.companyId === 'object' ? drive.companyId._id : drive?.companyId);

/** Numbered form section: label column on the left (≥ 1100px), fields on the right. */
function Section({ number, title, hint, children }) {
  return (
    <section className="grid gap-3.5 border-t border-line py-7 min-[1100px]:grid-cols-[220px_minmax(0,1fr)] min-[1100px]:gap-8">
      <div>
        <span className="eyebrow">{number}</span>
        <h2 className="mt-1.5 text-base font-semibold">{title}</h2>
        {hint && <p className="field-hint">{hint}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}

/** Links to every invalid field, shown after a submit attempt. */
function ErrorSummary({ errors, isEdit }) {
  const fields = Object.keys(errors);
  const focusField = (event, field) => {
    event.preventDefault();
    const element = document.getElementById(DRIVE_FIELD_IDS[field]);
    element?.scrollIntoView?.({ block: 'center' });
    element?.focus();
  };
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-[#f3c6c8] bg-[#fdf1f1] px-4 py-3 text-[13px]">
      <AlertCircle className="mt-px h-4.5 w-4.5 flex-none text-danger" aria-hidden="true" />
      <p>
        <strong className="font-semibold">
          {fields.length} field{fields.length === 1 ? ' needs' : 's need'} attention before you can{' '}
          {isEdit ? 'save these changes' : 'create this drive'}.
        </strong>{' '}
        {fields.map((field, index) => (
          <span key={field}>
            {index > 0 && ', '}
            <a href={`#${DRIVE_FIELD_IDS[field]}`} onClick={(event) => focusField(event, field)} className="underline">
              {DRIVE_FIELD_LABELS[field]}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/** Right-hand panel: the drive card as students will see it, plus per-section completeness. */
function StudentPreview({ form, company, errors, submitAttempted }) {
  return (
    <aside aria-label="Preview" className="flex flex-col gap-4 min-[1100px]:sticky min-[1100px]:top-20">
      <span className="eyebrow">Student preview</span>
      <div className="flex flex-col gap-3 rounded-lg border border-line p-4.5">
        <div className="flex items-center gap-3">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={40} />
          <div className="min-w-0">
            <div className={`truncate text-[15px] font-semibold ${form.title.trim() ? '' : 'text-faint'}`}>
              {form.title.trim() || 'Job title'}
            </div>
            <div className="truncate text-[13px] text-muted">{company.name}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-muted">
          <span>
            <strong className="text-ink">{form.packageLpa === '' ? '—' : formatLpa(form.packageLpa)}</strong> LPA
          </span>
          <span>{form.location.trim() || 'Location'}</span>
          <span>{employmentTypeLabel(form.employmentType)}</span>
        </div>
        <div className="border-t border-line pt-2.5 text-xs text-muted">
          {eligibilitySummary({
            minCgpa: form.minCgpa,
            maxBacklogs: form.maxBacklogs,
            allowedBranches: form.allowedBranches,
          })}
        </div>
      </div>
      <ul className="flex flex-col text-[13px]" aria-label="Section status">
        {DRIVE_SECTIONS.map((section, index) => {
          const count = section.fields.filter((field) => errors[field]).length;
          let state = <span className="text-success">✓ Complete</span>;
          if (count && submitAttempted) state = <span className="text-danger">{count} error{count === 1 ? '' : 's'}</span>;
          else if (count) state = <span className="text-muted">Incomplete</span>;
          return (
            <li
              key={section.id}
              className={`flex justify-between border-t border-line py-2.5 ${index === DRIVE_SECTIONS.length - 1 ? 'border-b' : ''}`}
            >
              <span>{section.title}</span>
              {state}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default function DriveForm() {
  const { driveId } = useParams();
  const isEdit = Boolean(driveId);
  const navigate = useNavigate();
  usePageTitle(isEdit ? 'Edit drive' : 'New drive');

  const { data, status, error, reload } = useAsync(() => loadFormData(driveId), [driveId]);
  const company = data?.company ?? null;
  const drive = data?.drive ?? null;
  useDashboardIdentity(company ? { subtitle: company.name } : null);

  const [form, setForm] = useState(() => driveToForm(null));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const topRef = useRef(null);

  useEffect(() => {
    if (status === 'ready') setForm(driveToForm(drive));
    // Re-sync only when a (re)load finishes.
  }, [status]);

  const originalDeadline = drive ? toDateInputValue(drive.deadline) : '';
  const deadlineChanged = !isEdit || form.deadline !== originalDeadline;
  const errors = useMemo(() => validateDriveForm(form, { checkDeadline: deadlineChanged }), [form, deadlineChanged]);
  const shownErrors = submitAttempted ? errors : {};

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError('');
  };

  const toggleBranch = (branch) =>
    updateField(
      'allowedBranches',
      form.allowedBranches.includes(branch)
        ? form.allowedBranches.filter((item) => item !== branch)
        : BRANCHES.filter((item) => item === branch || form.allowedBranches.includes(item))
    );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSubmitAttempted(true);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      document.getElementById(DRIVE_FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    setSaving(true);
    setServerError('');
    try {
      const payload = toDrivePayload(form, { includeDeadline: deadlineChanged });
      if (isEdit) {
        await updateDrive(driveId, payload);
        navigate('/recruiter/drives', { state: { flash: `Changes to ${payload.title} saved` } });
      } else {
        await createDrive(payload);
        navigate('/recruiter/drives', { state: { flash: `${payload.title} created · open to eligible students` } });
      }
    } catch (err) {
      setSaving(false);
      setServerError(err.message);
      topRef.current?.scrollIntoView?.({ block: 'start' });
    }
  };

  if (status === 'loading') return <LoadingState label="Loading drive…" rows={5} />;
  if (status === 'error') return <ErrorState title="We couldn’t load this drive." message={error} onRetry={reload} />;
  if (!company) return <NoCompanyState message="You need a company profile before you can post job drives." />;

  const backLink = (
    <Link to="/recruiter/drives" className="btn btn-secondary">
      Back to job drives
    </Link>
  );
  if (isEdit && companyIdOf(drive) !== company._id) {
    return <EmptyState title="You can’t edit this drive" message="Only drives posted by your company can be edited." action={backLink} />;
  }
  if (isEdit && drive.status === 'CANCELLED') {
    return (
      <EmptyState
        title="This drive was cancelled"
        message="The placement cell cancelled this drive, so it can no longer be edited."
        action={backLink}
      />
    );
  }

  const field = (name, props = {}) => ({
    id: DRIVE_FIELD_IDS[name],
    value: form[name],
    onChange: (event) => updateField(name, event.target.value),
    'aria-invalid': Boolean(shownErrors[name]),
    'aria-describedby': describedBy(DRIVE_FIELD_IDS[name], { error: shownErrors[name], hint: props.hint }),
    'aria-required': true,
    className: inputClassName(Boolean(shownErrors[name])),
  });
  const deadlinePassed = isEdit && !deadlineChanged && daysUntil(drive.deadline) < 0;
  const deadlineHint = deadlinePassed ? 'This deadline has passed. Pick a new date to accept applications again.' : 'Applications close at the end of this day.';
  const branchHint = `${form.allowedBranches.length} of ${BRANCHES.length} selected. Leave all unselected to open the drive to every branch.`;

  return (
    <div ref={topRef} className="flex scroll-mt-20 flex-col gap-6">
      <RecruiterHeader
        title={isEdit ? 'Edit job drive' : 'Create job drive'}
        badge={isEdit && <StatusBadge status={drive.status} />}
        description={
          <>
            Fields marked <span className="text-danger">*</span> are required.{' '}
            {isEdit
              ? 'Changes are visible to students as soon as you save.'
              : 'New drives open to eligible students as soon as they’re created.'}
          </>
        }
      />

      {submitAttempted && Object.keys(errors).length > 0 && <ErrorSummary errors={errors} isEdit={isEdit} />}
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <div className="grid items-start gap-12 min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
        <form noValidate onSubmit={handleSubmit} aria-label="Job drive" className="flex min-w-0 flex-col">
          <Section number="01" title="Job information" hint="What students see first in the drive list.">
            <FormField id={DRIVE_FIELD_IDS.title} label="Job title" required error={shownErrors.title}>
              <input type="text" placeholder="e.g. Software Engineer I" {...field('title')} />
            </FormField>
            <div>
              <FormField id={DRIVE_FIELD_IDS.description} label="Job description" required error={shownErrors.description}>
                <textarea rows={6} placeholder="Role, responsibilities, requirements" {...field('description', { hint: true })} className={`${inputClassName(Boolean(shownErrors.description))}`} />
              </FormField>
              {!shownErrors.description && (
                <div id={fieldHintId(DRIVE_FIELD_IDS.description)} className="field-hint flex justify-between gap-3">
                  <span>Responsibilities, requirements and selection process.</span>
                  <span className="font-mono">{form.description.length} chars</span>
                </div>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id={DRIVE_FIELD_IDS.location} label="Location" required error={shownErrors.location}>
                <input type="text" placeholder="e.g. Bengaluru" {...field('location')} />
              </FormField>
              <FormField id={DRIVE_FIELD_IDS.employmentType} label="Employment type" required error={shownErrors.employmentType}>
                <select {...field('employmentType')}>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </Section>

          <Section number="02" title="Compensation" hint="Annual CTC in lakhs per annum.">
            <FormField
              id={DRIVE_FIELD_IDS.packageLpa}
              label="Package (LPA)"
              required
              hint="For internships and contracts, enter the annualised amount."
              error={shownErrors.packageLpa}
              className="max-w-70"
            >
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 12.5"
                  {...field('packageLpa', { hint: true })}
                  className={`${inputClassName(Boolean(shownErrors.packageLpa))} pr-12`}
                />
                <span aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                  LPA
                </span>
              </div>
            </FormField>
          </Section>

          <Section number="03" title="Eligibility" hint="Students who don’t meet these can view but not apply.">
            <div className="grid max-w-140 gap-5 sm:grid-cols-2">
              <FormField id={DRIVE_FIELD_IDS.minCgpa} label="Minimum CGPA" required hint="0.00 – 10.00" error={shownErrors.minCgpa}>
                <input type="text" inputMode="decimal" placeholder="e.g. 7.5" {...field('minCgpa', { hint: true })} />
              </FormField>
              <FormField
                id={DRIVE_FIELD_IDS.maxBacklogs}
                label="Max active backlogs"
                required
                hint="0 means no backlogs allowed."
                error={shownErrors.maxBacklogs}
              >
                <input type="text" inputMode="numeric" {...field('maxBacklogs', { hint: true })} />
              </FormField>
            </div>
            <fieldset id={DRIVE_FIELD_IDS.allowedBranches} aria-describedby="drive-branches-hint" className="m-0 border-0 p-0">
              <legend className="field-label">Allowed branches</legend>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((branch) => (
                  <label key={branch} className="check-pill">
                    <input
                      type="checkbox"
                      checked={form.allowedBranches.includes(branch)}
                      onChange={() => toggleBranch(branch)}
                    />
                    {branch}
                  </label>
                ))}
              </div>
              <p id="drive-branches-hint" className="field-hint">
                {branchHint}
              </p>
            </fieldset>
          </Section>

          <Section number="04" title="Application settings">
            <FormField
              id={DRIVE_FIELD_IDS.deadline}
              label="Application deadline"
              required
              hint={deadlineHint}
              error={shownErrors.deadline}
              className="max-w-70"
            >
              <input type="date" min={toDateInputValue(new Date())} {...field('deadline', { hint: true })} />
            </FormField>
            <div className="flex max-w-140 items-start gap-3 rounded-lg border border-line p-3.5 text-[13px] leading-normal">
              <StatusBadge status={isEdit ? drive.status : 'OPEN'} />
              <span className="text-muted">
                {isEdit
                  ? 'Close or reopen this drive from the drives table.'
                  : 'New drives are created as OPEN. You can close or reopen this drive later from the drives table.'}
              </span>
            </div>
          </Section>

          <div className="flex flex-wrap justify-between gap-2.5 border-t border-ink pt-6">
            <Link to="/recruiter/drives" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} aria-busy={saving} className="btn">
              {saving && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create drive'}
            </button>
          </div>
        </form>

        <StudentPreview form={form} company={company} errors={errors} submitAttempted={submitAttempted} />
      </div>
    </div>
  );
}
