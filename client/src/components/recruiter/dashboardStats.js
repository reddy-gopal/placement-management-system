import { interviewAt } from './recruiterData';

const DAY = 86_400_000;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const countBy = (items, predicate) => items.filter(predicate).length;

/** Applications per calendar day for the last `days` days, oldest first (today last). */
export function dailyApplications(applications, now = new Date(), days = 14) {
  const today = startOfDay(now);
  const buckets = Array.from({ length: days }, (_, index) => ({
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - index)),
    count: 0,
  }));
  const first = buckets[0].date.getTime();
  applications.forEach((application) => {
    const created = application.createdAt ? new Date(application.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) return;
    const index = Math.round((startOfDay(created).getTime() - first) / DAY);
    if (index >= 0 && index < days) buckets[index].count += 1;
  });
  return buckets;
}

/** Upcoming interviews (soonest first) across all drives. */
export function upcomingInterviews(applications, now = new Date()) {
  return applications
    .filter((application) => application.status === 'SHORTLISTED' && interviewAt(application) > now)
    .sort((a, b) => interviewAt(a) - interviewAt(b));
}

/** Every number shown on the recruiter dashboard, derived from real drives and applications. */
export function summarize(drives, applications, now = new Date()) {
  const openDrives = drives.filter((drive) => drive.status === 'OPEN');
  const nextClosing = openDrives
    .map((drive) => new Date(drive.deadline))
    .filter((deadline) => deadline > now)
    .sort((a, b) => a - b)[0];
  const weekAgo = new Date(now.getTime() - 7 * DAY);
  const inAWeek = new Date(now.getTime() + 7 * DAY);
  const interviews = upcomingInterviews(applications, now);

  return {
    drives: drives.length,
    closedDrives: countBy(drives, (drive) => drive.status === 'CLOSED'),
    cancelledDrives: countBy(drives, (drive) => drive.status === 'CANCELLED'),
    openDrives: openDrives.length,
    nextClosing: nextClosing ?? null,
    applications: applications.length,
    applicationsThisWeek: countBy(applications, (a) => a.createdAt && new Date(a.createdAt) >= weekAgo),
    shortlisted: countBy(applications, (a) => a.status === 'SHORTLISTED'),
    selected: countBy(applications, (a) => a.status === 'SELECTED'),
    rejected: countBy(applications, (a) => a.status === 'REJECTED'),
    interviews,
    interviewsThisWeek: countBy(interviews, (a) => interviewAt(a) <= inAWeek),
  };
}
