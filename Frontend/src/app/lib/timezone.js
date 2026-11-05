export const TIMEZONE = 'Asia/Kolkata';

/**
 * Format a date to Indian timezone (IST) — ALWAYS shows IST regardless of viewer.
 * Kept for any place that specifically needs to show IST to everyone
 * (e.g. an India-only admin view). For user-facing trade/notification
 * times, use formatLocalTime instead so each viewer sees their own time.
 * @param {string|Date} date - The date to format
 * @param {Object} options - Optional formatting options
 * @returns {string} Formatted date string
 */
export function formatIndianTime(date, options = {}) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  return d.toLocaleString('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  });
}

/**
 * Format date only (no time), always in IST.
 */
export function formatIndianDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  return d.toLocaleDateString('en-IN', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format time only, always in IST.
 */
export function formatIndianTimeOnly(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  
  return d.toLocaleTimeString('en-IN', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Get time ago in words, computed in IST.
 */
export function getIndianTimeAgo(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
  const now = new Date();
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const dateIST = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  
  const seconds = Math.floor((nowIST.getTime() - dateIST.getTime()) / 1000);
  
  if (seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format a date using the VIEWER'S OWN device/browser timezone.
 * A user in Pakistan sees Pakistan time, a user in India sees Indian
 * time, etc. Use this for all trade/notification timestamps shown to
 * end users — the raw date must always be stored as UTC/ISO (never
 * pre-formatted) so this conversion is possible.
 * @param {string|Date} date - The date to format (must be a real
 *   Date or ISO/parseable timestamp, not an already-formatted string)
 * @param {Object} options - Optional formatting options
 * @returns {string} Formatted date string in the viewer's local time
 */
export function formatLocalTime(date, options = {}) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...options
  });
}

/**
 * Format time only, in the viewer's own device/browser timezone.
 */
export function formatLocalTimeOnly(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}