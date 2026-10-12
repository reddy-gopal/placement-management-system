import { apiRequest } from '../../services/apiClient';
import { listDrives } from '../../services/driveApi';
import { getDriveApplications } from '../../services/applicationApi';
import { formatDate } from '../../utils/format';

const PAGE_SIZE = 100;

export async function listAllDrives(params = {}) {
  const first = await listDrives({ ...params, page: 1, limit: PAGE_SIZE });
  const pages = Math.ceil((first.total ?? first.drives.length) / PAGE_SIZE);
  if (pages <= 1) return first.drives;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) => listDrives({ ...params, page: index + 2, limit: PAGE_SIZE }))
  );
  return rest.reduce((all, page) => all.concat(page.drives), first.drives);
}
export async function listApplicationsForDrives(drives) {
  const perDrive = await Promise.all(
    drives.map((drive) =>
      getDriveApplications(drive._id).then((applications) => applications.map((application) => ({ ...application, drive })))
    )
  );
  return perDrive.flat();
}

export async function countApplicationsByDrive(drives) {
  const results = await Promise.allSettled(drives.map((drive) => getDriveApplications(drive._id)));
  return Object.fromEntries(
    drives.map((drive, index) => [drive._id, results[index].status === 'fulfilled' ? results[index].value.length : null])
  );
}

export async function deleteMyCompany() {
  const data = await apiRequest('/companies/me', { method: 'DELETE' });
  return { message: data.message };
}

export function candidateOf(application) {
  const student = application?.studentId && typeof application.studentId === 'object' ? application.studentId : {};
  const user = student.userId && typeof student.userId === 'object' ? student.userId : {};
  return {
    name: user.name || 'Unnamed student',
    email: user.email || '',
    rollNumber: student.rollNumber || '—',
    branch: student.branch || '—',
    graduationYear: student.graduationYear ?? '—',
    cgpa: student.cgpa,
    activeBacklogs: student.activeBacklogs ?? 0,
    skills: Array.isArray(student.skills) ? student.skills : [],
    resumeUrl: application?.resumeUrl || student.resumeUrl || '',
  };
}

export const formatCgpa = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? '—' : Number(value).toFixed(2);

export function offerSummary(offer) {
  if (!offer?.status) return '';
  if (offer.status === 'PENDING') return `Offer pending · by ${formatDate(offer.deadline, { withYear: false })}`;
  return { ACCEPTED: 'Offer accepted', DECLINED: 'Offer declined', EXPIRED: 'Offer expired' }[offer.status] ?? '';
}

export const interviewAt = (application) => {
  const value = application?.interview?.scheduledAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const shortDate = (value) => formatDate(value, { withYear: false });

export function endOfDay(dateInputValue) {
  if (!dateInputValue) return null;
  const date = new Date(`${dateInputValue}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}
