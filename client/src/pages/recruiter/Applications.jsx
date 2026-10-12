import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getMyCompany } from '../../services/companyApi';
import { getDriveApplications, updateApplicationStatus } from '../../services/applicationApi';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { CreateDriveLink, NoCompanyState, Toast } from '../../components/recruiter/RecruiterUi';
import CandidateDrawer from '../../components/recruiter/CandidateDrawer';
import { RejectDialog, SelectDialog, ShortlistDialog } from '../../components/recruiter/ApplicationDialogs';
import {
  candidateOf,
  formatCgpa,
  listAllDrives,
  offerSummary,
  shortDate,
} from '../../components/recruiter/recruiterData';
import { daysUntil, formatDate, formatLpa } from '../../utils/format';

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
];

const SORTS = {
  date: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  cgpa: (a, b) => (Number(candidateOf(b).cgpa) || 0) - (Number(candidateOf(a).cgpa) || 0),
  name: (a, b) => candidateOf(a).name.localeCompare(candidateOf(b).name),
};

const ROW_GRID =
  'grid grid-cols-[minmax(180px,1.5fr)_60px_60px_56px_minmax(150px,1.2fr)_64px_70px_130px_170px] items-center gap-3 px-4';

async function loadCompanyAndDrives() {
  const company = await getMyCompany();
  if (!company) return { company: null, drives: [] };
  return { company, drives: await listAllDrives() };
}

/** "18.0 LPA · Closes 13 Oct · CGPA ≥ 7.5" */
function driveMeta(drive) {
  const closed = daysUntil(drive.deadline) < 0;
  return [
    `${formatLpa(drive.packageLpa)} LPA`,
    `${closed ? 'Closed' : 'Closes'} ${formatDate(drive.deadline, { withYear: false })}`,
    `CGPA ≥ ${drive.eligibility?.minCgpa ?? 0}`,
  ].join(' · ');
}

function DrivePicker({ drives, drive, onChange, search, onSearch, sort, onSort }) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex min-w-0 flex-col gap-2.5">
        <label htmlFor="drive-picker" className="eyebrow">
          Job drive
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <select
            id="drive-picker"
            value={drive._id}
            onChange={(event) => onChange(event.target.value)}
            className="input h-11 w-auto max-w-full pr-9 text-lg font-semibold tracking-[-0.01em]"
          >
            {drives.map((item) => (
              <option key={item._id} value={item._id}>
                {item.title}
                {item.status !== 'OPEN' ? ` (${item.status.toLowerCase()})` : ''}
              </option>
            ))}
          </select>
          <StatusBadge status={drive.status} />
          <span className="text-[13px] text-muted">{driveMeta(drive)}</span>
        </div>
      </div>
      <div className="flex w-full gap-2 sm:w-auto sm:flex-[0_1_460px]">
        <label className="search min-w-0 flex-1">
          <Search className="h-4 w-4 flex-none" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Name, roll number or skill"
            aria-label="Search candidates"
          />
        </label>
        <select value={sort} onChange={(event) => onSort(event.target.value)} aria-label="Sort candidates" className="input w-auto">
          <option value="date">Newest first</option>
          <option value="cgpa">CGPA high → low</option>
          <option value="name">Name A → Z</option>
        </select>
      </div>
    </section>
  );
}

function StatusTabs({ tab, onTab, counts }) {
  return (
    <div role="tablist" aria-label="Filter by status" className="relative flex overflow-x-auto border-b border-line">
      {TABS.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={tab === item.value}
          aria-controls="applications-panel"
          onClick={() => onTab(item.value)}
          className="tab"
        >
          {item.label}
          <span className="count">{counts[item.value] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function RowActions({ application, name, onShortlist, onSelect, onReject }) {
  if (application.status === 'APPLIED') {
    return (
      <>
        <button type="button" className="btn btn-sm" onClick={() => onShortlist(application)} aria-label={`Shortlist ${name}`}>
          Shortlist
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={() => onReject(application)} aria-label={`Reject ${name}`}>
          Reject
        </button>
      </>
    );
  }
  if (application.status === 'SHORTLISTED') {
    return (
      <>
        <button type="button" className="btn btn-sm" onClick={() => onSelect(application)} aria-label={`Select ${name}`}>
          Select
        </button>
        <button type="button" className="btn btn-danger btn-sm px-2.5" onClick={() => onReject(application)} aria-label={`Reject ${name}`}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </>
    );
  }
  return <span className="px-1 text-xs text-muted">Final outcome</span>;
}

function ApplicationRow({ application, selected, onOpen, actions }) {
  const candidate = candidateOf(application);
  const offer = offerSummary(application.offer);
  return (
    <li className={`${ROW_GRID} data-row py-3 text-[13px] ${selected ? 'bg-subtle' : ''}`}>
      <button
        type="button"
        onClick={() => onOpen(application)}
        aria-label={`Open details for ${candidate.name}`}
        className="group min-w-0 text-left"
      >
        <span className="block truncate text-sm font-semibold group-hover:underline">{candidate.name}</span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">{candidate.rollNumber}</span>
      </button>
      <span>{candidate.branch}</span>
      <span className="font-mono font-medium">{formatCgpa(candidate.cgpa)}</span>
      <span className="font-mono text-muted">{candidate.graduationYear}</span>
      <span className="flex flex-wrap gap-1">
        {candidate.skills.slice(0, 2).map((skill) => (
          <span key={skill} className="inline-flex h-5 items-center whitespace-nowrap rounded border border-line bg-subtle px-1.5 text-[11px]">
            {skill}
          </span>
        ))}
        {candidate.skills.length > 2 && (
          <span className="inline-flex h-5 items-center rounded border border-line bg-subtle px-1.5 text-[11px] text-muted">
            +{candidate.skills.length - 2}
          </span>
        )}
        {!candidate.skills.length && <span className="text-muted">—</span>}
      </span>
      {candidate.resumeUrl ? (
        <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-muted">
          Open ↗<span className="sr-only"> resume of {candidate.name}</span>
        </a>
      ) : (
        <span className="text-muted">—</span>
      )}
      <span className="font-mono text-xs text-muted">{shortDate(application.createdAt)}</span>
      <span className="flex flex-col items-start gap-1">
        <StatusBadge status={application.status} />
        {offer && <span className="text-[11px] text-muted">{offer}</span>}
      </span>
      <span className="flex justify-end gap-1.5">{actions}</span>
    </li>
  );
}

/** Applications to one drive: loads, filters, and moves candidates through the pipeline. */
function DriveApplications({ drive, search, sort, onToast }) {
  const { data, status, error, reload, setData } = useAsync(() => getDriveApplications(drive._id), [drive._id]);
  const [tab, setTab] = useState('ALL');
  const [openId, setOpenId] = useState(null);
  const [dialog, setDialog] = useState(null); // { kind: 'shortlist' | 'select' | 'reject', id }

  const applications = useMemo(() => data ?? [], [data]);
  const counts = useMemo(() => {
    const result = { ALL: applications.length };
    applications.forEach((application) => {
      result[application.status] = (result[application.status] ?? 0) + 1;
    });
    return result;
  }, [applications]);

  const query = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      applications
        .filter((application) => tab === 'ALL' || application.status === tab)
        .filter((application) => {
          if (!query) return true;
          const candidate = candidateOf(application);
          return [candidate.name, candidate.rollNumber, ...candidate.skills].join(' ').toLowerCase().includes(query);
        })
        .sort(SORTS[sort]),
    [applications, tab, query, sort]
  );

  const find = (id) => applications.find((application) => application._id === id) ?? null;
  const openApplication = find(openId);
  const dialogApplication = dialog ? find(dialog.id) : null;
  const ask = (kind) => (application) => setDialog({ kind, id: application._id });
  const closeDialog = () => setDialog(null);

  /** Sends the status change and merges the result (the response isn't populated, so keep the student). */
  const changeStatus = (nextStatus) => async (extra) => {
    const application = dialogApplication;
    const result = await updateApplicationStatus(application._id, { status: nextStatus, ...extra });
    const updated = result.application ?? {};
    setData((current) =>
      (current ?? []).map((item) =>
        item._id === application._id
          ? {
              ...item,
              status: updated.status ?? nextStatus,
              interview: updated.interview ?? item.interview,
              offer: updated.offer ?? item.offer,
            }
          : item
      )
    );
    setDialog(null);
    const name = candidateOf(application).name;
    if (nextStatus === 'SHORTLISTED')
      onToast(extra.interviewDate ? `${name} shortlisted · interview scheduled` : `${name} shortlisted`);
    else if (nextStatus === 'SELECTED')
      onToast(`${name} selected · offer sent${updated.offer?.deadline ? `, respond by ${formatDate(updated.offer.deadline, { withYear: false })}` : ''}`);
    else onToast(`${name} rejected`);
  };

  const handlers = { onShortlist: ask('shortlist'), onSelect: ask('select'), onReject: ask('reject') };

  let body;
  if (status === 'loading') body = <div className="p-4"><LoadingState label="Loading applications…" rows={4} /></div>;
  else if (status === 'error')
    body = (
      <div className="border-t border-line p-4">
        <ErrorState title="We couldn’t load applications for this drive." message={error} onRetry={reload} />
      </div>
    );
  else if (!rows.length)
    body = (
      <div className="border-t border-line px-6 py-12 text-center">
        <p className="text-[15px] font-semibold">{applications.length ? 'No candidates in this view' : 'No applications yet'}</p>
        <p className="mt-1.5 text-[13px] text-muted">
          {applications.length
            ? 'Try another status or clear the search.'
            : 'Eligible students who apply to this drive will appear here.'}
        </p>
      </div>
    );
  else
    body = (
      <ul>
        {rows.map((application) => (
          <ApplicationRow
            key={application._id}
            application={application}
            selected={application._id === openId}
            onOpen={(item) => setOpenId(item._id)}
            actions={<RowActions application={application} name={candidateOf(application).name} {...handlers} />}
          />
        ))}
      </ul>
    );

  return (
    <>
      <StatusTabs tab={tab} onTab={setTab} counts={counts} />

      <section
        id="applications-panel"
        role="tabpanel"
        aria-label="Applications"
        className="relative overflow-x-auto rounded-lg border border-line"
      >
        <div className="min-w-275">
          <div className={`${ROW_GRID} data-head py-2.5`}>
            {['Candidate', 'Branch', 'CGPA', 'Year', 'Skills', 'Resume', 'Applied', 'Status'].map((heading) => (
              <span key={heading}>{heading}</span>
            ))}
            <span className="text-right">Actions</span>
          </div>
          {body}
        </div>
      </section>

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-[13px] text-muted">
        <span>
          Showing {rows.length} of {applications.length}
        </span>
        <span>APPLIED → SHORTLISTED → SELECTED (offer sent), or REJECTED. Interviews are scheduled when shortlisting.</span>
      </div>

      <CandidateDrawer application={dialog ? null : openApplication} onClose={() => setOpenId(null)} {...handlers} />
      <ShortlistDialog
        application={dialog?.kind === 'shortlist' ? dialogApplication : null}
        drive={drive}
        onClose={closeDialog}
        onConfirm={changeStatus('SHORTLISTED')}
      />
      <SelectDialog
        application={dialog?.kind === 'select' ? dialogApplication : null}
        drive={drive}
        onClose={closeDialog}
        onConfirm={changeStatus('SELECTED')}
      />
      <RejectDialog
        application={dialog?.kind === 'reject' ? dialogApplication : null}
        drive={drive}
        onClose={closeDialog}
        onConfirm={changeStatus('REJECTED')}
      />
    </>
  );
}

export default function Applications() {
  const { data, status, error, reload } = useAsync(loadCompanyAndDrives, []);
  const company = data?.company ?? null;
  useDashboardIdentity(company ? { subtitle: company.name } : null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [toast, setToast] = useState('');
  const hideToast = useCallback(() => setToast(''), []);

  if (status === 'loading') return <LoadingState label="Loading applications…" rows={5} />;
  if (status === 'error') return <ErrorState title="We couldn’t load your job drives." message={error} onRetry={reload} />;
  if (!company) return <NoCompanyState />;
  if (!data.drives.length) {
    return (
      <EmptyState
        title="No job drives yet"
        message="Applications appear here once you post a drive and students apply."
        action={<CreateDriveLink />}
      />
    );
  }

  // ?drive=<id> preselects a drive; anything unknown falls back to the most recent one.
  const requestedId = searchParams.get('drive');
  const drive = data.drives.find((item) => item._id === requestedId) ?? data.drives[0];
  const selectDrive = (driveId) => setSearchParams({ drive: driveId }, { replace: true });

  return (
    <div className="flex flex-col gap-5">
      <DrivePicker
        drives={data.drives}
        drive={drive}
        onChange={selectDrive}
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
      />
      <DriveApplications key={drive._id} drive={drive} search={search} sort={sort} onToast={setToast} />
      <Toast message={toast} onDismiss={hideToast} floating />
    </div>
  );
}
