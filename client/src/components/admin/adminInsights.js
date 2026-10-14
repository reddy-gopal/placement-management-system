/**
 * Pure data derivations for the placement-cell (admin) screens. Everything here works on the
 * raw /admin/* payloads and tolerates populated references that are null (deleted documents).
 */

import { BRANCHES } from '../../constants/studentProfile';
import { EMPLOYMENT_TYPE_LABELS, formatLpa } from '../../utils/format';

const DAY = 86_400_000;

/** The id of a populated reference or a raw ObjectId string. */
export const refId = (value) => (value && typeof value === 'object' ? (value._id ?? null) : (value ?? null));

const toTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? null : time;
};

const round1 = (value) => Math.round(value * 10) / 10;

/** "42.8%" — one decimal, trailing ".0" dropped. */
export const formatPercent = (value) => `${round1(value).toString()}%`;

/** Share as a percentage (0 when the whole is 0). */
export const percentOf = (part, whole) => (whole ? (part / whole) * 100 : 0);

export const studentName = (student) => student?.userId?.name || 'Unknown student';
export const studentEmail = (student) => student?.userId?.email || '';
export const companyName = (drive) => drive?.companyId?.name || 'Unknown company';

/* ------------------------------------------------------------------ students */

/** Distinct graduation years, newest first. */
export function graduationYears(students = []) {
  return [...new Set(students.map((s) => s.graduationYear).filter(Boolean))].sort((a, b) => b - a);
}

/** Students of one batch (`year` falsy → everyone). */
export const inBatch = (students = [], year) =>
  year ? students.filter((s) => Number(s.graduationYear) === Number(year)) : students;

/**
 * Placement by branch: [{ branch, total, placed, rate }] for branches with students,
 * highest placement rate first (ties: larger branch first).
 */
export function branchBreakdown(students = []) {
  const groups = new Map();
  students.forEach((s) => {
    const branch = s.branch || 'Other';
    const group = groups.get(branch) ?? { branch, total: 0, placed: 0 };
    group.total += 1;
    if (s.isPlaced) group.placed += 1;
    groups.set(branch, group);
  });
  const order = (branch) => (BRANCHES.includes(branch) ? BRANCHES.indexOf(branch) : BRANCHES.length);
  return [...groups.values()]
    .map((g) => ({ ...g, rate: percentOf(g.placed, g.total) }))
    .sort((a, b) => b.rate - a.rate || b.total - a.total || order(a.branch) - order(b.branch));
}

/** Placed packages (LPA) of placed students that have one recorded. */
const placedPackages = (students = []) =>
  students
    .filter((s) => s.isPlaced && s.packageLpa !== null && s.packageLpa !== undefined && !Number.isNaN(Number(s.packageLpa)))
    .map((s) => Number(s.packageLpa));

/** { count, median, average, highest } of placed students' packages (nulls when none). */
export function packageStats(students = []) {
  const values = placedPackages(students).sort((a, b) => a - b);
  if (!values.length) return { count: 0, median: null, average: null, highest: null };
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  return { count: values.length, median, average, highest: values[values.length - 1] };
}
/** package bands */
export const PACKAGE_BANDS = [
  { label: '< 5', min: 0, max: 5 },
  { label: '5–8', min: 5, max: 8 },
  { label: '8–12', min: 8, max: 12 },
  { label: '12–16', min: 12, max: 16 },
  { label: '16–20', min: 16, max: 20 },
  { label: '20+', min: 20, max: Infinity },
];

/** Histogram of placed packages: [{ label, min, max, count, isPeak }]; lower bound inclusive. */
export function packageBands(students = []) {
  const values = placedPackages(students);
  const bands = PACKAGE_BANDS.map((band) => ({
    ...band,
    count: values.filter((v) => v >= band.min && v < band.max).length,
  }));
  const peak = Math.max(0, ...bands.map((b) => b.count));
  return bands.map((b) => ({ ...b, isPeak: peak > 0 && b.count === peak }));
}

/* -------------------------------------------------------------- applications */

/** Map of studentId → { total, APPLIED, SHORTLISTED, SELECTED, REJECTED, accepted } */
export function applicationsByStudent(applications = []) {
  const map = new Map();
  applications.forEach((app) => {
    const id = refId(app.studentId);
    if (!id) return;
    const entry = map.get(id) ?? { total: 0, APPLIED: 0, SHORTLISTED: 0, SELECTED: 0, REJECTED: 0, accepted: null };
    entry.total += 1;
    if (entry[app.status] !== undefined) entry[app.status] += 1;
    if (app.offer?.status === 'ACCEPTED') {
      entry.accepted = { company: app.driveId?.companyId?.name ?? null, respondedAt: app.offer.respondedAt ?? null };
    }
    map.set(id, entry);
  });
  return map;
}

/** Map of driveId → application count. */
export function applicationCountByDrive(applications = []) {
  const map = new Map();
  applications.forEach((app) => {
    const id = refId(app.driveId);
    if (id) map.set(id, (map.get(id) ?? 0) + 1);
  });
  return map;
}

/** Set of drive ids with at least one accepted offer (those drives can't be deleted). */
export function drivesWithAcceptedOffers(applications = []) {
  return new Set(
    applications.filter((app) => app.offer?.status === 'ACCEPTED').map((app) => refId(app.driveId)).filter(Boolean)
  );
}

/* -------------------------------------------------------------------- drives */

/** Whether `student` meets the drive's eligibility rules (mirrors the server's check). */
export function isEligible(student, drive) {
  if (!student || !drive) return false;
  const { minCgpa = 6, maxBacklogs = 0, allowedBranches = [] } = drive.eligibility || {};
  if (Number(student.cgpa) < minCgpa) return false;
  if (Number(student.activeBacklogs ?? 0) > maxBacklogs) return false;
  return !(allowedBranches.length && !allowedBranches.includes(student.branch));
}

/** OPEN drives whose deadline hasn't passed. */
export const activeOpenDrives = (drives = [], now = new Date()) =>
  drives.filter((d) => d.status === 'OPEN' && (toTime(d.deadline) ?? 0) > now.getTime());

/** "CGPA ≥ 7.5 · 0 backlogs · CSE, IT" */
export function eligibilityLabel(drive) {
  const { minCgpa, maxBacklogs = 0, allowedBranches = [] } = drive?.eligibility || {};
  const parts = [];
  if (minCgpa !== undefined && minCgpa !== null) parts.push(`CGPA ≥ ${minCgpa}`);
  parts.push(maxBacklogs ? `≤ ${maxBacklogs} backlog${maxBacklogs === 1 ? '' : 's'}` : '0 backlogs');
  parts.push(allowedBranches.length ? allowedBranches.join(', ') : 'All branches');
  return parts.join(' · ');
}

/** Count of drives per status, plus ALL. */
export function driveStatusCounts(drives = []) {
  const counts = { ALL: drives.length, OPEN: 0, CLOSED: 0, CANCELLED: 0, DRAFT: 0 };
  drives.forEach((d) => {
    counts[d.status] = (counts[d.status] ?? 0) + 1;
  });
  return counts;
}

/** Open drives whose deadline falls within the next `days` days. */
export const closingWithin = (drives = [], days = 7, now = new Date()) =>
  activeOpenDrives(drives, now).filter((d) => toTime(d.deadline) - now.getTime() <= days * DAY).length;

/** Next `limit` open-drive deadlines, soonest first, with application counts. */
export function upcomingDeadlines(drives = [], applications = [], { now = new Date(), limit = 5 } = {}) {
  const counts = applicationCountByDrive(applications);
  return activeOpenDrives(drives, now)
    .sort((a, b) => toTime(a.deadline) - toTime(b.deadline))
    .slice(0, limit)
    .map((drive) => ({ drive, applications: counts.get(drive._id) ?? 0 }));
}

/** Employment type split of drives: [{ type, label, count, share }] in a fixed order. */
export function employmentTypeMix(drives = []) {
  return Object.entries(EMPLOYMENT_TYPE_LABELS).map(([type, label]) => {
    const count = drives.filter((d) => d.employmentType === type).length;
    return { type, label, count, share: percentOf(count, drives.length) };
  });
}

/**
 * Recruitment per company: [{ id, name, drives, applications, selected, avgLpa }] ordered by
 * students selected, then applications. `avgLpa` averages the package of each selection.
 */
export function companyRecruitment(drives = [], applications = []) {
  const byCompany = new Map();
  const companyOf = (company) => {
    const id = refId(company);
    if (!id) return null;
    if (!byCompany.has(id)) {
      byCompany.set(id, { id, name: company?.name || 'Unknown company', drives: 0, applications: 0, selected: 0, lpaTotal: 0 });
    }
    return byCompany.get(id);
  };
  drives.forEach((drive) => {
    const entry = companyOf(drive.companyId);
    if (entry) entry.drives += 1;
  });
  applications.forEach((app) => {
    const entry = companyOf(app.driveId?.companyId);
    if (!entry) return;
    entry.applications += 1;
    if (app.status === 'SELECTED') {
      entry.selected += 1;
      entry.lpaTotal += Number(app.driveId?.packageLpa) || 0;
    }
  });
  return [...byCompany.values()]
    .map(({ lpaTotal, ...entry }) => ({ ...entry, avgLpa: entry.selected ? lpaTotal / entry.selected : null }))
    .sort((a, b) => b.selected - a.selected || b.applications - a.applications || a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------- trends */

/** Accepted offers' acceptance times (ms). */
const acceptanceTimes = (applications = []) =>
  applications
    .filter((app) => app.offer?.status === 'ACCEPTED')
    .map((app) => toTime(app.offer.respondedAt))
    .filter((t) => t !== null);

/**
 * Cumulative accepted offers sampled weekly over the last `weeks` weeks ending at `now`,
 * plus the same window one year (52 weeks) earlier for comparison.
 * Returns { dates, current: number[], previous: number[] }.
 */
export function cumulativePlacements(applications = [], { now = new Date(), weeks = 12 } = {}) {
  const times = acceptanceTimes(applications);
  const end = now.getTime();
  const dates = Array.from({ length: weeks }, (_, i) => new Date(end - (weeks - 1 - i) * 7 * DAY));
  const countUpTo = (t) => times.filter((x) => x <= t).length;
  const yearAgo = 52 * 7 * DAY;
  return {
    dates,
    current: dates.map((d) => countUpTo(d.getTime())),
    previous: dates.map((d) => countUpTo(d.getTime() - yearAgo)),
  };
}

/** A "nice" axis maximum and tick list (0 … max in `intervals` steps) covering `value`. */
export function niceAxis(value, intervals = 3) {
  const raw = Math.max(value, 1) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw);
  const niceStep = Math.max(1, step);
  const stepValue = Number.isInteger(niceStep) ? niceStep : Math.ceil(niceStep);
  return { max: stepValue * intervals, ticks: Array.from({ length: intervals + 1 }, (_, i) => stepValue * (intervals - i)) };
}

/* ----------------------------------------------------------------- activity */

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/** "Today 15:42" / "Oct 10" for the activity feed. */
export function activityTime(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  if (sameDay(date, now)) {
    const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    return `Today ${time}`;
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date);
}

/**
 * Recent recruitment activity derived from drives (posted) and applications that recruiters
 * moved to SHORTLISTED or SELECTED, grouped per drive, status and day.
 * Returns [{ key, at, who, what, status }] newest first.
 */
export function recentActivity(drives = [], applications = [], { limit = 6 } = {}) {
  const events = drives
    .filter((d) => toTime(d.createdAt) !== null)
    .map((d) => ({
      key: `drive-${d._id}`,
      at: toTime(d.createdAt),
      who: companyName(d),
      what: `posted ${d.title} · ${formatLpa(d.packageLpa)} LPA`,
      status: d.status,
    }));

  const groups = new Map();
  applications
    .filter((app) => ['SHORTLISTED', 'SELECTED'].includes(app.status) && app.driveId && toTime(app.updatedAt) !== null)
    .forEach((app) => {
      const at = toTime(app.updatedAt);
      const key = `${refId(app.driveId)}-${app.status}-${new Date(at).toDateString()}`;
      const group = groups.get(key) ?? { key, at, drive: app.driveId, status: app.status, apps: [] };
      group.at = Math.max(group.at, at);
      group.apps.push(app);
      groups.set(key, group);
    });

  groups.forEach(({ key, at, drive, status, apps }) => {
    const verb = status === 'SELECTED' ? 'selected' : 'shortlisted';
    const student = apps[0].studentId;
    const subject =
      apps.length === 1
        ? `${studentName(student)}${student?.branch ? ` (${student.branch})` : ''}`
        : `${apps.length} candidates`;
    const what =
      status === 'SELECTED'
        ? `${verb} ${subject} for ${drive.title} · ${formatLpa(drive.packageLpa)} LPA`
        : `${verb} ${subject} for ${drive.title}`;
    events.push({ key, at, who: drive.companyId?.name || 'Unknown company', what, status });
  });

  return events.sort((a, b) => b.at - a.at).slice(0, limit);
}

/** Placement season label for a date: July starts a new season ("2026–27"). */
export function seasonLabel(now = new Date()) {
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

/* ---------------------------------------------------------- student directory */

/**
 * Filters the student list: `query` matches name, email or roll number (case-insensitive),
 * `branch`/`year` match exactly, `placement` is 'ALL' | 'PLACED' | 'NOT_PLACED'.
 */
export function filterStudents(students = [], { query = '', branch = '', year = '', placement = 'ALL' } = {}) {
  const needle = query.trim().toLowerCase();
  return students.filter((s) => {
    if (branch && s.branch !== branch) return false;
    if (year && Number(s.graduationYear) !== Number(year)) return false;
    if (placement === 'PLACED' && !s.isPlaced) return false;
    if (placement === 'NOT_PLACED' && s.isPlaced) return false;
    if (!needle) return true;
    return [studentName(s), studentEmail(s), s.rollNumber].some((v) => String(v ?? '').toLowerCase().includes(needle));
  });
}

/** Sort accessors for the student directory columns. */
export const STUDENT_SORTS = {
  name: (s) => studentName(s).toLowerCase(),
  roll: (s) => String(s.rollNumber ?? '').toLowerCase(),
  cgpa: (s) => Number(s.cgpa) || 0,
  backlogs: (s) => Number(s.activeBacklogs) || 0,
  package: (s) => (s.isPlaced ? Number(s.packageLpa) || 0 : -1),
};

/** Returns a sorted copy; `apps` sorts by the per-student application count map. */
export function sortStudents(students = [], { key = 'cgpa', direction = 'desc' } = {}, appCounts = new Map()) {
  const accessor = key === 'apps' ? (s) => appCounts.get(s._id)?.total ?? 0 : (STUDENT_SORTS[key] ?? STUDENT_SORTS.cgpa);
  const sign = direction === 'asc' ? 1 : -1;
  return [...students].sort((a, b) => {
    const x = accessor(a);
    const y = accessor(b);
    if (x < y) return -sign;
    if (x > y) return sign;
    return studentName(a).localeCompare(studentName(b));
  });
}

/** Page numbers to show: first, last, current ±1, with null for gaps ("…"). */
export function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}
