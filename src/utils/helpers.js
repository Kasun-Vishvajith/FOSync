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
    practical: 'badge-practical',
    tutorial: 'badge-tutorial',
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

export function getEventTypeColor(type) {
  const t = type?.toLowerCase() || 'lecture';
  switch (t) {
    case 'exam':
      return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' }; // Red
    case 'practical':
      return { bg: '#f3e8ff', border: '#a855f7', text: '#7e22ce' }; // Purple
    case 'tutorial':
      return { bg: '#e0e7ff', border: '#6366f1', text: '#4338ca' }; // Indigo
    case 'deadline':
      return { bg: '#ffedd5', border: '#f97316', text: '#c2410c' }; // Orange
    case 'lecture':
    default:
      return { bg: '#e5f0ff', border: '#3b82f6', text: '#1d4ed8' }; // Blue
  }
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

// Parse custom time input strings (e.g. "10:30 AM", "3 PM", "15:00", "8.15 pm")
export function parseCustomTime(timeStr) {
  if (!timeStr) return null;
  
  const clean = timeStr.trim().toLowerCase();
  
  // Matches "H", "H:MM", "H.MM" with optional "AM"/"PM" suffix (with optional spaces)
  const timeRegex = /^(\d{1,2})(?::|\.)?(\d{2})?\s*(am|pm)?$/i;
  const match = clean.match(timeRegex);
  
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];
  
  if (ampm) {
    if (ampm === 'pm' && hours < 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
  }
  
  if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
    const pad = (n) => String(n).padStart(2, '0');
    return {
      hours,
      minutes,
      formatted24: `${pad(hours)}:${pad(minutes)}`,
      formatted12: `${hours === 0 || hours === 12 ? 12 : hours % 12}:${pad(minutes)} ${hours >= 12 ? 'PM' : 'AM'}`,
    };
  }
  
  return null;
}

