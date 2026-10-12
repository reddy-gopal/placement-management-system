import { EmploymentType, JobDriveStatus } from '../../enum.js';
import { M3Error } from './m3Error.js';

const cleanString = (value) => typeof value === 'string' ? value.trim() : value;

const optionalString = (value, field, maxLength) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const cleaned = cleanString(value);
  if (cleaned === '') return null;
  if (typeof cleaned !== 'string' || cleaned.length > maxLength) {
    throw new M3Error(400, 'VALIDATION_ERROR', `${field} must be a string of at most ${maxLength} characters`);
  }
  return cleaned;
};

const requiredString = (value, field, maxLength) => {
  const cleaned = cleanString(value);
  if (typeof cleaned !== 'string' || !cleaned || cleaned.length > maxLength) {
    throw new M3Error(400, 'VALIDATION_ERROR', `${field} is required and must be at most ${maxLength} characters`);
  }
  return cleaned;
};

const optionalUrl = (value, field) => {
  const cleaned = optionalString(value, field, 500);
  if (cleaned === undefined || cleaned === null) return cleaned;

  try {
    const url = new URL(cleaned);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
  } catch {
    throw new M3Error(400, 'VALIDATION_ERROR', `${field} must be a valid http or https URL`);
  }
  return cleaned;
};

const numberInRange = (value, field, min, max) => {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new M3Error(400, 'VALIDATION_ERROR', `${field} must be between ${min} and ${max}`);
  }
  return parsed;
};

const integerInRange = (value, field, min, max) => {
  const parsed = numberInRange(value, field, min, max);
  if (!Number.isInteger(parsed)) {
    throw new M3Error(400, 'VALIDATION_ERROR', `${field} must be a whole number`);
  }
  return parsed;
};

export const validateCompanyInput = (body = {}) => {
  const result = {
    name: requiredString(body.name, 'name', 120)
  };

  const website = optionalUrl(body.website, 'website');
  const logoUrl = optionalUrl(body.logoUrl, 'logoUrl');
  const industry = optionalString(body.industry, 'industry', 120);
  const description = optionalString(body.description, 'description', 2000);
  const contactPhone = optionalString(body.contactPhone, 'contactPhone', 30);
  const contactEmail = optionalString(body.contactEmail, 'contactEmail', 254);

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'contactEmail must be a valid email address');
  }

  for (const [key, value] of Object.entries({
    website,
    industry,
    description,
    logoUrl,
    contactEmail: contactEmail?.toLowerCase() ?? contactEmail,
    contactPhone
  })) {
    if (value !== undefined) result[key] = value;
  }

  return result;
};

const validateDeadline = (value) => {
  const deadline = new Date(value);
  if (!value || Number.isNaN(deadline.getTime())) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'deadline must be a valid date');
  }
  if (deadline.getTime() <= Date.now()) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'deadline must be in the future');
  }
  return deadline;
};

const validateBranches = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'eligibility.allowedBranches must contain at least one branch');
  }

  const branches = value.map((branch) => requiredString(branch, 'branch', 30).toUpperCase());
  return [...new Set(branches)];
};

const validateEligibility = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'eligibility is required');
  }

  return {
    minCgpa: numberInRange(value.minCgpa, 'eligibility.minCgpa', 0, 10),
    maxBacklogs: integerInRange(value.maxBacklogs ?? 0, 'eligibility.maxBacklogs', 0, 100),
    allowedBranches: validateBranches(value.allowedBranches)
  };
};

export const validateDriveInput = (body = {}, { partial = false } = {}) => {
  const result = {};
  const assign = (key, validator) => {
    if (!partial || body[key] !== undefined) result[key] = validator(body[key]);
  };

  assign('title', (value) => requiredString(value, 'title', 160));
  assign('description', (value) => requiredString(value, 'description', 5000));
  assign('packageLpa', (value) => numberInRange(value, 'packageLpa', 0, 1000));
  assign('location', (value) => requiredString(value, 'location', 160));
  assign('deadline', validateDeadline);
  assign('eligibility', validateEligibility);

  if (!partial || body.employmentType !== undefined) {
    if (!Object.values(EmploymentType).includes(body.employmentType)) {
      throw new M3Error(
        400,
        'VALIDATION_ERROR',
        `employmentType must be one of: ${Object.values(EmploymentType).join(', ')}`
      );
    }
    result.employmentType = body.employmentType;
  }

  if (!partial && body.status !== undefined) {
    const creationStatuses = [JobDriveStatus.DRAFT, JobDriveStatus.OPEN];
    if (!creationStatuses.includes(body.status)) {
      throw new M3Error(
        400,
        'VALIDATION_ERROR',
        `status must be one of: ${creationStatuses.join(', ')}`
      );
    }
    result.status = body.status;
  }

  if (partial && body.status !== undefined) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'Use the dedicated status endpoint to change drive status');
  }

  if (partial && Object.keys(result).length === 0) {
    throw new M3Error(400, 'VALIDATION_ERROR', 'At least one editable drive field is required');
  }

  return result;
};

export const validateDriveListQuery = (query = {}) => {
  const filter = {};
  if (query.status !== undefined) {
    if (!Object.values(JobDriveStatus).includes(query.status)) {
      throw new M3Error(400, 'VALIDATION_ERROR', 'status filter is invalid');
    }
    filter.status = query.status;
  }

  const search = optionalString(query.search, 'search', 100);
  const page = query.page === undefined ? 1 : integerInRange(query.page, 'page', 1, 100_000);
  const limit = query.limit === undefined ? 20 : integerInRange(query.limit, 'limit', 1, 100);

  return { filter, search, page, limit };
};

export const validateDriveStatusInput = (body = {}) => {
  const allowedStatuses = [JobDriveStatus.OPEN, JobDriveStatus.CLOSED];
  if (!allowedStatuses.includes(body.status)) {
    throw new M3Error(
      400,
      'VALIDATION_ERROR',
      `status must be one of: ${allowedStatuses.join(', ')}`
    );
  }
  return body.status;
};
