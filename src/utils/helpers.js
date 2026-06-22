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

export function getCourseColor(courseId) {
  if (!courseId) return { bg: 'var(--color-primary-container)/10', border: 'var(--color-primary-container)/20', text: 'var(--color-primary)', bar: 'var(--color-primary)' };

  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = courseId.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Predefined beautiful hues to keep the calendar harmonious
  const hues = [
    215, // Soft Blue
    150, // Emerald Green
    345, // Rose Pink
    40,  // Warm Amber
    275, // Rich Purple
    25,  // Bright Orange
    175, // Deep Teal
    200, // Sky Blue
    90,  // Lime/Olive Green
    315, // Violet Pink
  ];

  const hue = hues[Math.abs(hash) % hues.length];

  return {
    bg: `hsla(${hue}, 85%, 96%, 0.85)`,
    border: `hsla(${hue}, 70%, 80%, 0.5)`,
    text: `hsl(${hue}, 75%, 32%)`,
    bar: `hsl(${hue}, 75%, 42%)`,
    hoverText: `hsl(${hue}, 80%, 22%)`,
  };
}



// Capitalize words and format underscores/spaces
export function capitalize(str) {
  if (!str) return '';
  return str
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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

// Parse duration or ending time input
export function parseDurationOrEndTime(input, startHours, startMinutes) {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // Try duration regex (e.g., 2h, 1.5h, 90m, 90 mins, etc.)
  const durationRegex = /^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)$/i;
  const durMatch = clean.match(durationRegex);
  if (durMatch) {
    const value = parseFloat(durMatch[1]);
    const unit = durMatch[2];
    let additionalMinutes;
    if (unit.startsWith('h')) {
      additionalMinutes = Math.round(value * 60);
    } else {
      additionalMinutes = Math.round(value);
    }

    const totalMin = startMinutes + additionalMinutes;
    const endHours = (startHours + Math.floor(totalMin / 60)) % 24;
    const endMinutes = totalMin % 60;
    
    const pad = (n) => String(n).padStart(2, '0');
    const displayTime = `${endHours === 0 || endHours === 12 ? 12 : endHours % 12}:${pad(endMinutes)} ${endHours >= 12 ? 'PM' : 'AM'}`;

    return {
      hours: endHours,
      minutes: endMinutes,
      formatted12: displayTime,
      isDuration: true,
      durationMinutes: additionalMinutes
    };
  }

  // Otherwise, try custom time
  const parsedTime = parseCustomTime(input);
  if (parsedTime) {
    return {
      hours: parsedTime.hours,
      minutes: parsedTime.minutes,
      formatted12: parsedTime.formatted12,
      isDuration: false
    };
  }

  return null;
}


