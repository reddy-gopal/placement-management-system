import { requestApi } from './apiClient.js';

export const fetchDrives = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.location) query.set('location', params.location);
  if (params.minPackage !== undefined && params.minPackage !== '') query.set('minPackage', params.minPackage);
  if (params.employmentType) query.set('employmentType', params.employmentType);
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);

  const queryString = query.toString();
  const endpoint = `/drives${queryString ? `?${queryString}` : ''}`;
  return requestApi(endpoint);
};

export const fetchDriveById = async (driveId) => {
  return requestApi(`/drives/${driveId}`);
};

export const applyToDrive = async (driveId) => {
  return requestApi('/applications/apply', {
    method: 'POST',
    body: { driveId },
  });
};

export const fetchMyApplications = async () => {
  return requestApi('/applications/my');
};
