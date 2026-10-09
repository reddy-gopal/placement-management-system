const {
  BRANCHES,
  GRADUATION_YEAR_MIN,
  GRADUATION_YEAR_MAX,
  isHttpUrl,
} = require('../models/StudentProfile');

const MAX_SKILLS = 30;
const MAX_SKILL_LENGTH = 50;
const MAX_URL_LENGTH = 2048;

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

// Accepts real numbers or numeric strings only (rejects booleans, arrays, objects).
function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value.trim());
  return NaN;
}

function validateRollNumber(value) {
  if (isBlank(value)) return { error: 'Roll number is required.' };
  if (typeof value !== 'string') return { error: 'Roll number must be text.' };
  const rollNumber = value.trim().toUpperCase();
  if (rollNumber.length > 30) return { error: 'Roll number must be at most 30 characters.' };
  return { value: rollNumber };
}

function validateBranch(value) {
  if (isBlank(value)) return { error: 'Branch is required.' };
  if (!BRANCHES.includes(value)) return { error: `Branch must be one of: ${BRANCHES.join(', ')}.` };
  return { value };
}

function validateGraduationYear(value) {
  if (isBlank(value)) return { error: 'Graduation year is required.' };
  const year = toNumber(value);
  if (!Number.isInteger(year) || year < GRADUATION_YEAR_MIN || year > GRADUATION_YEAR_MAX) {
    return {
      error: `Graduation year must be a whole number between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}.`,
    };
  }
  return { value: year };
}

function validateCgpa(value) {
  if (isBlank(value)) return { error: 'CGPA is required.' };
  const cgpa = toNumber(value);
  if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
    return { error: 'CGPA must be between 0 and 10.' };
  }
  return { value: cgpa };
}

function validateActiveBacklogs(value) {
  if (isBlank(value)) return { error: 'Active backlogs is required.' };
  const backlogs = toNumber(value);
  if (!Number.isFinite(backlogs)) return { error: 'Active backlogs must be a number.' };
  if (backlogs < 0) return { error: 'Active backlogs cannot be negative.' };
  if (!Number.isInteger(backlogs)) return { error: 'Active backlogs must be a whole number.' };
  return { value: backlogs };
}

function validateSkills(value) {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value) || value.some((skill) => typeof skill !== 'string')) {
    return { error: 'Skills must be a list of text values.' };
  }

  const seen = new Set();
  const skills = [];
  for (const raw of value) {
    const skill = raw.trim();
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    if (skill.length > MAX_SKILL_LENGTH) {
      return { error: `Each skill must be at most ${MAX_SKILL_LENGTH} characters.` };
    }
    seen.add(key);
    skills.push(skill);
  }

  if (skills.length > MAX_SKILLS) return { error: `You can add at most ${MAX_SKILLS} skills.` };
  return { value: skills };
}

function validateResumeUrl(value) {
  if (isBlank(value)) return { value: null }; // optional — null means "remove"
  if (typeof value !== 'string') return { error: 'Resume URL must be text.' };
  const url = value.trim();
  if (url.length > MAX_URL_LENGTH || !isHttpUrl(url)) {
    return { error: 'Resume URL must be a valid http(s) URL, e.g. https://example.com/resume.pdf.' };
  }
  return { value: url };
}

const FIELD_VALIDATORS = {
  rollNumber: validateRollNumber,
  branch: validateBranch,
  graduationYear: validateGraduationYear,
  cgpa: validateCgpa,
  activeBacklogs: validateActiveBacklogs,
  skills: validateSkills,
  resumeUrl: validateResumeUrl,
};

/**
 * Validates and normalizes the student-editable profile fields.
 * Only whitelisted fields are read, so client-supplied `userId`,
 * `isPlaced`, `_id`, etc. are silently ignored.
 *
 * @returns {{ errors: Record<string,string>|null, value: object }}
 */
function validateStudentProfileInput(body = {}) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = {};
  const value = {};

  for (const [field, validate] of Object.entries(FIELD_VALIDATORS)) {
    const result = validate(input[field]);
    if (result.error) errors[field] = result.error;
    else value[field] = result.value;
  }

  return { errors: Object.keys(errors).length ? errors : null, value };
}

module.exports = { validateStudentProfileInput, MAX_SKILLS, MAX_SKILL_LENGTH };
