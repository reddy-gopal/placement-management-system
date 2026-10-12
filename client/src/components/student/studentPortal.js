import { getMyApplications } from '../../services/applicationApi';
import { getStudentProfile } from '../../services/studentProfileApi';
import { daysUntil, formatLpa } from '../../utils/format';

/**
 * The student's applications, or [] when they have no profile yet
 * (the API answers 404 "Student profile not found" in that case).
 */
export async function loadMyApplications() {
  try {
    return (await getMyApplications()) ?? [];
  } catch (err) {
    if (err?.status === 404) return [];
    throw err;
  }
}

/** Profile + applications, loaded together for the student pages. */
export async function loadStudentContext() {
  const [profile, applications] = await Promise.all([getStudentProfile(), loadMyApplications()]);
  return { profile, applications };
}

/** id of a populated or raw reference. */
export const refId = (value) => (value && typeof value === 'object' ? value._id : value) ?? null;

/** driveId → application, for "already applied" states. */
export const applicationsByDrive = (applications = []) =>
  new Map(applications.filter((a) => a.driveId).map((a) => [String(refId(a.driveId)), a]));

/** "All branches" or "CSE · IT · ECE". */
export const branchesLabel = (branches, separator = ' · ') =>
  branches?.length ? branches.join(separator) : 'All branches';

const hasValue = (value) => value !== null && value !== undefined && value !== '';

/**
 * Each eligibility rule of a drive checked against the profile.
 * status: 'meets' | 'fails' | 'unknown' (no profile).
 */
export function getEligibilityChecks(drive, profile) {
  const { minCgpa = 6, maxBacklogs = 0, allowedBranches = [] } = drive?.eligibility ?? {};
  const check = (value, passes) => (!profile || !hasValue(value) ? 'unknown' : passes ? 'meets' : 'fails');
  return [
    {
      key: 'cgpa',
      label: 'Minimum CGPA',
      requirement: `≥ ${minCgpa}`,
      mine: profile?.cgpa,
      status: check(profile?.cgpa, Number(profile?.cgpa) >= minCgpa),
    },
    {
      key: 'backlogs',
      label: 'Active backlogs',
      requirement: `≤ ${maxBacklogs}`,
      mine: profile?.activeBacklogs,
      status: check(profile?.activeBacklogs, Number(profile?.activeBacklogs) <= maxBacklogs),
    },
    {
      key: 'branch',
      label: 'Branch',
      requirement: branchesLabel(allowedBranches),
      mine: profile?.branch,
      status: check(profile?.branch, !allowedBranches.length || allowedBranches.includes(profile?.branch)),
    },
  ];
}

/** Short reason a drive is out of reach ("Needs CGPA 8.5", "ECE / EEE only"), or null when eligible. */
export function shortIneligibility(drive, profile) {
  if (!profile) return 'Profile needed';
  if (drive.isEligible) return null;
  const failed = getEligibilityChecks(drive, profile).find((c) => c.status === 'fails');
  if (!failed) return 'Not eligible';
  if (failed.key === 'cgpa') return `Needs CGPA ${drive.eligibility.minCgpa}`;
  if (failed.key === 'backlogs') return `Max ${drive.eligibility.maxBacklogs} backlogs`;
  return `${branchesLabel(drive.eligibility.allowedBranches, ' / ')} only`;
}

/** "2 days" / "1 day" / "Today" until a deadline. */
export function daysLeftLabel(value) {
  const days = daysUntil(value);
  if (days === null) return '';
  if (days <= 0) return 'Today';
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Deadlines this close get the lime "closing soon" pill. */
export const isClosingSoon = (value) => {
  const days = daysUntil(value);
  return days !== null && days <= 3;
};

export const lpaLabel = (value) => `${formatLpa(value)} LPA`;

/** Company name/logo of an application's populated drive. */
export const applicationCompany = (application) => application?.driveId?.companyId ?? {};

/** Applications still in play (they get closed when an offer is accepted). */
export const isOpenApplication = (a) =>
  a.status === 'APPLIED' || a.status === 'SHORTLISTED' || (a.status === 'SELECTED' && a.offer?.status === 'PENDING');

/** Pending offers the student can still respond to. */
export const pendingOffers = (applications = []) =>
  applications.filter((a) => a.status === 'SELECTED' && a.offer?.status === 'PENDING');

const OFFER_TEXT = { PENDING: 'Offer pending', ACCEPTED: 'Offer accepted', DECLINED: 'Offer declined', EXPIRED: 'Offer expired' };
export const offerText = (application) => OFFER_TEXT[application?.offer?.status] ?? '';
