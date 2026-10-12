import { apiRequest } from './apiClient';

/**
 * @returns {Promise<{ totalPlaced, placementPercentage, avgPackage, highestPackage, totalStudents,
 *   totalRecruiters, totalCompanies, totalDrives, openDrives, totalApplications, selectedApplications }>}
 */
export async function getAdminStats() {
  const { success: _success, ...stats } = await apiRequest('/admin/stats');
  return stats;
}

/** Student profiles with `userId` populated ({ name, email, role }). */
export async function getAdminStudents() {
  const data = await apiRequest('/admin/students');
  return data.students;
}

export async function getAdminRecruiters() {
  const data = await apiRequest('/admin/recruiters');
  return data.recruiters;
}

/** Companies with `recruiterId` populated ({ name, email }). */
export async function getAdminCompanies() {
  const data = await apiRequest('/admin/companies');
  return data.companies;
}

/** Every drive (any status) with `companyId` fully populated. */
export async function getAdminDrives() {
  const data = await apiRequest('/admin/drives');
  return data.drives;
}

/**
 * Every application with `studentId` (+ `studentId.userId` { name, email }) and
 * `driveId` (+ `driveId.companyId` { name }) populated.
 */
export async function getAdminApplications() {
  const data = await apiRequest('/admin/applications');
  return data.applications;
}

/** Admin only. Removes the student profile. */
export async function deleteStudent(studentId) {
  const data = await apiRequest(`/students/${studentId}`, { method: 'DELETE' });
  return { message: data.message };
}
