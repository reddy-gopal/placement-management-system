import { ApiError, apiRequest } from './apiClient';

/** The recruiter's own company, or null if they haven't created one yet. */
export async function getMyCompany() {
  try {
    const data = await apiRequest('/companies/me');
    return data.company;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Creates the company the first time (POST) and updates it after that (PUT). */
export async function saveMyCompany(company, { exists }) {
  const data = await apiRequest('/companies/me', { method: exists ? 'PUT' : 'POST', body: company });
  return { company: data.company, message: data.message };
}

export async function listCompanies() {
  const data = await apiRequest('/companies');
  return data.companies;
}
