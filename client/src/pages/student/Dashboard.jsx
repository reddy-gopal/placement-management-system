import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useOptionalAuth } from '../../context/AuthContext';
import { useDashboardIdentity } from '../../components/layout/dashboardIdentity';
import { listDrives } from '../../services/driveApi';
import { getStudentProfile } from '../../services/studentProfileApi';
import CompanyLogo from '../../components/ui/CompanyLogo';
import StatusBadge from '../../components/ui/StatusBadge';
import MetricStrip from '../../components/ui/MetricStrip';
import { ErrorState } from '../../components/ui/States';
import ProfileCompletionBar from '../../components/student/ProfileCompletionBar';
import OfferBanner from '../../components/student/OfferBanner';
import UpcomingInterviewCard from '../../components/student/UpcomingInterviewCard';
import DeadlinePill from '../../components/student/DeadlinePill';
import {
  applicationCompany,
  applicationsByDrive,
  loadMyApplications,
  offerText,
  pendingOffers,
  shortIneligibility,
} from '../../components/student/studentPortal';
import { getProfileCompleteness } from '../../utils/profileInsights';
import { formatLpa, timeAgo } from '../../utils/format';

const WEEK_MS = 7 * 86_400_000;

function greeting(now) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Sunday, 11 October" */
function todayLabel(now) {
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(now);
  return `${weekday}, ${date}`;
}

/** "Oct 11 · 09:15" */
function activityStamp(value) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} · ${time}`;
}
/**loading dashboard */
async function loadDashboard() {
  const [profile, applications, drives] = await Promise.all([
    getStudentProfile(),
    loadMyApplications(),
    listDrives({ limit: 100 }),
  ]);
  return { profile, applications, drives: drives.drives ?? [], totalDrives: drives.total ?? 0 };
}

function SectionHeader({ id, title, link, linkLabel }) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3">
      <h2 id={id} className="text-lg font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      {link && (
        <Link to={link} className="whitespace-nowrap text-[13px] text-muted hover:text-ink">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function QuietNote({ children }) {
  return <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-[13px] text-muted">{children}</p>;
}

function DriveRow({ drive, profile, application }) {
  const reason = shortIneligibility(drive, profile);
  const company = drive.companyId ?? {};
  let eligibility = <span className="text-success">✓ Eligible</span>;
  if (application) eligibility = <span className="text-ink">Applied</span>;
  else if (reason) eligibility = <span className="text-muted">{reason}</span>;

  return (
    <Link
      to={`/student/drives/${drive._id}`}
      className="data-row grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 md:grid-cols-[36px_minmax(0,1fr)_110px_130px_auto]"
    >
      <CompanyLogo name={company.name} logoUrl={company.logoUrl} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{drive.title}</span>
        <span className="truncate text-[13px] text-muted">
          {company.name} · {drive.location}
        </span>
      </span>
      <span className="hidden text-sm font-medium md:block">
        {formatLpa(drive.packageLpa)} <span className="text-xs font-normal text-muted">LPA</span>
      </span>
      <span className="hidden text-[13px] text-muted md:block">Posted {timeAgo(drive.createdAt)}</span>
      <span className="whitespace-nowrap text-xs font-medium">{eligibility}</span>
    </Link>
  );
}

function ActivityRow({ application }) {
  const drive = application.driveId ?? {};
  const offer = offerText(application);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-line py-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
      <span className="col-span-2 font-mono text-xs text-muted sm:col-span-1">{activityStamp(application.updatedAt)}</span>
      <span className="min-w-0 text-sm">
        <strong className="font-semibold">{applicationCompany(application).name}</strong>{' '}
        <span className="text-muted">
          · {drive.title}
          {offer && ` · ${offer.toLowerCase()}`}
        </span>
      </span>
      <StatusBadge status={application.status} />
    </div>
  );
}

/** Student home: greeting, profile completeness, pending offers, summary metrics, drives and activity. */
export default function Dashboard() {
  const user = useOptionalAuth()?.user;
  const { data, status, error, reload } = useAsync(loadDashboard, []);
  const now = useMemo(() => new Date(), []);

  const profile = data?.profile ?? null;
  useDashboardIdentity(profile || user ? { ...profile, name: user?.name } : null);

  const view = useMemo(() => {
    if (!data) return null;
    const { applications, drives } = data;
    const nowMs = now.getTime();
    const upcoming = applications
      .filter((a) => a.status === 'SHORTLISTED' && a.interview?.scheduledAt && new Date(a.interview.scheduledAt) > now)
      .sort((a, b) => new Date(a.interview.scheduledAt) - new Date(b.interview.scheduledAt));
    const applied = applicationsByDrive(applications);
    return {
      applied,
      offers: pendingOffers(applications),
      upcoming,
      eligibleCount: drives.filter((d) => d.isEligible).length,
      thisWeek: applications.filter((a) => nowMs - new Date(a.createdAt).getTime() < WEEK_MS).length,
      shortlisted: applications.filter((a) => a.status === 'SHORTLISTED').length,
      recentDrives: drives.slice(0, 5),
      closingSoon: drives
        .filter((d) => !applied.has(String(d._id)))
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 3),
      activity: [...applications].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5),
    };
  }, [data, now]);

  if (status === 'loading') return <DashboardSkeleton />;
  if (status === 'error') {
    return <ErrorState title="We couldn't load your dashboard." message={error} onRetry={() => reload()} />;
  }

  const { applications, totalDrives } = data;
  const completeness = getProfileCompleteness(profile);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const offersCount = view.offers.length;

  const metrics = [
    {
      label: 'Eligible opportunities',
      value: profile ? view.eligibleCount : '—',
      note: profile ? `of ${totalDrives} open drive${totalDrives === 1 ? '' : 's'}` : 'Create your profile to check',
    },
    { label: 'Applications', value: applications.length, note: `${view.thisWeek} this week` },
    {
      label: 'Shortlisted',
      value: view.shortlisted,
      highlight: view.shortlisted > 0,
      note: view.upcoming.length
        ? `${view.upcoming.length} interview${view.upcoming.length === 1 ? '' : 's'} scheduled`
        : 'No interviews scheduled',
    },
    profile?.isPlaced
      ? {
          label: 'Placement status',
          value: 'Placed',
          highlight: true,
          note: [profile.placedCompany, profile.packageLpa != null && `${formatLpa(profile.packageLpa)} LPA`]
            .filter(Boolean)
            .join(' · '),
        }
      : {
          label: 'Placement status',
          value: 'Not placed yet',
          note: offersCount
            ? `${offersCount} offer${offersCount === 1 ? '' : 's'} awaiting your response`
            : 'No offers yet',
        },
  ];

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="eyebrow">{todayLabel(now)}</span>
          <h1 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.035em] md:text-4xl">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-[13px] text-muted md:text-[15px]">
            {profile
              ? `${profile.branch} · Class of ${profile.graduationYear} · CGPA ${profile.cgpa} · ${profile.activeBacklogs} active backlog${profile.activeBacklogs === 1 ? '' : 's'}`
              : 'Set up your profile to see which drives you can apply to.'}
          </p>
        </div>
        <Link to="/student/drives" className="btn h-12 w-full px-5 sm:h-11 sm:w-auto">
          Explore opportunities
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>

      {completeness.percent < 100 && <ProfileCompletionBar completeness={completeness} hasProfile={Boolean(profile)} />}

      {view.offers.map((application) => (
        <OfferBanner key={application._id} application={application} />
      ))}

      <MetricStrip items={metrics} columns={4} />

      <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:gap-12">
        <section aria-labelledby="recent-drives" className="flex min-w-0 flex-col">
          <SectionHeader
            id="recent-drives"
            title="Recently posted drives"
            link={totalDrives ? '/student/drives' : null}
            linkLabel={`View all ${totalDrives} →`}
          />
          {view.recentDrives.length ? (
            <div className="border-b border-line">
              {view.recentDrives.map((drive) => (
                <DriveRow
                  key={drive._id}
                  drive={drive}
                  profile={profile}
                  application={view.applied.get(String(drive._id))}
                />
              ))}
            </div>
          ) : (
            <QuietNote>No drives are open right now. New drives from recruiters will show up here.</QuietNote>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="upcoming-interview" className="flex flex-col">
            <h2 id="upcoming-interview" className="mb-3 text-lg font-semibold tracking-[-0.01em]">
              Upcoming interview
            </h2>
            {view.upcoming[0] ? (
              <UpcomingInterviewCard application={view.upcoming[0]} />
            ) : (
              <QuietNote>No interviews scheduled. They appear here when a recruiter shortlists you.</QuietNote>
            )}
          </section>

          <section aria-labelledby="closing-soon" className="flex flex-col">
            <h2 id="closing-soon" className="mb-1 text-lg font-semibold tracking-[-0.01em]">
              Closing soon
            </h2>
            {view.closingSoon.length ? (
              view.closingSoon.map((drive) => (
                <Link
                  key={drive._id}
                  to={`/student/drives/${drive._id}`}
                  className="flex items-center justify-between gap-3 border-b border-line py-3 hover:bg-[#fafafb]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{drive.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{drive.companyId?.name}</span>
                  </span>
                  <DeadlinePill deadline={drive.deadline} />
                </Link>
              ))
            ) : (
              <p className="py-3 text-[13px] text-muted">No upcoming deadlines for drives you haven't applied to.</p>
            )}
          </section>
        </div>
      </div>

      <section aria-labelledby="recent-activity" className="flex flex-col">
        <SectionHeader
          id="recent-activity"
          title="Recent activity"
          link={applications.length ? '/student/applications' : null}
          linkLabel="All applications →"
        />
        {view.activity.length ? (
          view.activity.map((application) => <ActivityRow key={application._id} application={application} />)
        ) : (
          <QuietNote>
            You haven't applied anywhere yet.{' '}
            <Link to="/student/drives" className="text-ink underline underline-offset-2">
              Browse open drives
            </Link>
          </QuietNote>
        )}
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <p role="status" className="sr-only">
        Loading dashboard…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-9 w-80 max-w-full" />
        <div className="skeleton h-4 w-64 max-w-full" />
      </div>
      <div aria-hidden="true" className="skeleton h-14 w-full rounded-lg" />
      <div aria-hidden="true" className="skeleton h-32 w-full rounded-lg" />
      <div aria-hidden="true" className="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
        <div className="skeleton h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}
