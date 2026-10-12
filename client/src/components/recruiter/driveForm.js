import { formatDate, toDateInputValue } from '../../utils/format';
import { endOfDay } from './recruiterData';

export const EMPTY_DRIVE_FORM = Object.freeze({
  title: '',
  description: '',
  location: '',
  employmentType: 'FULL_TIME',
  packageLpa: '',
  minCgpa: '',
  maxBacklogs: '0',
  allowedBranches: [],
  deadline: '',
});

/** Which numbered form section each field lives in (drives the summary in the preview panel). */
export const DRIVE_SECTIONS = [
  { id: 'info', number: '01', title: 'Job information', fields: ['title', 'description', 'location', 'employmentType'] },
  { id: 'pay', number: '02', title: 'Compensation', fields: ['packageLpa'] },
  { id: 'eligibility', number: '03', title: 'Eligibility', fields: ['minCgpa', 'maxBacklogs', 'allowedBranches'] },
  { id: 'settings', number: '04', title: 'Application settings', fields: ['deadline'] },
];

/** Field → input id, used for error links and focusing. */
export const DRIVE_FIELD_IDS = {
  title: 'drive-title',
  description: 'drive-description',
  location: 'drive-location',
  employmentType: 'drive-type',
  packageLpa: 'drive-package',
  minCgpa: 'drive-cgpa',
  maxBacklogs: 'drive-backlogs',
  allowedBranches: 'drive-branches',
  deadline: 'drive-deadline',
};

export const DRIVE_FIELD_LABELS = {
  title: 'Job title',
  description: 'Job description',
  location: 'Location',
  employmentType: 'Employment type',
  packageLpa: 'Package',
  minCgpa: 'Minimum CGPA',
  maxBacklogs: 'Max active backlogs',
  allowedBranches: 'Allowed branches',
  deadline: 'Application deadline',
};

/** API drive → form state. */
export function driveToForm(drive) {
  if (!drive) return { ...EMPTY_DRIVE_FORM, allowedBranches: [] };
  const eligibility = drive.eligibility ?? {};
  return {
    title: drive.title ?? '',
    description: drive.description ?? '',
    location: drive.location ?? '',
    employmentType: drive.employmentType ?? 'FULL_TIME',
    packageLpa: drive.packageLpa ?? '',
    minCgpa: eligibility.minCgpa ?? '',
    maxBacklogs: eligibility.maxBacklogs ?? 0,
    allowedBranches: Array.isArray(eligibility.allowedBranches) ? [...eligibility.allowedBranches] : [],
    deadline: toDateInputValue(drive.deadline),
  };
}

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

/**
 * Mirrors validateDriveFields on the server. `checkDeadline` is false when editing a drive
 * without touching its deadline (the server only re-checks a deadline that is sent).
 */
export function validateDriveForm(form, { checkDeadline = true, now = new Date() } = {}) {
  const errors = {};
  if (isBlank(form.title)) errors.title = 'Job title is required.';
  if (isBlank(form.description)) errors.description = 'Job description is required.';
  if (isBlank(form.location)) errors.location = 'Location is required.';
  if (!['FULL_TIME', 'INTERNSHIP', 'CONTRACT'].includes(form.employmentType))
    errors.employmentType = 'Choose an employment type.';

  if (isBlank(form.packageLpa)) errors.packageLpa = 'Package is required.';
  else if (!Number.isFinite(Number(form.packageLpa)) || Number(form.packageLpa) < 0)
    errors.packageLpa = 'Package must be a number of 0 or more.';

  if (isBlank(form.minCgpa)) errors.minCgpa = 'Minimum CGPA is required.';
  else if (!Number.isFinite(Number(form.minCgpa)) || Number(form.minCgpa) < 0 || Number(form.minCgpa) > 10)
    errors.minCgpa = 'Minimum CGPA must be between 0 and 10.';

  if (isBlank(form.maxBacklogs)) errors.maxBacklogs = 'Max active backlogs is required.';
  else if (!Number.isInteger(Number(form.maxBacklogs)) || Number(form.maxBacklogs) < 0)
    errors.maxBacklogs = 'Use a whole number of 0 or more.';

  if (isBlank(form.deadline)) errors.deadline = 'Application deadline is required.';
  else if (checkDeadline) {
    const deadline = endOfDay(form.deadline);
    if (!deadline) errors.deadline = 'Enter a valid date.';
    else if (deadline <= now) errors.deadline = `Deadline can’t be before today (${formatDate(now)}).`;
  }
  return errors;
}

/**
 * Form state → API body. The deadline is the end of the chosen day; pass `includeDeadline: false`
 * when editing without changing it so the stored time is kept.
 */
export function toDrivePayload(form, { includeDeadline = true } = {}) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    employmentType: form.employmentType,
    packageLpa: Number(form.packageLpa),
    eligibility: {
      minCgpa: Number(form.minCgpa),
      maxBacklogs: Number(form.maxBacklogs),
      allowedBranches: form.allowedBranches,
    },
  };
  if (includeDeadline) payload.deadline = endOfDay(form.deadline).toISOString();
  return payload;
}

/** "CGPA ≥ 7.5 · ≤ 0 backlogs · CSE, IT" */
export function eligibilitySummary({ minCgpa, maxBacklogs, allowedBranches = [] } = {}) {
  const parts = [];
  if (!isBlank(minCgpa)) parts.push(`CGPA ≥ ${minCgpa}`);
  if (!isBlank(maxBacklogs)) parts.push(`≤ ${maxBacklogs} backlog${Number(maxBacklogs) === 1 ? '' : 's'}`);
  parts.push(allowedBranches.length ? allowedBranches.join(', ') : 'All branches');
  return parts.join(' · ');
}
