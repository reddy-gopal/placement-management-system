import { apiRequest } from './apiClient';

/** @returns {Promise<object|null>} the profile, or null if the student hasn't created one yet */
export async function getStudentProfile() {
  const data = await apiRequest('/student/profile');
  return data.profile;
}

/** Creates or updates the authenticated student's profile. */
export async function saveStudentProfile(profile) {
  const data = await apiRequest('/student/profile', { method: 'POST', body: profile });
  return { profile: data.profile, message: data.message };
}
