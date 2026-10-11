import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { recruiterApi } from '../api/recruiterApi.js';
import DriveCard from '../components/DriveCard.jsx';
import { Button, EmptyState, ErrorPanel, LoadingPanel, PageHeader, Toast } from '../components/ui.jsx';

const filters = [
  { label: 'All drives', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' }
];

export default function DrivesPage() {
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, drives: [], pagination: null, error: '' });
  const [changingId, setChangingId] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const result = await recruiterApi.getDrives({ status, search, page, limit: 8 });
      setState({ loading: false, drives: result.drives, pagination: result.pagination, error: '' });
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (drive, nextStatus) => {
    setChangingId(drive._id);
    try {
      await recruiterApi.updateDriveStatus(drive._id, nextStatus);
      setToast(`${drive.title} is now ${nextStatus.toLowerCase()}.`);
      await load();
    } catch (error) {
      setToast(error.message);
    } finally {
      setChangingId('');
    }
  };

  return (
    <div className="animate-fade-up space-y-7">
      <PageHeader
        eyebrow="Drive management"
        title="Placement drives"
        description="Create, refine, and control every opportunity published by your company."
        actions={<Link to="/recruiter/drives/new"><Button size="lg"><Plus size={18} /> Post new drive</Button></Link>}
      />

      <div className="surface-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="field-control pl-10"
              placeholder="Search by role title…"
              aria-label="Search placement drives"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-900/70">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => { setStatus(filter.value); setPage(1); }}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${status === filter.value ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {state.loading ? <LoadingPanel label="Loading placement drives…" /> : state.error ? (
        <ErrorPanel message={state.error} onRetry={load} />
      ) : state.drives.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {state.drives.map((drive) => (
              <DriveCard key={drive._id} drive={drive} onStatusChange={changeStatus} changingStatus={changingId === drive._id} />
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page <span className="font-bold text-slate-800 dark:text-slate-200">{state.pagination.page}</span> of {Math.max(state.pagination.totalPages, 1)} · {state.pagination.total} drives
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /> Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= state.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={16} /></Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={BriefcaseBusiness}
          title={search || status ? 'No drives match these filters' : 'No placement drives yet'}
          description={search || status ? 'Try changing the search phrase or selected status.' : 'Create your first campus opportunity to begin recruiting students.'}
          action={!search && !status ? <Link to="/recruiter/drives/new"><Button><Plus size={16} /> Create first drive</Button></Link> : null}
        />
      )}

      {toast && <Toast message={toast} tone={toast.includes('now') ? 'success' : 'error'} onClose={() => setToast('')} />}
    </div>
  );
}
