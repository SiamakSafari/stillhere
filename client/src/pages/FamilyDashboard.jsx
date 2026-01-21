import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import styles from './FamilyDashboard.module.css';

// Format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Format date for check-in history
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    checked_in: { label: 'Checked In', className: styles.statusCheckedIn },
    pending: { label: 'Pending', className: styles.statusPending },
    overdue: { label: 'Overdue', className: styles.statusOverdue },
    vacation: { label: 'On Vacation', className: styles.statusVacation },
    unknown: { label: 'Unknown', className: styles.statusUnknown }
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      {config.label}
    </span>
  );
};

export const FamilyDashboard = ({ token }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await api.getFamilyDashboard(token);
        setData(result);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const result = await api.getFamilyDashboard(token);
        setData(result);
      } catch (err) {
        console.error('Failed to refresh dashboard:', err);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <p className={styles.errorHint}>
            This link may have expired or been revoked.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Group check-ins by day for last 7 days display
  const last7Days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dateStr = date.toISOString().split('T')[0];
    const hasCheckIn = data.checkInHistory.some(checkIn => {
      const checkInDate = new Date(checkIn).toISOString().split('T')[0];
      return checkInDate === dateStr;
    });

    last7Days.push({
      date: date,
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatDate(date),
      hasCheckIn
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1>Still Here</h1>
          {data.shareLabel && (
            <span className={styles.shareLabel}>{data.shareLabel}</span>
          )}
        </header>

        <div className={styles.mainCard}>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{data.name}</h2>
            <StatusBadge status={data.status} />
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Last Check-in</span>
                <span className={styles.statValue}>{formatRelativeTime(data.lastCheckIn)}</span>
              </div>
            </div>

            <div className={styles.stat}>
              <div className={styles.statIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Current Streak</span>
                <span className={styles.statValue}>
                  {data.streak} day{data.streak !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {data.isOnVacation && data.vacationUntil && (
            <div className={styles.vacationNotice}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              <span>On vacation until {new Date(data.vacationUntil).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className={styles.historyCard}>
          <h3 className={styles.historyTitle}>Last 7 Days</h3>
          <div className={styles.historyGrid}>
            {last7Days.map((day, index) => (
              <div key={index} className={styles.historyDay}>
                <div className={`${styles.historyIndicator} ${day.hasCheckIn ? styles.historyCheckedIn : styles.historyMissed}`}>
                  {day.hasCheckIn ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <span className={styles.historyLabel}>{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>This is a read-only view. Only the user can check in.</p>
          <p className={styles.footerBrand}>Powered by Still Here</p>
        </footer>
      </div>
    </div>
  );
};

export default FamilyDashboard;
