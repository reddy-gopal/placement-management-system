import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getAdminApplications, getAdminCompanies, getAdminDrives } from '../../services/adminApi';
import { deleteDrive, updateDriveStatus } from '../../services/driveApi';
import PageHeader from '../../components/ui/PageHeader';
import CompanyLogo from '../../components/ui/CompanyLogo';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import SearchField from '../../components/admin/SearchField';
import {
  applicationCountByDrive,
  companyName,
  driveStatusCounts,
  drivesWithAcceptedOffers,
  eligibilityLabel,
  refId,
} from '../../components/admin/adminInsights';
import { formatCount, formatDate, formatLpa } from '../../utils/format';

const VIEWS = [
  { id: 'companies', label: 'Companies' },
  { id: 'drives', label: 'Job drives' },
];
const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'DRAFT', label: 'Draft' },
];
const DRIVE_GRID =
  'grid grid-cols-[minmax(200px,1.6fr)_minmax(140px,1fr)_110px_80px_120px_minmax(200px,1.3fr)_70px_170px] items-center gap-3 px-4';

async function loadCompaniesAndDrives() {
  const [companies, drives, applications] = await Promise.all([
    getAdminCompanies(),
    getAdminDrives(),
    getAdminApplications(),
  ]);
  return { companies: companies ?? [], drives: drives ?? [], applications: applications ?? [] };
}

const deadlineTime = (drive) => new Date(drive.deadline).getTime() || 0;

/** Full URL plus a short display form ("arcline.example") for a company website. */
function websiteLink(website) {
  if (!website) return null;
  const href = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  try {
    return { href, label: new URL(href).host.replace(/^www\./, '') };
  } catch {
    return null;
  }
}

/** Two-column label/value line used in the company profile. */
function DetailLine({ label, children, mono = false }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-line py-2.5 text-[13px] sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`min-w-0 wrap-break-word ${mono ? 'font-mono' : ''}`}>{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

/** Left column: searchable list of companies. */
function CompanyList({ companies, driveCounts, selectedId, onSelect, query, onQuery }) {
  return (
    <section aria-label="Company directory" className="flex flex-col gap-3">
      <SearchField label="Search companies" placeholder="Search companies" value={query} onChange={onQuery} />
      {companies.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted">No companies match “{query}”.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {companies.map((company) => {
            const selected = company._id === selectedId;
            const drives = driveCounts.get(company._id) ?? 0;
            return (
              <li key={company._id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(company._id)}
                  className={`grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-md p-3 text-left hover:bg-subtle ${
                    selected ? 'bg-subtle shadow-[inset_0_0_0_1px_#111]' : ''
                  }`}
                >
                  <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={40} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{company.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{company.industry || 'Industry not set'}</span>
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {drives} drive{drives === 1 ? '' : 's'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Right column: the selected company's profile, recruiter, contact and drives. */
function CompanyProfile({ company, drives }) {
  const site = websiteLink(company.website);
  const sorted = [...drives].sort((a, b) => deadlineTime(b) - deadlineTime(a));
  return (
    <section aria-label="Company profile" className="flex min-w-0 flex-col gap-7">
      <div className="flex items-center gap-4.5">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={64} className="rounded-xl! text-xl!" />
        <div className="min-w-0">
          <h2 className="text-[26px] font-semibold leading-tight tracking-tight">{company.name}</h2>
          <div className="mt-1 text-sm text-muted">
            {company.industry || 'Industry not set'}
            {site && (
              <>
                {' · '}
                <a href={site.href} target="_blank" rel="noreferrer" className="text-muted underline hover:text-ink">
                  {site.label} ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {company.description ? (
        <p className="prose-body max-w-180">{company.description}</p>
      ) : (
        <p className="text-sm text-muted">This company hasn’t added a description yet.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
        <div>
          <h3 className="eyebrow pb-1.5">Recruiter</h3>
          <dl>
            <DetailLine label="Name">
              <span className="font-medium">{company.recruiterId?.name}</span>
            </DetailLine>
            <DetailLine label="Account email">{company.recruiterId?.email}</DetailLine>
          </dl>
        </div>
        <div>
          <h3 className="eyebrow pb-1.5">Company contact</h3>
          <dl>
            <DetailLine label="Email">{company.contactEmail}</DetailLine>
            <DetailLine label="Phone" mono>
              {company.contactPhone}
            </DetailLine>
          </dl>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline justify-between pb-2.5">
          <h3 className="text-base font-semibold">Job drives</h3>
          <span className="text-xs text-muted">{drives.length} total</span>
        </div>
        {sorted.length === 0 ? (
          <p className="border-t border-line py-4 text-sm text-muted">No job drives posted yet.</p>
        ) : (
          <ul>
            {sorted.map((drive) => (
              <li
                key={drive._id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-t border-line py-3 text-[13px] sm:grid-cols-[minmax(0,1fr)_100px_90px_110px]"
              >
                <span className="text-sm font-semibold">{drive.title}</span>
                <span>
                  <StatusBadge status={drive.status} />
                </span>
                <span>
                  <strong>{formatLpa(drive.packageLpa)}</strong> <span className="text-muted">LPA</span>
                </span>
                <span className="font-mono text-xs text-muted">{formatDate(drive.deadline)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CompaniesView({ companies, drives }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const driveCounts = useMemo(() => {
    const map = new Map();
    drives.forEach((d) => {
      const id = refId(d.companyId);
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    });
    return map;
  }, [drives]);

  const needle = query.trim().toLowerCase();
  const visible = companies.filter(
    (c) => !needle || [c.name, c.industry].some((v) => String(v ?? '').toLowerCase().includes(needle))
  );
  const selected = companies.find((c) => c._id === selectedId) ?? visible[0] ?? companies[0];

  if (!companies.length) {
    return (
      <EmptyState title="No companies yet" message="Companies appear here once a recruiter creates their company profile." />
    );
  }

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
      <CompanyList
        companies={visible}
        driveCounts={driveCounts}
        selectedId={selected?._id}
        onSelect={setSelectedId}
        query={query}
        onQuery={setQuery}
      />
      {selected && <CompanyProfile company={selected} drives={drives.filter((d) => refId(d.companyId) === selected._id)} />}
    </div>
  );
}

/** Column header for the drives table; Deadline is sortable. */
function DeadlineHeader({ direction, onToggle }) {
  return (
    <span role="columnheader" aria-sort={direction === 'asc' ? 'ascending' : 'descending'} className="eyebrow">
      <button type="button" onClick={onToggle} className="eyebrow inline-flex items-center gap-1 rounded text-ink">
        Deadline <span aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>
      </button>
    </span>
  );
}

function DrivesView({ drives, applications, onCancel, onDelete }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('asc');

  const counts = driveStatusCounts(drives);
  const appCounts = useMemo(() => applicationCountByDrive(applications), [applications]);
  const locked = useMemo(() => drivesWithAcceptedOffers(applications), [applications]);
  const needle = query.trim().toLowerCase();
  const rows = drives
    .filter((d) => statusFilter === 'ALL' || d.status === statusFilter)
    .filter((d) => !needle || [d.title, companyName(d)].some((v) => String(v ?? '').toLowerCase().includes(needle)))
    .sort((a, b) => (direction === 'asc' ? 1 : -1) * (deadlineTime(a) - deadlineTime(b)));

  const filters = STATUS_FILTERS.filter((f) => f.value !== 'DRAFT' || counts.DRAFT > 0);

  return (
    <>
      <section aria-label="Drive filters" className="flex flex-wrap items-center justify-between gap-2.5">
        <div role="group" aria-label="Status" className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              className="chip"
              aria-pressed={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label} <span className="count">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <SearchField
          label="Search drives"
          placeholder="Search drives or companies"
          value={query}
          onChange={setQuery}
          className="w-full sm:w-80"
        />
      </section>

      <section aria-label="All job drives" className="relative overflow-x-auto rounded-lg border border-line">
        <div role="table" aria-label="Job drives" className="min-w-310">
          <div role="rowgroup">
            <div role="row" className={`${DRIVE_GRID} bg-subtle py-2.5`}>
              <span role="columnheader" className="eyebrow">Drive</span>
              <span role="columnheader" className="eyebrow">Company</span>
              <span role="columnheader" className="eyebrow">Status</span>
              <span role="columnheader" className="eyebrow">Package</span>
              <DeadlineHeader direction={direction} onToggle={() => setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))} />
              <span role="columnheader" className="eyebrow">Eligibility</span>
              <span role="columnheader" className="eyebrow">Apps</span>
              <span role="columnheader" className="eyebrow text-right">Action</span>
            </div>
          </div>
          <div role="rowgroup">
            {rows.map((drive) => {
              const isLocked = locked.has(drive._id);
              return (
                <div key={drive._id} role="row" className={`${DRIVE_GRID} border-t border-line py-3 text-[13px] hover:bg-[#FAFAFB]`}>
                  <span role="cell" className="text-sm font-semibold">{drive.title}</span>
                  <span role="cell" className="text-muted">{companyName(drive)}</span>
                  <span role="cell">
                    <StatusBadge status={drive.status} />
                  </span>
                  <span role="cell">
                    <strong>{formatLpa(drive.packageLpa)}</strong>
                    <span className="sr-only"> LPA</span>
                  </span>
                  <span role="cell" className="font-mono text-xs">{formatDate(drive.deadline)}</span>
                  <span role="cell" className="text-xs text-muted">{eligibilityLabel(drive)}</span>
                  <span role="cell" className="font-mono">{formatCount(appCounts.get(drive._id) ?? 0)}</span>
                  <span role="cell" className="flex justify-end gap-1.5">
                    {drive.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm px-2.5"
                        aria-label={`Cancel ${drive.title}`}
                        onClick={() => onCancel(drive)}
                      >
                        Cancel…
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm px-2.5"
                      aria-label={isLocked ? `Delete ${drive.title} (unavailable: has an accepted offer)` : `Delete ${drive.title}`}
                      title={isLocked ? 'Has an accepted offer — can’t be deleted' : 'Delete drive and its applications'}
                      disabled={isLocked}
                      onClick={() => onDelete(drive)}
                    >
                      Delete…
                    </button>
                  </span>
                </div>
              );
            })}
            {rows.length === 0 && (
              <div role="row">
                <p role="cell" className="border-t border-line p-10 text-center text-sm text-muted">
                  {drives.length === 0
                    ? 'No job drives have been posted yet.'
                    : needle
                      ? 'No drives match your search.'
                      : 'No drives with this status.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <p className="text-xs text-muted">
        Cancelling is final and stops further edits. Deleting a drive also deletes its applications, and isn’t possible once a
        student has accepted an offer on it.
      </p>
    </>
  );
}

/** /admin/companies — company directory and oversight of every job drive. */
export default function CompaniesDrives() {
  const { data, status, error, reload, setData } = useAsync(loadCompaniesAndDrives, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') === 'drives' ? 'drives' : 'companies';
  const [pending, setPending] = useState(null); // { action: 'cancel' | 'delete', drive }

  const selectView = (id) => setSearchParams(id === 'drives' ? { view: 'drives' } : {}, { replace: true });

  const onTabKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const next = view === 'companies' ? 'drives' : 'companies';
    selectView(next);
    document.getElementById(`admin-tab-${next}`)?.focus();
  };

  const confirmPending = async () => {
    const { action, drive } = pending;
    if (action === 'cancel') {
      const result = await updateDriveStatus(drive._id, 'CANCELLED');
      const nextStatus = result?.drive?.status ?? 'CANCELLED';
      setData((current) => ({
        ...current,
        drives: current.drives.map((d) => (d._id === drive._id ? { ...d, status: nextStatus } : d)),
      }));
    } else {
      await deleteDrive(drive._id);
      setData((current) => ({
        ...current,
        drives: current.drives.filter((d) => d._id !== drive._id),
        applications: current.applications.filter((app) => refId(app.driveId) !== drive._id),
      }));
    }
    setPending(null);
  };

  const pendingApps = pending
    ? (data?.applications ?? []).filter((app) => refId(app.driveId) === pending.drive._id).length
    : 0;

  const description =
    status === 'ready'
      ? `${formatCount(data.companies.length)} compan${data.companies.length === 1 ? 'y' : 'ies'} · ${formatCount(
          data.drives.length
        )} job drive${data.drives.length === 1 ? '' : 's'}`
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Companies & drives"
        description={description}
        actions={
          <div role="tablist" aria-label="View" className="segmented border border-line" onKeyDown={onTabKeyDown}>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                id={`admin-tab-${v.id}`}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                aria-controls="admin-companies-panel"
                tabIndex={view === v.id ? 0 : -1}
                onClick={() => selectView(v.id)}
                className="h-9! px-4"
              >
                {v.label}
              </button>
            ))}
          </div>
        }
      />

      <div
        id="admin-companies-panel"
        role="tabpanel"
        aria-labelledby={`admin-tab-${view}`}
        className="flex flex-col gap-6"
      >
        {status === 'loading' && <LoadingState label="Loading companies and drives…" rows={6} />}
        {status === 'error' && (
          <ErrorState title="We couldn't load companies and drives." message={error} onRetry={reload} />
        )}
        {status === 'ready' && view === 'companies' && <CompaniesView companies={data.companies} drives={data.drives} />}
        {status === 'ready' && view === 'drives' && (
          <DrivesView
            drives={data.drives}
            applications={data.applications}
            onCancel={(drive) => setPending({ action: 'cancel', drive })}
            onDelete={(drive) => setPending({ action: 'delete', drive })}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === 'delete' ? 'Delete job drive?' : 'Cancel job drive?'}
        confirmLabel={pending?.action === 'delete' ? 'Delete drive' : 'Cancel drive'}
        busyLabel={pending?.action === 'delete' ? 'Deleting…' : 'Cancelling…'}
        cancelLabel="Keep drive"
        onConfirm={confirmPending}
        onClose={() => setPending(null)}
      >
        {pending?.action === 'cancel' && (
          <p>
            <strong className="font-semibold">{pending.drive.title}</strong> at {companyName(pending.drive)} will be cancelled.
            Cancelling is final: the drive can’t be reopened or edited afterwards. Its {pendingApps} application
            {pendingApps === 1 ? '' : 's'} stay on record.
          </p>
        )}
        {pending?.action === 'delete' && (
          <p>
            <strong className="font-semibold">{pending.drive.title}</strong> at {companyName(pending.drive)} and its{' '}
            {pendingApps} application{pendingApps === 1 ? '' : 's'} will be permanently deleted. This can’t be undone.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
