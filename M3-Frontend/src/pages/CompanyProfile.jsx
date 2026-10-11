import { useEffect, useState } from 'react';
import { Building2, ExternalLink, Mail, Phone, Save } from 'lucide-react';
import { recruiterApi } from '../api/recruiterApi.js';
import {
  Button,
  CompanyAvatar,
  ErrorPanel,
  Field,
  LoadingPanel,
  PageHeader,
  Toast
} from '../components/ui.jsx';

const emptyCompany = {
  name: '',
  website: '',
  industry: '',
  description: '',
  logoUrl: '',
  contactEmail: '',
  contactPhone: ''
};

const isHttpUrl = (value) => {
  if (!value) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const validate = (form) => {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Enter a company name with at least 2 characters.';
  if (!isHttpUrl(form.website)) errors.website = 'Enter a complete URL starting with http:// or https://.';
  if (!isHttpUrl(form.logoUrl)) errors.logoUrl = 'Enter a complete logo URL starting with http:// or https://.';
  if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) errors.contactEmail = 'Enter a valid contact email.';
  return errors;
};

export default function CompanyProfile() {
  const [form, setForm] = useState(emptyCompany);
  const [state, setState] = useState({ loading: true, saving: false, error: '' });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    recruiterApi.getCompany()
      .then(({ company }) => setForm(Object.fromEntries(
        Object.keys(emptyCompany).map((key) => [key, company[key] ?? ''])
      )))
      .catch((error) => {
        if (error.status !== 404) setState((current) => ({ ...current, error: error.message }));
      })
      .finally(() => setState((current) => ({ ...current, loading: false })));
  }, []);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setState((current) => ({ ...current, saving: true, error: '' }));
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null])
      );
      const { company } = await recruiterApi.saveCompany(payload);
      setForm(Object.fromEntries(Object.keys(emptyCompany).map((key) => [key, company[key] ?? ''])));
      setToast('Company profile saved successfully.');
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setState((current) => ({ ...current, saving: false }));
    }
  };

  if (state.loading) return <LoadingPanel label="Loading company profile…" />;

  return (
    <div className="animate-fade-up space-y-7">
      <PageHeader
        eyebrow="Company settings"
        title="Your company profile"
        description="Create a trusted employer presence that students will see alongside every placement drive."
      />

      {state.error && <ErrorPanel message={state.error} />}

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="surface-card p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3 border-b pb-5">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"><Building2 size={20} /></div>
              <div>
                <h2 className="font-bold text-slate-950 dark:text-white">Company identity</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Primary information shown on drive listings</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" error={errors.name} required>
                <input className="field-control" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Example Labs" />
              </Field>
              <Field label="Industry" hint="Fintech, IT Services, Automobile…">
                <input className="field-control" value={form.industry} onChange={(event) => update('industry', event.target.value)} placeholder="e.g. Software" />
              </Field>
              <Field label="Website" error={errors.website} className="sm:col-span-2">
                <div className="relative">
                  <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="field-control pl-10" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://company.com" />
                </div>
              </Field>
              <Field label="Company description" hint={`${form.description.length}/2000 characters`} className="sm:col-span-2">
                <textarea className="field-control min-h-32 resize-y" maxLength={2000} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Tell students what your company builds, values, and offers…" />
              </Field>
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3 border-b pb-5">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"><Mail size={20} /></div>
              <div>
                <h2 className="font-bold text-slate-950 dark:text-white">Brand and contact</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Recruiting contact details for your placement cell</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Logo URL" error={errors.logoUrl} className="sm:col-span-2">
                <input className="field-control" value={form.logoUrl} onChange={(event) => update('logoUrl', event.target.value)} placeholder="https://company.com/logo.png" />
              </Field>
              <Field label="Contact email" error={errors.contactEmail}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="email" className="field-control pl-10" value={form.contactEmail} onChange={(event) => update('contactEmail', event.target.value)} placeholder="hiring@company.com" />
                </div>
              </Field>
              <Field label="Contact phone">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="field-control pl-10" value={form.contactPhone} onChange={(event) => update('contactPhone', event.target.value)} placeholder="+91 90000 00000" />
                </div>
              </Field>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={state.saving}>
              <Save size={17} /> {state.saving ? 'Saving profile…' : 'Save company profile'}
            </Button>
          </div>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <div className="surface-card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500" />
            <div className="px-5 pb-5">
              <div className="-mt-8"><CompanyAvatar company={form} size="lg" /></div>
              <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">{form.name || 'Your company'}</h3>
              <p className="mt-1 text-sm font-medium text-indigo-600 dark:text-indigo-300">{form.industry || 'Industry'}</p>
              <p className="mt-4 line-clamp-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {form.description || 'Your company description will appear here for students reviewing placement opportunities.'}
              </p>
              <div className="mt-5 border-t pt-4 text-xs text-slate-500 dark:text-slate-400">
                <p className="truncate">{form.website || 'Website not added'}</p>
                <p className="mt-2 truncate">{form.contactEmail || 'Contact email not added'}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 px-2 text-center text-xs text-slate-400">Live preview of your student-facing profile</p>
        </aside>
      </form>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
