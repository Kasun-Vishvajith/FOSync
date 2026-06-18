// Registration number validation
export const REG_NO_PATTERN = /^\d{4}s\d{5}$/;

export function validateRegNo(regNo) {
  return REG_NO_PATTERN.test(regNo);
}

// Convert reg_no to synthetic Firebase email
export function regNoToEmail(regNo) {
  return `${regNo}@fosync.local`;
}

// Password validation
export function validatePassword(password) {
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

// Format Firestore timestamp to readable date
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get event type color class
export function getEventTypeClass(type) {
  const map = {
    lecture: 'badge-lecture',
    exam: 'badge-exam',
    deadline: 'badge-deadline',
  };
  return map[type] || 'badge-lecture';
}

// Get event type colors for calendar rendering
export function getEventTypeColor(type) {
  const map = {
    lecture: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' },
    exam: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' },
    deadline: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' },
  };
  return map[type] || map.lecture;
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Truncate text
export function truncate(str, maxLen = 40) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}
