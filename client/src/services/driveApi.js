import { apiRequest, toQueryString } from './apiClient';

/**
 * Lists drives visible to the caller. Students only get OPEN drives with a future
 * deadline, each annotated with `isEligible` and `ineligibilityReasons`; recruiters get
 * their own company's drives; admins get everything.
 * @param {{ search?, location?, minPackage?, employmentType?, status?, page?, limit? }} params
 * @returns {Promise<{ drives: object[], total: number, page: number, limit: number }>}
 */
export async function listDrives(params = {}) {
  const { drives, total, page, limit } = await apiRequest(`/drives${toQueryString(params)}`);
  return { drives, total, page, limit };
}

/** Drive with `companyId` populated ({ name, logoUrl, industry, website }). */
export async function getDrive(driveId) {
  const data = await apiRequest(`/drives/${driveId}`);
  return data.drive;
}

/** Recruiter (or admin with `companyId`) creates a drive; it starts OPEN. */
export async function createDrive(drive) {
  const data = await apiRequest('/drives', { method: 'POST', body: drive });
  return { drive: data.drive, message: data.message };
}

export async function updateDrive(driveId, drive) {
  const data = await apiRequest(`/drives/${driveId}`, { method: 'PUT', body: drive });
  return { drive: data.drive, message: data.message };
}

/** Recruiters: OPEN | CLOSED. Admins can also CANCEL. */
export async function updateDriveStatus(driveId, status) {
  const data = await apiRequest(`/drives/${driveId}/status`, { method: 'PATCH', body: { status } });
  return { drive: data.drive, message: data.message };
}

/** Admin only. */
export async function deleteDrive(driveId) {
  const data = await apiRequest(`/drives/${driveId}`, { method: 'DELETE' });
  return { message: data.message };
}
