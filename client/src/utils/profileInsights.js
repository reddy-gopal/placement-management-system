import { TYPICAL_MAX_BACKLOGS, TYPICAL_MIN_CGPA } from '../constants/studentProfile';

const hasValue = (value) => value !== null && value !== undefined && String(value).trim() !== '';

/**
 * The 7 things a placement-ready profile needs. `field` is the id of the form
 * control that fixes the item, so the UI can jump straight to it.
 */
export const COMPLETENESS_ITEMS = [
  { key: 'rollNumber', field: 'rollNumber', label: 'Roll number', action: 'add your roll number', test: (p) => hasValue(p.rollNumber) },
  { key: 'branch', field: 'branch', label: 'Branch', action: 'select your branch', test: (p) => hasValue(p.branch) },
  { key: 'graduationYear', field: 'graduationYear', label: 'Graduation year', action: 'add your graduation year', test: (p) => hasValue(p.graduationYear) },
  { key: 'cgpa', field: 'cgpa', label: 'CGPA', action: 'add your CGPA', test: (p) => hasValue(p.cgpa) },
  { key: 'activeBacklogs', field: 'activeBacklogs', label: 'Active backlogs', action: 'confirm your active backlogs', test: (p) => hasValue(p.activeBacklogs) },
  { key: 'skills', field: 'skills', label: 'At least one skill', action: 'add a skill', test: (p) => Array.isArray(p.skills) && p.skills.length > 0 },
  { key: 'resumeUrl', field: 'resumeUrl', label: 'Resume link', action: 'add your resume', test: (p) => hasValue(p.resumeUrl) },
];

/** Completeness of a SAVED profile (null = no profile yet → 0%). */
export function getProfileCompleteness(profile) {
  const items = COMPLETENESS_ITEMS.map(({ test, ...item }) => ({ ...item, done: Boolean(profile) && test(profile) }));
  const completed = items.filter((item) => item.done).length;
  const total = items.length;
  return { items, completed, total, percent: Math.round((completed / total) * 100) };
}

/** One-line nudge towards 100%. */
export function getCompletenessGuidance({ items, completed, total }) {
  if (completed === 0) return 'Create your profile to start applying to placement drives.';
  if (completed === total) return 'Your profile is complete — you are ready for placement drives.';
  const missing = items.filter((item) => !item.done);
  const next = missing[0].action;
  const sentence = `${next.charAt(0).toUpperCase()}${next.slice(1)}`;
  return missing.length === 1 ? `${sentence} to reach 100%.` : `${sentence} next — ${missing.length} items left.`;
}

/** Two-letter avatar initials from a roll number's letters (e.g. 21CSE101 → CS). */
export function getInitials(rollNumber) {
  const letters = String(rollNumber ?? '').replace(/[^a-z]/gi, '');
  return letters.length >= 2 ? letters.slice(0, 2).toUpperCase() : 'ST';
}

/**
 * Compare a profile with typical drive criteria. Each check is
 * 'meets' | 'below' | 'unknown' (no profile / value).
 */
export function getEligibilitySnapshot(profile, { minCgpa = TYPICAL_MIN_CGPA, maxBacklogs = TYPICAL_MAX_BACKLOGS } = {}) {
  const cgpa = profile && hasValue(profile.cgpa) ? Number(profile.cgpa) : null;
  const backlogs = profile && hasValue(profile.activeBacklogs) ? Number(profile.activeBacklogs) : null;
  const cgpaStatus = cgpa === null ? 'unknown' : cgpa >= minCgpa ? 'meets' : 'below';
  const backlogStatus = backlogs === null ? 'unknown' : backlogs <= maxBacklogs ? 'meets' : 'below';
  return {
    cgpa: { value: cgpa, threshold: minCgpa, status: cgpaStatus },
    backlogs: { value: backlogs, threshold: maxBacklogs, status: backlogStatus },
    eligible: cgpaStatus === 'meets' && backlogStatus === 'meets',
  };
}
