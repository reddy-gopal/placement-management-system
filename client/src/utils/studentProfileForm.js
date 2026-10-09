import {
  BRANCHES,
  EMPTY_PROFILE_FORM,
  GRADUATION_YEAR_MAX,
  GRADUATION_YEAR_MIN,
} from '../constants/studentProfile';

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Mirrors the server-side rules so students get instant feedback. */
export function validateProfileForm(form) {
  const errors = {};

  if (isBlank(form.rollNumber)) errors.rollNumber = 'Roll number is required.';
  else if (form.rollNumber.trim().length > 30) errors.rollNumber = 'Roll number must be at most 30 characters.';

  if (isBlank(form.branch)) errors.branch = 'Branch is required.';
  else if (!BRANCHES.includes(form.branch)) errors.branch = 'Please select a valid branch.';

  if (isBlank(form.graduationYear)) {
    errors.graduationYear = 'Graduation year is required.';
  } else {
    const year = Number(form.graduationYear);
    if (!Number.isInteger(year) || year < GRADUATION_YEAR_MIN || year > GRADUATION_YEAR_MAX) {
      errors.graduationYear = `Enter a year between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}.`;
    }
  }

  if (isBlank(form.cgpa)) {
    errors.cgpa = 'CGPA is required.';
  } else {
    const cgpa = Number(form.cgpa);
    if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) errors.cgpa = 'CGPA must be between 0 and 10.';
  }

  if (isBlank(form.activeBacklogs)) {
    errors.activeBacklogs = 'Active backlogs is required.';
  } else {
    const backlogs = Number(form.activeBacklogs);
    if (!Number.isFinite(backlogs)) errors.activeBacklogs = 'Active backlogs must be a number.';
    else if (backlogs < 0) errors.activeBacklogs = 'Active backlogs cannot be negative.';
    else if (!Number.isInteger(backlogs)) errors.activeBacklogs = 'Active backlogs must be a whole number.';
  }

  if (!isBlank(form.resumeUrl) && !isHttpUrl(form.resumeUrl.trim())) {
    errors.resumeUrl = 'Enter a valid URL, e.g. https://example.com/resume.pdf';
  }

  return errors;
}

/** Form state → API payload (only student-editable fields). */
export function toProfilePayload(form) {
  return {
    rollNumber: form.rollNumber.trim(),
    branch: form.branch,
    graduationYear: Number(form.graduationYear),
    cgpa: Number(form.cgpa),
    activeBacklogs: Number(form.activeBacklogs),
    skills: form.skills,
    resumeUrl: form.resumeUrl.trim(),
  };
}

/** API profile → form state. */
export function profileToForm(profile) {
  if (!profile) return { ...EMPTY_PROFILE_FORM, skills: [] };
  return {
    rollNumber: profile.rollNumber ?? '',
    branch: profile.branch ?? '',
    graduationYear: profile.graduationYear ?? '',
    cgpa: profile.cgpa ?? '',
    activeBacklogs: profile.activeBacklogs ?? 0,
    skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
    resumeUrl: profile.resumeUrl ?? '',
  };
}

/**
 * Some hosts need a different URL to embed than to view.
 * Google Drive "view" links can't be iframed, but their /preview variant can.
 */
export function toEmbeddableResumeUrl(url) {
  const match = url.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/);
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
}
