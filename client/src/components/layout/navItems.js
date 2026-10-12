/**
 * Navigation per role. `end` marks items that match only their exact path (dashboards),
 * `short` is the label used in the phone tab bar.
 */
export const NAV = {
  STUDENT: {
    label: 'Student',
    items: [
      { label: 'Dashboard', short: 'Home', to: '/student', end: true },
      { label: 'Job drives', short: 'Drives', to: '/student/drives' },
      { label: 'My applications', short: 'Applications', to: '/student/applications' },
      { label: 'Profile', short: 'Profile', to: '/student/profile' },
    ],
  },
  RECRUITER: {
    label: 'Recruiter',
    items: [
      { label: 'Dashboard', short: 'Home', to: '/recruiter', end: true },
      { label: 'Job drives', short: 'Drives', to: '/recruiter/drives' },
      { label: 'Applications', short: 'Applicants', to: '/recruiter/applications' },
      { label: 'Company profile', short: 'Company', to: '/recruiter/company' },
    ],
  },
  ADMIN: {
    label: 'Placement cell',
    items: [
      { label: 'Overview', short: 'Overview', to: '/admin', end: true },
      { label: 'Students', short: 'Students', to: '/admin/students' },
      { label: 'Companies & drives', short: 'Companies', to: '/admin/companies' },
      { label: 'Reports', short: 'Reports', to: '/admin/reports' },
    ],
  },
};

/** Kept for code that predates role-aware navigation. */
export const STUDENT_NAV_ITEMS = NAV.STUDENT.items;

/** The nav item whose path best matches `pathname` (longest prefix wins). */
export function findNavItem(items, pathname) {
  return items
    .filter((item) => (item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
}
