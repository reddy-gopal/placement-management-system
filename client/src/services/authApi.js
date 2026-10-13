import { apiRequest } from './apiClient';

/** @returns {Promise<{ token: string, user: { id: string, name: string, email: string, role: string, isVerified?: boolean } }>} */
export async function login({ email, password }) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
  return { token: data.token, user: data.user };
}

/** Only STUDENT and RECRUITER accounts can self-register. Returns verification requirement. */
export async function signup({ name, email, password, role }) {
  const data = await apiRequest('/auth/signup', { method: 'POST', body: { name, email, password, role } });
  return data;
}

/** Verify account with the 6-digit verification code sent via Resend */
export async function verifyEmail({ email, code }) {
  const data = await apiRequest('/auth/verify-email', { method: 'POST', body: { email, code } });
  return { token: data.token, user: data.user, message: data.message };
}

/** Request a new verification code */
export async function resendVerificationCode({ email }) {
  const data = await apiRequest('/auth/resend-code', { method: 'POST', body: { email } });
  return data;
}

/** Send test email via Resend */
export async function sendTestEmail(to) {
  const data = await apiRequest('/auth/test-email', { method: 'POST', body: { to } });
  return data;
}

/** @returns {Promise<{ id: string, name: string, email: string, role: string, isVerified?: boolean }>} the signed-in user */
export async function getCurrentUser() {
  const data = await apiRequest('/auth/me');
  return data.user;
}
