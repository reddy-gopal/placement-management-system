import { requestApi } from './apiClient.js';

export const fetchStudentProfile = async () => {
  return requestApi('/student/profile');
};

export const fetchCurrentUser = async () => {
  return requestApi('/auth/me');
};
