import { useState } from 'react';
import { api } from '../../utils/api';
import styles from './SnoozeButton.module.css';

export const SnoozeButton = ({ data, updateData, onSnoozeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isActive = data.snoozeUntil && new Date(data.snoozeUntil) > new Date();
  const snoozeEndTime = isActive ? new Date(data.snoozeUntil) : null;

  const handleSnooze = async (hours) => {
    if (!data.userId) return;

    setIsLoading(true);
    try {
      const result = await api.snoozeAlerts(data.userId, hours);
      updateData({ snoozeUntil: result.snoozeUntil });
      onSnoozeChange?.('snoozed', hours);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to snooze:', error);
      onSnoozeChange?.('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSnooze = async () => {
    if (!data.userId) return;

    setIsLoading(true);
    try {
      await api.cancelSnooze(data.userId);
      updateData({ snoozeUntil: null });
      onSnoozeChange?.('cancelled');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to cancel snooze:', error);
      onSnoozeChange?.('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isActive) {
    return (
      <div className={styles.snoozeActive}>
        <div className={styles.snoozeInfo}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z" />
            <polyline points="2.32 6.16 12 11 21.68 6.16" />
            <line x1="12" y1="22.76" x2="12" y2="11" />
          </svg>
          <span>Alerts snoozed until {formatTime(snoozeEndTime)}</span>
        </div>
        <button
          className={styles.cancelButton}
          onClick={handleCancelSnooze}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.snoozeButton}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 12h2M12 4v2M17.66 17.66l1.41 1.41M20 12h2M6.34 17.66l-1.41 1.41M12 20v2" />
          <circle cx="12" cy="12" r="4" />
        </svg>
        Snooze Alerts
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={isOpen ? styles.rotated : ''}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="menu">
          <p className={styles.dropdownHint}>
            Delay alerts to your emergency contact
          </p>
          <button
            className={styles.option}
            onClick={() => handleSnooze(1)}
            disabled={isLoading}
            role="menuitem"
          >
            1 hour
          </button>
          <button
            className={styles.option}
            onClick={() => handleSnooze(2)}
            disabled={isLoading}
            role="menuitem"
          >
            2 hours
          </button>
          <button
            className={styles.option}
            onClick={() => handleSnooze(4)}
            disabled={isLoading}
            role="menuitem"
          >
            4 hours
          </button>
          <button
            className={styles.option}
            onClick={() => handleSnooze(8)}
            disabled={isLoading}
            role="menuitem"
          >
            8 hours
          </button>
          <button
            className={styles.option}
            onClick={() => handleSnooze(24)}
            disabled={isLoading}
            role="menuitem"
          >
            24 hours
          </button>
        </div>
      )}
    </div>
  );
};
