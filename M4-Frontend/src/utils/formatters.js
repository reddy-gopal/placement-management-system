/**
 * Formatting helpers for Packages, Dates, Countdowns, and Text.
 */

export const formatPackage = (packageLpa) => {
  if (packageLpa === undefined || packageLpa === null) return 'Not Disclosed';
  const num = Number(packageLpa);
  if (isNaN(num)) return `${packageLpa} LPA`;
  return `₹${num.toFixed(num % 1 === 0 ? 1 : 2)} LPA`;
};

export const formatDate = (dateInput) => {
  if (!dateInput) return 'TBA';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'TBA';
  }
};

export const getDeadlineCountdown = (deadlineInput) => {
  if (!deadlineInput) {
    return {
      text: 'No deadline set',
      isUrgent: false,
      isExpired: false,
      days: 0,
      hours: 0,
    };
  }

  const deadline = new Date(deadlineInput);
  const now = new Date();
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return {
      text: 'Registration Closed',
      isUrgent: true,
      isExpired: true,
      days: 0,
      hours: 0,
    };
  }

  const diffSec = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  if (days > 1) {
    return {
      text: `${days} days left`,
      isUrgent: days <= 2,
      isExpired: false,
      days,
      hours,
    };
  }

  if (days === 1) {
    return {
      text: `1 day, ${hours}h left`,
      isUrgent: true,
      isExpired: false,
      days: 1,
      hours,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h ${minutes}m left`,
      isUrgent: true,
      isExpired: false,
      days: 0,
      hours,
    };
  }

  return {
    text: `${minutes}m left`,
    isUrgent: true,
    isExpired: false,
    days: 0,
    hours: 0,
  };
};

export const getInitials = (name) => {
  if (!name) return 'NS';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
