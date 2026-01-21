import { useState, useMemo } from 'react';
import styles from './HistoryCalendar.module.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Mood colors for visual feedback
const MOOD_COLORS = {
  great: { bg: '#22c55e', label: 'Great' },
  good: { bg: '#4ade80', label: 'Good' },
  okay: { bg: '#fbbf24', label: 'Okay' },
  low: { bg: '#f97316', label: 'Low' },
  rough: { bg: '#ef4444', label: 'Rough' },
  default: { bg: '#6b7280', label: 'Checked in' }
};

export const HistoryCalendar = ({ checkInHistory, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Parse check-in history into a Set of date strings for quick lookup
  const checkInDates = useMemo(() => {
    const dates = new Set();
    (checkInHistory || []).forEach(entry => {
      // Support both old format (string) and new format (object with date)
      const dateStr = typeof entry === 'string' ? entry : entry?.date;
      if (dateStr) {
        const date = new Date(dateStr);
        dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      }
    });
    return dates;
  }, [checkInHistory]);

  // Get check-in data for a specific date (for mood/notes in future)
  const getCheckInData = (year, month, day) => {
    return (checkInHistory || []).find(entry => {
      const dateStr = typeof entry === 'string' ? entry : entry?.date;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date.getFullYear() === year &&
             date.getMonth() === month &&
             date.getDate() === day;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ day: null, key: `empty-${i}` });
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${month}-${day}`;
    const hasCheckIn = checkInDates.has(dateKey);
    const checkInData = hasCheckIn ? getCheckInData(year, month, day) : null;
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

    calendarDays.push({
      day,
      key: dateKey,
      hasCheckIn,
      checkInData,
      isToday
    });
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Count total check-ins for the current month
  const monthCheckIns = calendarDays.filter(d => d.hasCheckIn).length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>Check-in History</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className={styles.navigation}>
          <button
            className={styles.navButton}
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button className={styles.monthYear} onClick={goToToday}>
            {MONTHS[month]} {year}
          </button>

          <button
            className={styles.navButton}
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className={styles.calendar}>
          <div className={styles.weekDays}>
            {DAYS.map(day => (
              <div key={day} className={styles.weekDay}>{day}</div>
            ))}
          </div>

          <div className={styles.days}>
            {calendarDays.map(({ day, key, hasCheckIn, checkInData, isToday }) => {
              const moodInfo = checkInData?.mood
                ? MOOD_COLORS[checkInData.mood]
                : MOOD_COLORS.default;
              const tooltipText = hasCheckIn
                ? `${moodInfo.label}${checkInData?.note ? ': ' + checkInData.note.substring(0, 50) + (checkInData.note.length > 50 ? '...' : '') : ''}`
                : '';

              return (
                <div
                  key={key}
                  className={`${styles.day} ${!day ? styles.empty : ''} ${isToday ? styles.today : ''} ${hasCheckIn ? styles.hasCheckIn : ''}`}
                  data-mood={checkInData?.mood || ''}
                  title={tooltipText}
                >
                  {day && (
                    <>
                      <span className={styles.dayNumber}>{day}</span>
                      {hasCheckIn && (
                        <span
                          className={styles.checkInDot}
                          style={{ backgroundColor: moodInfo.bg }}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {checkInDates.size === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="12" cy="15" r="2" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No check-ins yet</h3>
            <p className={styles.emptyText}>
              Start your wellness journey by tapping the big green button on the home screen.
            </p>
          </div>
        ) : monthCheckIns === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className={styles.emptyTitle}>No check-ins in {MONTHS[month]}</h3>
            <p className={styles.emptyText}>
              Navigate to other months to see your history, or start checking in today!
            </p>
          </div>
        ) : (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{monthCheckIns}</span>
              <span className={styles.statLabel}>check-ins this month</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{checkInDates.size}</span>
              <span className={styles.statLabel}>total check-ins</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
