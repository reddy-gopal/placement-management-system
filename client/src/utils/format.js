const toDate = (value) => {
  const date = value instanceof Date ? value : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "14 Oct 2026" */
export function formatDate(value, { withYear = true } = {}) {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...(withYear && { year: 'numeric' }) }).format(date);
}

/** "Wed, 14 Oct · 10:30" */
export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return '—';
  const day = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  const time = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} · ${time}`;
}

/** Whole days from now until `value` (negative when past). */
export function daysUntil(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return null;
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

/** "Closes today" / "3 days left" / "Closed". */
export function deadlineLabel(value, now = new Date()) {
  const days = daysUntil(value, now);
  if (days === null) return '—';
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

/** "2 hours ago", "3 days ago", or a date for anything older than a month. */
export function timeAgo(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return '—';
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(date);
}

/** 9 → "9.0", 12.25 → "12.25" (LPA values). */
export function formatLpa(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '—';
  const number = Number(value);
  return Number.isInteger(number) ? number.toFixed(1) : String(Math.round(number * 100) / 100);
}

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: 'Full-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

export const employmentTypeLabel = (type) => EMPLOYMENT_TYPE_LABELS[type] ?? type ?? '—';

/** Two-letter monogram for a company or person name ("Arcline Systems" → "AS"). */
export function monogram(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** "1,248" */
export const formatCount = (value) => (value === null || value === undefined ? '—' : Number(value).toLocaleString('en-IN'));

/** "<input type=datetime-local>" value for a Date (local time). */
export function toDateTimeLocalValue(value) {
  const date = toDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "<input type=date>" value for a Date (local time). */
export const toDateInputValue = (value) => toDateTimeLocalValue(value).slice(0, 10);
