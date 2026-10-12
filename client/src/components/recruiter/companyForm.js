import { isHttpUrl } from '../../utils/studentProfileForm';

export const COMPANY_FIELDS = ['name', 'industry', 'description', 'website', 'logoUrl', 'contactEmail', 'contactPhone'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** API company → form state (all strings). */
export function companyToForm(company) {
  return Object.fromEntries(COMPANY_FIELDS.map((field) => [field, company?.[field] ?? '']));
}

/**
 * Mirrors the server (name is the only required field) and adds format checks
 * for the optional links and contact details so typos are caught before saving.
 */
export function validateCompanyForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Company name is required.';
  if (form.website.trim() && !isHttpUrl(form.website.trim())) errors.website = 'Enter a full URL, e.g. https://company.com';
  if (form.logoUrl.trim() && !isHttpUrl(form.logoUrl.trim())) errors.logoUrl = 'Enter a full image URL starting with https://';
  if (form.contactEmail.trim() && !EMAIL_PATTERN.test(form.contactEmail.trim()))
    errors.contactEmail = 'Enter a valid email address.';
  if (form.contactPhone.trim()) {
    const digits = form.contactPhone.replace(/\D/g, '');
    if (!/^[+\d\s()-]+$/.test(form.contactPhone.trim()) || digits.length < 7 || digits.length > 15)
      errors.contactPhone = 'Enter a valid phone number (7–15 digits).';
  }
  return errors;
}

/** Form state → API payload. Blank optional fields are sent as null so they can be cleared. */
export function toCompanyPayload(form) {
  return Object.fromEntries(
    COMPANY_FIELDS.map((field) => {
      const value = form[field].trim();
      return [field, field === 'name' ? value : value || null];
    })
  );
}
