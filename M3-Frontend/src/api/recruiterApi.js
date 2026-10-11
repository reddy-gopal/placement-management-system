import { getToken } from '../adapters/authAdapter.js';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const request = async (path, options = {}) => {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      payload.error?.message ?? payload.message ?? 'Request failed',
      response.status,
      payload.error?.code,
      payload.error?.details
    );
  }
  return payload.data;
};

const queryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const output = query.toString();
  return output ? `?${output}` : '';
};

export const recruiterApi = {
  getCompany: () => request('/recruiter/company'),
  saveCompany: (company) => request('/recruiter/company', {
    method: 'PUT',
    body: JSON.stringify(company)
  }),
  getDrives: (params = {}) => request(`/recruiter/drives${queryString(params)}`),
  getDrive: (driveId) => request(`/recruiter/drives/${driveId}`),
  createDrive: (drive) => request('/recruiter/drives', {
    method: 'POST',
    body: JSON.stringify(drive)
  }),
  updateDrive: (driveId, drive) => request(`/recruiter/drives/${driveId}`, {
    method: 'PATCH',
    body: JSON.stringify(drive)
  }),
  updateDriveStatus: (driveId, status) => request(`/recruiter/drives/${driveId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
};
