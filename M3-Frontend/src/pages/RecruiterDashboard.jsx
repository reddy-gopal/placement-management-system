import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleDot,
  Clock3,
  Plus,
  Sparkles
} from 'lucide-react';
import { recruiterApi } from '../api/recruiterApi.js';
import DriveCard from '../components/DriveCard.jsx';
import {
  Button,
  CompanyAvatar,
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  PageHeader,
  Toast
} from '../components/ui.jsx';

const statDefinitions = [
  { key: 'total', label: 'Total drives', icon: BriefcaseBusiness, style: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' },
  { key: 'OPEN', label: 'Open now', icon: CircleDot, style: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300' },
  { key: 'DRAFT', label: 'In draft', icon: Clock3, style: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' },
  { key: 'CLOSED', label: 'Closed', icon: Archive, style: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' }
];

export default function RecruiterDashboard() {
  const [state, setState] = useState({ loading: true, company: null, drives: [], stats: {}, error: '' });
  const [toast, setToast] = useState('');
  const [changingId, setChangingId] = useState('');

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const companyResult = await recruiterApi.getCompany()
        .catch((error) => error.status === 404 ? { company: null } : Promise.reject(error));

      if (!companyResult.company) {
        setState({ loading: false, company: null, drives: [], stats: { total: 0, OPEN: 0, DRAFT: 0, CLOSED: 0 }, error: '' });
        return;
      }

      const [recent, open, draft, closed] = await Promise.all([
        recruiterApi.getDrives({ page: 1, limit: 4 }),
        recruiterApi.getDrives({ page: 1, limit: 1, status: 'OPEN' }),
        recruiterApi.getDrives({ page: 1, limit: 1, status: 'DRAFT' }),
        recruiterApi.getDrives({ page: 1, limit: 1, status: 'CLOSED' })
      ]);
      setState({
        loading: false,
        company: companyResult.company,
        drives: recent.drives,
        stats: {
          total: recent.pagination.total,
          OPEN: open.pagination.total,
          DRAFT: draft.pagination.total,
          CLOSED: closed.pagination.total
        },
        error: ''
      });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (drive, status) => {
    setChangingId(drive._id);
    try {
      await recruiterApi.updateDriveStatus(drive._id, status);
      setToast(`${drive.title} is now ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setToast(error.message);
    } finally {
      setChangingId('');
    }
  };

  if (state.loading) return <LoadingPanel />;
  if (state.error) return <ErrorPanel message={state.error} onRetry={load} />;

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        eyebrow="Recruiter workspace"
        title="Build your next great team"
        description="Create focused campus drives, manage their lifecycle, and keep your hiring activity clear at a glance."
        actions={(
          <Link to="/recruiter/drives/new">
            <Button size="lg"><Plus size={18} /> Post new drive</Button>
          </Link>
        )}
      />

      {!state.company && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-glow dark:border-indigo-800">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold">Complete your company profile first</p>
                <p className="mt-1 text-sm text-indigo-100">Students trust drives with clear company branding and contact details.</p>
              </div>
            </div>
            <Link to="/recruiter/company" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
              Set up company <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Drive statistics">
        {statDefinitions.map(({ key, label, icon: Icon, style }, index) => (
          <article key={key} className="surface-card p-5" style={{ animationDelay: `${index * 70}ms` }}>
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 ${style}`}><Icon size={19} /></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</span>
            </div>
            <p className="mt-5 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{state.stats[key] ?? 0}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent placement drives</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your latest recruiting activity</p>
          </div>
          <Link to="/recruiter/drives" className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {state.drives.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {state.drives.map((drive) => (
              <DriveCard key={drive._id} drive={drive} onStatusChange={changeStatus} changingStatus={changingId === drive._id} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BriefcaseBusiness}
            title="No placement drives yet"
            description={state.company ? 'Publish your first campus opportunity and start building a candidate pipeline.' : 'Complete your company profile, then publish your first campus opportunity.'}
            action={state.company ? <Link to="/recruiter/drives/new"><Button><Plus size={16} /> Create first drive</Button></Link> : <Link to="/recruiter/company"><Button><Building2 size={16} /> Set up company</Button></Link>}
          />
        )}
      </section>

      {state.company && (
        <section className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CompanyAvatar company={state.company} size="lg" />
            <div>
              <p className="font-bold text-slate-950 dark:text-white">{state.company.name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{state.company.industry || 'Add your industry'} · {state.company.website || 'Add website'}</p>
            </div>
          </div>
          <Link to="/recruiter/company"><Button variant="secondary">Edit company profile</Button></Link>
        </section>
      )}

      {toast && <Toast message={toast} tone={toast.includes('now') ? 'success' : 'error'} onClose={() => setToast('')} />}
    </div>
  );
}
