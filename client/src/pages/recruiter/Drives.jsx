import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getMyCompany } from '../../services/companyApi';
import { updateDriveStatus } from '../../services/driveApi';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import Alert from '../../components/ui/Alert';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { CreateDriveLink, NoCompanyState, RecruiterHeader, Toast } from '../../components/recruiter/RecruiterUi';
import DriveStatusMenu from '../../components/recruiter/DriveStatusMenu';
import DriveDetailsModal from '../../components/recruiter/DriveDetailsModal';
import { countApplicationsByDrive, listAllDrives, shortDate } from '../../components/recruiter/recruiterData';
import { EMPLOYMENT_TYPE_LABELS, employmentTypeLabel, formatDate, formatLpa } from '../../utils/format';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_MESSAGES = { OPEN: 'reopened', CLOSED: 'closed' };

const ROW_GRID =
  'grid grid-cols-[minmax(200px,2fr)_110px_90px_100px_110px_110px_270px] items-center gap-3 px-4';

/** Company, all of its drives, and the number of applications on each. */
async function loadDrives() {
  const company = await getMyCompany();
  if (!company) return { company: null, drives: [], counts: {} };
  const drives = await listAllDrives();
  const counts = await countApplicationsByDrive(drives);
  return { company, drives, counts };
}

function Controls({ statusFilter, onStatusFilter, counts, search, onSearch, type, onType }) {
  return (
    <section aria-label="Table controls" className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={statusFilter === filter.value}
            onClick={() => onStatusFilter(filter.value)}
            className="chip"
          >
            {filter.label} <span className="count">{counts[filter.value] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="flex w-full gap-2 sm:w-auto sm:flex-[0_1_420px]">
        <label className="search min-w-0 flex-1">
          <Search className="h-4 w-4 flex-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search drives"
            aria-label="Search drives"
          />
        </label>
        <select value={type} onChange={(event) => onType(event.target.value)} aria-label="Employment type" className="input w-auto">
          <option value="">All types</option>
          {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

function DriveRow({ drive, applications, maxApplications, busy, onView, onChangeStatus }) {
  return (
    <li className={`${ROW_GRID} data-row py-3.5 text-[13px]`}>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{drive.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {drive.location} · Posted {shortDate(drive.createdAt)}
        </span>
      </span>
      <span>
        <StatusBadge status={drive.status} />
      </span>
      <span>
        <strong className="font-semibold">{formatLpa(drive.packageLpa)}</strong> <span className="text-xs text-muted">LPA</span>
      </span>
      <span className="text-muted">{employmentTypeLabel(drive.employmentType)}</span>
      <span className="font-mono text-xs">{formatDate(drive.deadline)}</span>
      <span className="flex items-center gap-2">
        <span className="min-w-7 font-mono font-medium">{applications ?? '—'}</span>
        <span aria-hidden="true" className="h-1 max-w-14 flex-1 rounded-xs bg-[#f0f0f2]">
          <span
            className="block h-full rounded-xs bg-ink"
            style={{ width: `${maxApplications && applications ? Math.round((applications / maxApplications) * 100) : 0}%` }}
          />
        </span>
      </span>
      <span className="flex items-center justify-end gap-0.5">
        <button type="button" onClick={() => onView(drive)} className="rounded px-2 py-1.5 text-[13px] font-medium hover:bg-subtle">
          View<span className="sr-only"> {drive.title}</span>
        </button>
        {drive.status !== 'CANCELLED' && (
          <Link to={`/recruiter/drives/${drive._id}/edit`} className="rounded px-2 py-1.5 text-[13px] font-medium hover:bg-subtle">
            Edit<span className="sr-only"> {drive.title}</span>
          </Link>
        )}
        <Link
          to={`/recruiter/applications?drive=${drive._id}`}
          className="rounded px-2 py-1.5 text-[13px] font-medium underline underline-offset-2 hover:bg-subtle"
        >
          Applicants<span className="sr-only"> for {drive.title}</span> →
        </Link>
        <DriveStatusMenu drive={drive} onChangeStatus={onChangeStatus} disabled={busy} />
      </span>
    </li>
  );
}

function Pagination({ page, pageCount, total, onPage }) {
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(total, page * PAGE_SIZE);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
      <span>
        Showing {first}–{last} of {total}
      </span>
      <div className="flex gap-1.5">
        <button type="button" className="page-btn" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ‹
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            key={number}
            type="button"
            className="page-btn"
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPage(number)}
          >
            {number}
          </button>
        ))}
        <button type="button" className="page-btn" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
          ›
        </button>
      </div>
    </nav>
  );
}

export default function Drives() {
  const { data, status, error, reload, setData } = useAsync(loadDrives, []);
  const company = data?.company ?? null;
  useDashboardIdentity(company ? { subtitle: company.name } : null);

  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [actionError, setActionError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const hideToast = useCallback(() => setToast(''), []);

  // A success message handed over by the drive form (router state) is shown once.
  useEffect(() => {
    const flash = location.state?.flash;
    if (!flash) return;
    setToast(flash);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  const drives = data?.drives ?? [];
  const query = search.trim().toLowerCase();
  const matching = useMemo(
    () =>
      drives.filter(
        (drive) =>
          (!type || drive.employmentType === type) &&
          (!query || `${drive.title} ${drive.location}`.toLowerCase().includes(query))
      ),
    [drives, type, query]
  );
  const counts = useMemo(() => {
    const result = { ALL: matching.length };
    matching.forEach((drive) => {
      result[drive.status] = (result[drive.status] ?? 0) + 1;
    });
    return result;
  }, [matching]);
  const rows = useMemo(
    () =>
      matching
        .filter((drive) => statusFilter === 'ALL' || drive.status === statusFilter)
        .sort((a, b) => (new Date(a.deadline) - new Date(b.deadline)) * (sortAscending ? 1 : -1)),
    [matching, statusFilter, sortAscending]
  );
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const maxApplications = Math.max(0, ...Object.values(data?.counts ?? {}).filter(Number.isFinite));

  const filterBy = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const changeStatus = async (drive, nextStatus) => {
    setBusyId(drive._id);
    setActionError('');
    try {
      const result = await updateDriveStatus(drive._id, nextStatus);
      setData((current) => ({
        ...current,
        drives: current.drives.map((item) =>
          item._id === drive._id ? { ...item, status: result.drive?.status ?? nextStatus } : item
        ),
      }));
      setToast(`${drive.title} ${STATUS_MESSAGES[nextStatus] ?? 'updated'}`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (status === 'loading') return <LoadingState label="Loading job drives…" rows={5} />;
  if (status === 'error') return <ErrorState title="We couldn’t load your job drives." message={error} onRetry={reload} />;
  if (!company) return <NoCompanyState />;

  return (
    <div className="flex flex-col gap-6">
      <RecruiterHeader
        title="Job drives"
        description={`Drives posted by ${company.name}. Students only see OPEN drives before their deadline.`}
        actions={<CreateDriveLink />}
      />

      <Toast message={toast} onDismiss={hideToast} floating />
      {actionError && <Alert variant="error">{actionError}</Alert>}

      {!drives.length ? (
        <EmptyState
          title="No job drives yet"
          message="Create your first drive. It opens to eligible students as soon as it’s created."
          action={<CreateDriveLink />}
        />
      ) : (
        <>
          <Controls
            statusFilter={statusFilter}
            onStatusFilter={filterBy(setStatusFilter)}
            counts={counts}
            search={search}
            onSearch={filterBy(setSearch)}
            type={type}
            onType={filterBy(setType)}
          />

          <section aria-label="Job drives" className="relative overflow-x-auto rounded-lg border border-line">
            <div className="min-w-275 pb-1">
              <div className={`${ROW_GRID} data-head py-2.5`}>
                <span>Job title</span>
                <span>Status</span>
                <span>Package</span>
                <span>Type</span>
                <button
                  type="button"
                  onClick={() => setSortAscending((value) => !value)}
                  aria-label={`Sort by deadline, ${sortAscending ? 'descending' : 'ascending'}`}
                  className="inline-flex items-center gap-1 text-left font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink"
                >
                  Deadline <span aria-hidden="true">{sortAscending ? '↑' : '↓'}</span>
                </button>
                <span>Applications</span>
                <span className="text-right">Actions</span>
              </div>
              {pageRows.length ? (
                <ul>
                  {pageRows.map((drive) => (
                    <DriveRow
                      key={drive._id}
                      drive={drive}
                      applications={data.counts[drive._id]}
                      maxApplications={maxApplications}
                      busy={busyId === drive._id}
                      onView={setViewing}
                      onChangeStatus={changeStatus}
                    />
                  ))}
                </ul>
              ) : (
                <div className="border-t border-line px-6 py-12 text-center">
                  <p className="text-[15px] font-semibold">No drives match these filters</p>
                  <p className="mt-1.5 text-[13px] text-muted">Try another status or clear the search.</p>
                </div>
              )}
            </div>
          </section>

          <Pagination page={currentPage} pageCount={pageCount} total={rows.length} onPage={setPage} />
        </>
      )}

      <DriveDetailsModal
        drive={viewing}
        applications={viewing ? data.counts[viewing._id] : null}
        onClose={() => setViewing(null)}
      />
    </div>
  );
}
