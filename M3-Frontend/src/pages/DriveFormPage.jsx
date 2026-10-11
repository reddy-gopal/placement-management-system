import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  GraduationCap,
  IndianRupee,
  MapPin,
  Rocket,
  Save,
  UsersRound
} from 'lucide-react';
import { recruiterApi } from '../api/recruiterApi.js';
import {
  Button,
  ErrorPanel,
  Field,
  LoadingPanel,
  Notice,
  PageHeader,
  StatusBadge,
  Toast
} from '../components/ui.jsx';

const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI & DS'];
const employmentTypes = [
  { value: 'FULL_TIME', label: 'Full time', description: 'Permanent graduate role' },
  { value: 'INTERNSHIP', label: 'Internship', description: 'Time-bound learning role' },
  { value: 'CONTRACT', label: 'Contract', description: 'Fixed-term engagement' }
];

const initialForm = {
  title: '',
  description: '',
  packageLpa: '',
  location: '',
  employmentType: 'FULL_TIME',
  deadline: '',
  minCgpa: '6',
  maxBacklogs: '0',
  allowedBranches: []
};

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

const validate = (form) => {
  const errors = {};
  if (form.title.trim().length < 2) errors.title = 'Enter a job title.';
  if (form.description.trim().length < 10) errors.description = 'Describe the role in at least 10 characters.';
  if (form.packageLpa === '' || Number(form.packageLpa) < 0) errors.packageLpa = 'Enter a valid non-negative package.';
  if (form.location.trim().length < 2) errors.location = 'Enter a work location.';
  if (!form.deadline || new Date(form.deadline) <= new Date()) errors.deadline = 'Choose a future application deadline.';
  if (Number(form.minCgpa) < 0 || Number(form.minCgpa) > 10) errors.minCgpa = 'CGPA must be between 0 and 10.';
  if (!Number.isInteger(Number(form.maxBacklogs)) || Number(form.maxBacklogs) < 0) errors.maxBacklogs = 'Backlogs must be a whole number.';
  if (!form.allowedBranches.length) errors.allowedBranches = 'Select at least one eligible branch.';
  return errors;
};

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  packageLpa: Number(form.packageLpa),
  location: form.location.trim(),
  employmentType: form.employmentType,
  deadline: new Date(form.deadline).toISOString(),
  eligibility: {
    minCgpa: Number(form.minCgpa),
    maxBacklogs: Number(form.maxBacklogs),
    allowedBranches: form.allowedBranches
  }
});

export default function DriveFormPage() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(driveId);
  const [form, setForm] = useState(initialForm);
  const [drive, setDrive] = useState(null);
  const [companyReady, setCompanyReady] = useState(true);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ loading: true, saving: false, error: '' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await recruiterApi.getCompany();
        if (isEdit) {
          const result = await recruiterApi.getDrive(driveId);
          const item = result.drive;
          setDrive(item);
          setForm({
            title: item.title,
            description: item.description,
            packageLpa: String(item.packageLpa),
            location: item.location,
            employmentType: item.employmentType,
            deadline: toLocalDateTime(item.deadline),
            minCgpa: String(item.eligibility.minCgpa),
            maxBacklogs: String(item.eligibility.maxBacklogs),
            allowedBranches: item.eligibility.allowedBranches
          });
        }
      } catch (error) {
        if (error.code === 'COMPANY_NOT_FOUND' || error.code === 'COMPANY_PROFILE_REQUIRED' || error.status === 404 && !isEdit) {
          setCompanyReady(false);
        } else {
          setState((current) => ({ ...current, error: error.message }));
        }
      } finally {
        setState((current) => ({ ...current, loading: false }));
      }
    };
    load();
  }, [driveId, isEdit]);

  const minimumDeadline = useMemo(() => toLocalDateTime(new Date(Date.now() + 60_000)), []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const toggleBranch = (branch) => {
    const selected = form.allowedBranches.includes(branch);
    update('allowedBranches', selected
      ? form.allowedBranches.filter((item) => item !== branch)
      : [...form.allowedBranches, branch]);
  };

  const save = async (status) => {
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setState((current) => ({ ...current, saving: true, error: '' }));
    try {
      if (isEdit) {
        const result = await recruiterApi.updateDrive(driveId, toPayload(form));
        setDrive(result.drive);
        setToast('Placement drive updated successfully.');
      } else {
        await recruiterApi.createDrive({ ...toPayload(form), status });
        navigate('/recruiter/drives', { replace: true });
      }
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, saving: false }));
    }
  };

  const changeStatus = async () => {
    const nextStatus = drive.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setState((current) => ({ ...current, saving: true, error: '' }));
    try {
      const result = await recruiterApi.updateDriveStatus(driveId, nextStatus);
      setDrive(result.drive);
      setToast(`Placement drive is now ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, saving: false }));
    }
  };

  if (state.loading) return <LoadingPanel label={isEdit ? 'Loading placement drive…' : 'Preparing drive form…'} />;
  if (!companyReady) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up pt-8">
        <div className="surface-card p-7 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Building2 size={25} /></div>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Set up your company first</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">A company profile is required before you can publish a placement drive.</p>
          <Link to="/recruiter/company" className="mt-6 inline-block"><Button size="lg">Complete company profile</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-7">
      <Link to="/recruiter/drives" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300">
        <ArrowLeft size={16} /> Back to placement drives
      </Link>

      <PageHeader
        eyebrow={isEdit ? 'Edit placement drive' : 'New placement drive'}
        title={isEdit ? 'Refine this opportunity' : 'Create a campus opportunity'}
        description={isEdit ? 'Keep job information and eligibility criteria accurate for students.' : 'Share the role, compensation, deadline, and clear eligibility expectations.'}
        actions={isEdit && drive ? <StatusBadge status={drive.status} /> : null}
      />

      {state.error && <ErrorPanel message={state.error} />}

      <section className="surface-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b pb-5">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><BriefcaseBusiness size={20} /></div>
          <div><h2 className="font-bold text-slate-950 dark:text-white">Role details</h2><p className="mt-0.5 text-xs text-slate-500">The opportunity students will discover</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Job title" error={errors.title} required className="sm:col-span-2">
            <input className="field-control" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Graduate Software Engineer" />
          </Field>
          <Field label="Role description" error={errors.description} hint={`${form.description.length}/5000 characters`} required className="sm:col-span-2">
            <textarea className="field-control min-h-40 resize-y" maxLength={5000} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe responsibilities, team, growth opportunities, and the hiring process…" />
          </Field>
          <Field label="Package (LPA)" error={errors.packageLpa} required>
            <div className="relative"><IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="number" min="0" max="1000" step="0.1" className="field-control pl-10" value={form.packageLpa} onChange={(event) => update('packageLpa', event.target.value)} placeholder="8.5" /></div>
          </Field>
          <Field label="Location" error={errors.location} required>
            <div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className="field-control pl-10" value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Hyderabad / Remote" /></div>
          </Field>
          <Field label="Application deadline" error={errors.deadline} required className="sm:col-span-2">
            <div className="relative"><CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="datetime-local" min={minimumDeadline} className="field-control pl-10" value={form.deadline} onChange={(event) => update('deadline', event.target.value)} /></div>
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Employment type <span className="text-rose-500">*</span></p>
          <div className="grid gap-3 sm:grid-cols-3">
            {employmentTypes.map((type) => {
              const selected = form.employmentType === type.value;
              return (
                <button key={type.value} type="button" onClick={() => update('employmentType', type.value)} className={`focus-ring rounded-xl border p-4 text-left transition ${selected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/15 dark:bg-indigo-500/10' : 'bg-white hover:border-indigo-300 dark:bg-slate-900/50'}`}>
                  <span className="flex items-center justify-between font-bold text-slate-900 dark:text-white">{type.label}{selected && <Check size={16} className="text-indigo-600 dark:text-indigo-300" />}</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{type.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3 border-b pb-5">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><GraduationCap size={20} /></div>
          <div><h2 className="font-bold text-slate-950 dark:text-white">Eligibility criteria</h2><p className="mt-0.5 text-xs text-slate-500">Transparent rules for automatic eligibility checks</p></div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Minimum CGPA" error={errors.minCgpa} required>
            <input type="number" min="0" max="10" step="0.1" className="field-control" value={form.minCgpa} onChange={(event) => update('minCgpa', event.target.value)} />
          </Field>
          <Field label="Maximum active backlogs" error={errors.maxBacklogs} required>
            <input type="number" min="0" max="100" step="1" className="field-control" value={form.maxBacklogs} onChange={(event) => update('maxBacklogs', event.target.value)} />
          </Field>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Allowed branches <span className="text-rose-500">*</span></p>
            <span className="text-xs text-slate-400">{form.allowedBranches.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {branches.map((branch) => {
              const selected = form.allowedBranches.includes(branch);
              return (
                <button key={branch} type="button" onClick={() => toggleBranch(branch)} className={`focus-ring inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-bold transition ${selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-900/50 dark:text-slate-300'}`}>
                  {selected && <Check size={14} />} {branch}
                </button>
              );
            })}
          </div>
          {errors.allowedBranches && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{errors.allowedBranches}</p>}
        </div>
      </section>

      <Notice tone="amber">
        <span className="flex items-start gap-2"><UsersRound className="mt-0.5 shrink-0" size={17} /> Applicant review and candidate counts will connect automatically when the M5 application module is integrated.</span>
      </Notice>

      <div className="surface-card flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/recruiter/drives"><Button variant="ghost">Cancel</Button></Link>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isEdit ? (
            <>
              {drive?.status !== 'CANCELLED' && <Button variant="secondary" disabled={state.saving} onClick={changeStatus}>{drive?.status === 'OPEN' ? 'Close applications' : 'Open applications'}</Button>}
              <Button disabled={state.saving} onClick={() => save()}><Save size={17} /> {state.saving ? 'Saving…' : 'Save changes'}</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" disabled={state.saving} onClick={() => save('DRAFT')}><Save size={17} /> Save as draft</Button>
              <Button disabled={state.saving} onClick={() => save('OPEN')}><Rocket size={17} /> Publish drive</Button>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
