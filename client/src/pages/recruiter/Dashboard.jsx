import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getMyCompany } from '../../services/companyApi';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import MetricStrip from '../../components/ui/MetricStrip';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import { CreateDriveLink, NoCompanyState } from '../../components/recruiter/RecruiterUi';
import {
  candidateOf,
  formatCgpa,
  interviewAt,
  listAllDrives,
  listApplicationsForDrives,
  shortDate,
} from '../../components/recruiter/recruiterData';
import { dailyApplications, summarize } from '../../components/recruiter/dashboardStats';
import { formatCount } from '../../utils/format';

/** Company, its drives and every application to them (the API has no single overview endpoint). */
async function loadOverview() {
  const company = await getMyCompany();
  if (!company) return { company: null, drives: [], applications: [] };
  const drives = await listAllDrives();
  const applications = await listApplicationsForDrives(drives);
  return { company, drives, applications };
}

const percent = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

function SectionTitle({ title, aside }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {aside}
    </div>
  );
}

/** 14-day bar chart: earlier week grey, this week black, today lime with its value on top. */
function ApplicationsChart({ applications }) {
  const days = useMemo(() => dailyApplications(applications), [applications]);
  const max = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const today = days[days.length - 1].count;

  return (
    <figure
      role="img"
      aria-label={`Daily applications over the last 14 days: ${total} in total, ${today} today.`}
      className="m-0 flex flex-col gap-2"
    >
      <div className="relative flex h-50 items-end gap-1 border-b border-ink pt-5 sm:gap-2">
        <div aria-hidden="true" className="absolute inset-x-0 top-5 border-t border-dashed border-line" />
        <div aria-hidden="true" className="absolute inset-x-0 top-27.5 border-t border-dashed border-line" />
        {days.map((day, index) => {
          const last = index === days.length - 1;
          const thisWeek = index >= days.length - 7;
          return (
            <div key={day.date.toISOString()} className="relative flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              {last && <span className="font-mono text-[11px] font-medium">{day.count}</span>}
              <div
                className={`w-full max-w-7 rounded-t-[3px] ${last ? 'border border-ink bg-lime' : thisWeek ? 'bg-ink' : 'bg-line-strong'}`}
                style={{ height: `${((day.count / max) * 100).toFixed(1)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[11px] text-muted" aria-hidden="true">
        <span>{shortDate(days[0].date)}</span>
        <span>{shortDate(days[6].date)}</span>
        <span className="font-medium text-ink">Today</span>
      </div>
    </figure>
  );
}

function PipelineBar({ label, value, total, tone = 'ink' }) {
  const fills = {
    ink: 'bg-ink',
    lime: 'bg-lime shadow-[inset_0_0_0_1px_#111]',
    muted: 'bg-line-strong',
  };
  return (
    <div>
      <div className={`mb-1.5 flex justify-between text-[13px] ${tone === 'muted' ? 'text-muted' : ''}`}>
        <span>{label}</span>
        <span className="font-mono">{formatCount(value)}</span>
      </div>
      <div
        className="h-2.5 rounded-xs bg-subtle"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <div className={`h-full rounded-xs ${fills[tone]}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

function Pipeline({ stats }) {
  return (
    <div className="flex flex-col gap-4.5 pt-1.5">
      <PipelineBar label="Applied" value={stats.applications} total={stats.applications} />
      <PipelineBar label="Shortlisted" value={stats.shortlisted} total={stats.applications} />
      <PipelineBar label="Selected" value={stats.selected} total={stats.applications} tone="lime" />
      <PipelineBar label="Rejected" value={stats.rejected} total={stats.applications} tone="muted" />
    </div>
  );
}

const RECENT_GRID = 'grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_60px_80px_120px] items-center gap-3';

function RecentApplications({ applications }) {
  const recent = [...applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (!recent.length) return <p className="border-t border-line py-6 text-sm text-muted">No applications yet.</p>;

  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-155">
        <div className={`${RECENT_GRID} pb-2`}>
          {['Candidate', 'Drive', 'CGPA', 'Applied', 'Status'].map((heading) => (
            <span key={heading} className="eyebrow">
              {heading}
            </span>
          ))}
        </div>
        <ul>
          {recent.map((application) => {
            const candidate = candidateOf(application);
            return (
              <li key={application._id}>
                <Link
                  to={`/recruiter/applications?drive=${application.drive._id}`}
                  className={`${RECENT_GRID} data-row py-3 text-[13px] text-ink`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{candidate.name}</span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">
                      {candidate.rollNumber} · {candidate.branch}
                    </span>
                  </span>
                  <span className="truncate text-muted">{application.drive.title}</span>
                  <span className="font-mono">{formatCgpa(candidate.cgpa)}</span>
                  <span className="font-mono text-xs text-muted">{shortDate(application.createdAt)}</span>
                  <span>
                    <StatusBadge status={application.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const monthOf = (date) => new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date).toUpperCase();
const timeOf = (date) => new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

function UpcomingInterviews({ interviews }) {
  if (!interviews.length) {
    return <p className="border-t border-line py-6 text-sm text-muted">No interviews scheduled. Schedule one when you shortlist a candidate.</p>;
  }
  return (
    <ul>
      {interviews.slice(0, 4).map((application, index) => {
        const when = interviewAt(application);
        return (
          <li key={application._id} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3.5 border-t border-line py-3">
            <div
              className={`flex h-13 flex-col items-center justify-center rounded-md border ${
                index === 0 ? 'border-ink bg-lime' : 'border-line bg-white'
              }`}
            >
              <span className="eyebrow text-[9px] text-ink">{monthOf(when)}</span>
              <span className="text-lg font-semibold leading-none">{when.getDate()}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{candidateOf(application).name}</div>
              <div className="mt-0.5 truncate text-xs text-muted">
                {timeOf(when)} · {application.drive.title}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Dashboard() {
  const { data, status, error, reload } = useAsync(loadOverview, []);
  const company = data?.company;
  useDashboardIdentity(company ? { subtitle: company.name } : null);

  const stats = useMemo(() => (data ? summarize(data.drives, data.applications) : null), [data]);

  if (status === 'loading') return <LoadingState label="Loading dashboard…" rows={5} />;
  if (status === 'error') return <ErrorState title="We couldn’t load your dashboard." message={error} onRetry={reload} />;
  if (!company) return <NoCompanyState />;

  const header = (
    <section className="flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <span className="eyebrow">{[company.name, company.industry].filter(Boolean).join(' · ')}</span>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[34px]">Hiring overview</h1>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Link to="/recruiter/applications" className="btn btn-secondary">
          Review applicants
        </Link>
        <CreateDriveLink />
      </div>
    </section>
  );

  if (!data.drives.length) {
    return (
      <div className="flex flex-col gap-9">
        {header}
        <EmptyState
          title="No job drives yet"
          message="Post your first drive to start receiving applications. Your hiring numbers will show up here."
          action={<CreateDriveLink />}
        />
      </div>
    );
  }

  const metrics = [
    { label: 'Job drives', value: formatCount(stats.drives), note: `${stats.closedDrives} closed · ${stats.cancelledDrives} cancelled` },
    {
      label: 'Open now',
      value: formatCount(stats.openDrives),
      note: stats.nextClosing ? `Next closes ${shortDate(stats.nextClosing)}` : 'None closing soon',
    },
    { label: 'Applications', value: formatCount(stats.applications), note: `+${stats.applicationsThisWeek} this week` },
    {
      label: 'Shortlisted',
      value: formatCount(stats.shortlisted),
      note: stats.applications ? `${percent(stats.shortlisted, stats.applications)}% of applicants` : 'No applicants yet',
      highlight: true,
    },
    { label: 'Interviews', value: formatCount(stats.interviewsThisWeek), note: 'Next 7 days' },
  ];

  return (
    <div className="flex flex-col gap-9">
      {header}

      <MetricStrip items={metrics} columns={5} />

      <div className="grid gap-10 min-[1100px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="chart-title">
          <SectionTitle
            title={<span id="chart-title">Applications received</span>}
            aside={<span className="text-xs text-muted">Last 14 days · all drives</span>}
          />
          <ApplicationsChart applications={data.applications} />
        </section>
        <section className="flex min-w-0 flex-col gap-4" aria-labelledby="pipeline-title">
          <SectionTitle title={<span id="pipeline-title">Pipeline</span>} aside={<span className="text-xs text-muted">All drives</span>} />
          <Pipeline stats={stats} />
        </section>
      </div>

      <div className="grid gap-10 min-[1100px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="recent-title">
          <SectionTitle
            title={<span id="recent-title">Recent applications</span>}
            aside={
              <Link to="/recruiter/applications" className="text-[13px] text-muted hover:text-ink">
                Open table →
              </Link>
            }
          />
          <RecentApplications applications={data.applications} />
        </section>
        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="interviews-title">
          <SectionTitle
            title={<span id="interviews-title">Upcoming interviews</span>}
            aside={<span className="text-xs text-muted">{stats.interviews.length} scheduled</span>}
          />
          <UpcomingInterviews interviews={stats.interviews} />
        </section>
      </div>
    </div>
  );
}
