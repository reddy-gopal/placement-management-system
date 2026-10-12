import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { getAdminApplications, getAdminDrives, getAdminStats, getAdminStudents } from '../../services/adminApi';
import PageHeader from '../../components/ui/PageHeader';
import MetricStrip from '../../components/ui/MetricStrip';
import StatusBadge from '../../components/ui/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';
import CumulativePlacementChart from '../../components/admin/CumulativePlacementChart';
import {
  activityTime,
  branchBreakdown,
  closingWithin,
  companyName,
  cumulativePlacements,
  formatPercent,
  percentOf,
  recentActivity,
  seasonLabel,
  upcomingDeadlines,
} from '../../components/admin/adminInsights';
import { formatCount, formatLpa } from '../../utils/format';

async function loadOverview() {
  const [stats, students, drives, applications] = await Promise.all([
    getAdminStats(),
    getAdminStudents(),
    getAdminDrives(),
    getAdminApplications(),
  ]);
  return { stats, students: students ?? [], drives: drives ?? [], applications: applications ?? [] };
}

/** The six headline figures from /admin/stats, with notes derived from the lists. */
function overviewMetrics({ stats, students, drives }) {
  const branches = new Set(students.map((s) => s.branch).filter(Boolean)).size;
  const closing = closingWithin(drives, 7);
  const perStudent = stats.totalStudents ? stats.totalApplications / stats.totalStudents : 0;
  return [
    { label: 'Students', value: formatCount(stats.totalStudents), note: `${branches} branch${branches === 1 ? '' : 'es'}` },
    { label: 'Companies', value: formatCount(stats.totalCompanies), note: `${formatCount(stats.totalRecruiters)} recruiters` },
    { label: 'Job drives', value: formatCount(stats.totalDrives), note: 'all statuses' },
    { label: 'Open drives', value: formatCount(stats.openDrives), note: `${closing} close this week` },
    { label: 'Applications', value: formatCount(stats.totalApplications), note: `${perStudent.toFixed(1)} per student` },
    {
      label: 'Placed',
      value: formatCount(stats.totalPlaced),
      highlight: true,
      note: (
        <>
          <strong className="font-semibold text-ink">{formatPercent(stats.placementPercentage)}</strong>
          {stats.totalPlaced ? ` · avg ${formatLpa(stats.avgPackage)} LPA` : ''}
        </>
      ),
    },
  ];
}

/** Placed/unplaced split bar plus one rate bar per branch (best rate in lime). */
function BranchPlacement({ students }) {
  const branches = branchBreakdown(students);
  const placed = students.filter((s) => s.isPlaced).length;
  const unplaced = students.length - placed;
  const share = percentOf(placed, students.length);

  return (
    <section aria-labelledby="branch-heading" className="flex min-w-0 flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 id="branch-heading" className="text-lg font-semibold">
          Placement by branch
        </h2>
        <Link to="/admin/reports" className="text-[13px] text-muted hover:text-ink">
          Reports →
        </Link>
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-muted">No student profiles yet.</p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${placed} placed, ${unplaced} not yet placed`}
            className="flex h-7 overflow-hidden rounded border border-ink text-xs"
          >
            {placed > 0 && (
              <div
                className="flex items-center whitespace-nowrap bg-ink pl-2.5 font-medium text-white"
                style={{ width: `${share}%` }}
              >
                {share >= 25 && `Placed ${formatCount(placed)}`}
              </div>
            )}
            <div className="flex flex-1 items-center justify-end whitespace-nowrap bg-white pr-2.5 text-muted">
              {share < 25 && placed > 0 && <span className="mr-auto pl-2.5 text-ink">Placed {formatCount(placed)}</span>}
              {unplaced > 0 && `Unplaced ${formatCount(unplaced)}`}
            </div>
          </div>
          <ul className="flex flex-col gap-3 pt-2" aria-label="Placement rate by branch">
            {branches.map((b, index) => (
              <li key={b.branch} className="grid grid-cols-[52px_minmax(0,1fr)_84px] items-center gap-3 text-[13px]">
                <span className="font-medium">{b.branch}</span>
                <span className="h-2 rounded-sm bg-[#F2F2F4]" aria-hidden="true">
                  <span
                    className={`block h-full rounded-sm ${index === 0 && b.placed > 0 ? 'bg-lime shadow-[inset_0_0_0_1px_#111]' : 'bg-ink'}`}
                    style={{ width: `${b.rate}%` }}
                  />
                </span>
                <span className="text-right font-mono text-xs">
                  <strong className="font-medium">{Math.round(b.rate)}%</strong>{' '}
                  <span className="text-muted">({b.placed})</span>
                  <span className="sr-only"> of {b.total} placed</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Feed of drives posted and shortlist/selection decisions, newest first. */
function RecentActivity({ events }) {
  return (
    <section aria-labelledby="activity-heading" className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between pb-3">
        <h2 id="activity-heading" className="text-lg font-semibold">
          Recent recruitment activity
        </h2>
        <span className="text-xs text-muted">All companies</span>
      </div>
      {events.length === 0 ? (
        <p className="border-t border-line py-4 text-sm text-muted">No recruitment activity yet.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li
              key={event.key}
              className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-t border-line py-3 text-[13px] sm:grid-cols-[96px_minmax(0,1fr)_auto]"
            >
              <span className="font-mono text-xs text-muted">{activityTime(event.at)}</span>
              <span className="min-w-0 leading-[1.45]">
                <strong className="font-semibold">{event.who}</strong> <span className="text-muted">{event.what}</span>
              </span>
              <span className="col-start-2 sm:col-start-auto">
                <StatusBadge status={event.status}>{event.status === 'SHORTLISTED' ? 'SHORTLIST' : undefined}</StatusBadge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const deadlineDate = (value) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(value)).toUpperCase();

/** Next open-drive deadlines; the soonest gets the lime date tile. */
function UpcomingDeadlines({ items }) {
  return (
    <section aria-labelledby="deadlines-heading" className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between pb-3">
        <h2 id="deadlines-heading" className="text-lg font-semibold">
          Upcoming deadlines
        </h2>
        <Link to="/admin/companies?view=drives" className="text-[13px] text-muted hover:text-ink">
          All drives →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="border-t border-line py-4 text-sm text-muted">No open drives with upcoming deadlines.</p>
      ) : (
        <ul>
          {items.map(({ drive, applications }, index) => (
            <li key={drive._id}>
              <Link
                to="/admin/companies?view=drives"
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3.5 border-t border-line py-3 hover:bg-[#FAFAFB]"
              >
                <span
                  className={`rounded border px-1.5 py-1 text-center font-mono text-xs font-medium ${
                    index === 0 ? 'border-ink bg-lime' : 'border-line bg-white'
                  }`}
                >
                  {deadlineDate(drive.deadline)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{drive.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{companyName(drive)}</span>
                </span>
                <span className="font-mono text-xs text-muted">{formatCount(applications)} apps</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** /admin — university-wide placement overview. */
export default function Overview() {
  const { data, status, error, reload } = useAsync(loadOverview, []);

  const derived = useMemo(() => {
    if (!data) return null;
    return {
      metrics: overviewMetrics(data),
      series: cumulativePlacements(data.applications),
      events: recentActivity(data.drives, data.applications),
      deadlines: upcomingDeadlines(data.drives, data.applications),
    };
  }, [data]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <PageHeader eyebrow={`Placement season ${seasonLabel()}`} title="University placement overview" />
      <span className="text-[13px] text-muted">All registered students · all batches</span>
    </div>
  );

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-9">
        {header}
        <LoadingState label="Loading placement overview…" rows={5} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-9">
        {header}
        <ErrorState title="We couldn't load the placement overview." message={error} onRetry={reload} />
      </div>
    );
  }

  const { stats, students } = data;
  const isEmpty = !stats.totalStudents && !stats.totalDrives && !stats.totalCompanies;

  return (
    <div className="flex flex-col gap-9">
      {header}

      <MetricStrip label="Key figures" items={derived.metrics} columns={6} />

      {isEmpty ? (
        <EmptyState
          title="Nothing to report yet"
          message="Once students create profiles and recruiters post job drives, placement activity shows up here."
        />
      ) : (
        <>
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <section aria-label="Placement trend" className="min-w-0">
              <CumulativePlacementChart series={derived.series} />
            </section>
            <BranchPlacement students={students} />
          </div>

          <div className="grid gap-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <RecentActivity events={derived.events} />
            <UpcomingDeadlines items={derived.deadlines} />
          </div>
        </>
      )}
    </div>
  );
}
