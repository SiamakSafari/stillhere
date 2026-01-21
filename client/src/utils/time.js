// Get the user's current timezone
export const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// Convert date to UTC midnight for consistent comparisons
const toUTCDateString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD in UTC
};

// Get local date string for a given date in user's timezone
const toLocalDateString = (date, timezone) => {
  if (!date) return null;
  const d = new Date(date);
  try {
    // Use Intl.DateTimeFormat for timezone-aware formatting
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || getUserTimezone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // Returns YYYY-MM-DD in local timezone
  } catch {
    // Fallback to local date
    return d.toLocaleDateString('en-CA');
  }
};

// Get today's date string in user's timezone
const getTodayLocalString = (timezone) => {
  return toLocalDateString(new Date(), timezone);
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Compare two dates in the user's local timezone
export const isSameDay = (date1, date2, timezone) => {
  if (!date1 || !date2) return false;
  const tz = timezone || getUserTimezone();
  const d1Local = toLocalDateString(date1, tz);
  const d2Local = toLocalDateString(date2, tz);
  return d1Local === d2Local;
};

export const isYesterday = (date, timezone) => {
  if (!date) return false;
  const tz = timezone || getUserTimezone();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday, tz);
};

export const canCheckInToday = (lastCheckIn, timezone) => {
  if (!lastCheckIn) return true;
  return !isSameDay(lastCheckIn, new Date(), timezone);
};

// Compare vacation end time in UTC for consistency
export const isOnVacation = (vacationUntil) => {
  if (!vacationUntil) return false;
  // Use UTC comparison to avoid timezone edge cases
  const vacationEndUTC = new Date(vacationUntil).getTime();
  const nowUTC = Date.now();
  return vacationEndUTC > nowUTC;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
};

export const getDaysUntil = (date) => {
  if (!date) return 0;
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const MILESTONES = [7, 14, 30, 60, 100, 365];

export const getNextMilestone = (streak) => {
  return MILESTONES.find(m => m > streak) || streak + 100;
};

export const isMilestone = (streak) => {
  return MILESTONES.includes(streak);
};
