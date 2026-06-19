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

// Get degree colors for calendar rendering (dynamic hashing)
export function getDegreeColor(degreeName) {
  if (!degreeName) return { bg: '#e5f0ff', border: '#0f62fe', text: '#0f62fe' };
  
  let hash = 0;
  for (let i = 0; i < degreeName.length; i++) {
    hash = degreeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  
  return {
    bg: `hsl(${hue}, 85%, 96%)`,
    border: `hsl(${hue}, 85%, 60%)`,
    text: `hsl(${hue}, 85%, 35%)`,
  };
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
