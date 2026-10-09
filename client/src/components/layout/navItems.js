import { Briefcase, CalendarClock, FileText, LayoutDashboard, UserRound } from 'lucide-react';

/** Student navigation. Items without `to` are not built yet and render as disabled "Soon" entries. */
export const STUDENT_NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'My Profile', icon: UserRound, to: '/student/profile' },
  { label: 'Placement Drives', icon: Briefcase },
  { label: 'Applications', icon: FileText },
  { label: 'Interviews', icon: CalendarClock },
];
