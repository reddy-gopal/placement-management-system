import { apiRequest } from './apiClient';

/** Student applies with the resume link saved on their profile. */
export async function applyToDrive(driveId) {
  const data = await apiRequest('/applications/apply', { method: 'POST', body: { driveId } });
  return { application: data.application, message: data.message };
}

/**
 * The student's applications, newest first, with `driveId` populated
 * (and `driveId.companyId` populated with { name, logoUrl }).
 */
export async function getMyApplications() {
  const data = await apiRequest('/applications/my');
  return data.applications;
}

/**
 * Applications for one drive (recruiter who owns it, or admin). `studentId` is populated
 * with the profile fields and `studentId.userId` with { name, email }.
 */
export async function getDriveApplications(driveId) {
  const data = await apiRequest(`/applications/drive/${driveId}`);
  return data.applications;
}

/**
 * Recruiter/admin moves an application: APPLIED → SHORTLISTED | REJECTED, SHORTLISTED → SELECTED | REJECTED.
 * When shortlisting, pass `interviewDate` (future ISO string), `meetingLink`, `notes`.
 * When selecting, `offerDeadline` (min 7 days from now; the server clamps it).
 */
export async function updateApplicationStatus(applicationId, { status, interviewDate, meetingLink, notes, offerDeadline }) {
  const data = await apiRequest(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: { status, interviewDate, meetingLink, notes, offerDeadline },
  });
  return { application: data.application, message: data.message };
}

/** decision: 'ACCEPT' | 'DECLINE' */
export async function respondToOffer(applicationId, decision) {
  const data = await apiRequest(`/applications/${applicationId}/offer`, { method: 'PATCH', body: { decision } });
  return { application: data.application, message: data.message };
}

/** Only APPLIED applications can be withdrawn. */
export async function withdrawApplication(applicationId) {
  const data = await apiRequest(`/applications/${applicationId}`, { method: 'DELETE' });
  return { message: data.message };
}
