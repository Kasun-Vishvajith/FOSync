// Degree programs in the Statistics Department
export const DEGREES = [
  'Statistics',
  'Data Science',
  'Applied Statistics',
  'Industrial Statistics',
];

// Event types
export const EVENT_TYPES = [
  { value: 'lecture', label: 'Lecture', color: '#3b82f6' },
  { value: 'exam', label: 'Exam', color: '#ef4444' },
  { value: 'deadline', label: 'Deadline', color: '#f59e0b' },
  { value: 'practical', label: 'Practical', color: '#16a34a' },
  { value: 'tutorial', label: 'Tutorial', color: '#9333ea' },
];

// User roles
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

// Calendar view modes
export const CALENDAR_VIEWS = {
  WEEK: 'week',
  MONTH: 'month',
};

// Days of the week
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_OF_WEEK_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time slots for weekly view (6 AM to 8 PM)
export const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 6;
  return {
    hour,
    label: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
  };
});
