import { apiRequest } from './apiClient';
/** @returns {Promise<{ token: string, user: { id, name, email, role } }>} */
export async function login({ email, password }) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  return { token: data.token, user: data.user };
}

/** Only STUDENT and RECRUITER accounts can self-register. */
export async function signup({ name, email, password, role }) {
  const data = await apiRequest('/auth/signup', { method: 'POST', body: { name, email, password, role } });
  return { token: data.token, user: data.user };
}

/** @returns {Promise<{ id: string, name: string, email: string, role: string }>} the signed-in user */
export async function getCurrentUser() {
  const data = await apiRequest('/auth/me');
  return data.user;
}
