import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../common/Button';
import styles from './ActivityMode.module.css';

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes

// Visual fallback notification when audio/vibration fails
const showVisualAlert = (message) => {
  // Try native notification first
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Still Here', { body: message, icon: '/favicon.svg' });
      return;
    } catch (e) {}
  }
  // Fallback: flash the document title
  const originalTitle = document.title;
  let flashes = 0;
  const flashInterval = setInterval(() => {
    document.title = flashes % 2 === 0 ? '⚠️ CHECK IN NOW' : originalTitle;
    flashes++;
    if (flashes >= 10) {
      clearInterval(flashInterval);
      document.title = originalTitle;
    }
  }, 500);
};

export const ActivityTimer = ({
  activity,
  onComplete,
  onExtend,
  onCancel,
  onGracePeriodExpired,
  contactName
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isGracePeriod, setIsGracePeriod] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [alertShown, setAlertShown] = useState(false);

  // Track when grace period started - this fixes the extension bug
  // When user extends during grace period, we recalculate from extension time
  const graceStartTimeRef = useRef(null);

  // Calculate time remaining
  const updateTimeRemaining = useCallback(() => {
    const endTime = new Date(activity.expectedEndAt).getTime();
    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0 && !isGracePeriod) {
      // Timer expired, enter grace period
      setIsGracePeriod(true);
      graceStartTimeRef.current = now; // Track when grace period started
      setTimeRemaining(GRACE_PERIOD_MS);

      // Play warning sound/vibration with fallback
      let alertTriggered = false;

      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 200]);
          alertTriggered = true;
        } catch (e) {}
      }

      // Try to play alarm sound
      try {
        const audio = new Audio('/sounds/warning.mp3');
        audio.play()
          .then(() => { alertTriggered = true; })
          .catch(() => {});
      } catch (e) {}

      // Visual fallback if audio/vibration failed
      setTimeout(() => {
        if (!alertTriggered && !alertShown) {
          showVisualAlert('Timer expired! Check in now to avoid alerting your contact.');
          setAlertShown(true);
        }
      }, 100);

    } else if (remaining <= 0 && isGracePeriod) {
      // Grace period countdown - use graceStartTimeRef for accurate calculation
      const graceStart = graceStartTimeRef.current || endTime;
      const graceEnd = graceStart + GRACE_PERIOD_MS;
      const graceRemaining = graceEnd - now;

      if (graceRemaining <= 0) {
        // Grace period expired - send alert
        onGracePeriodExpired();
        return;
      }

      setTimeRemaining(graceRemaining);
    } else {
      setTimeRemaining(remaining);
    }
  }, [activity.expectedEndAt, isGracePeriod, onGracePeriodExpired, alertShown]);

  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  const formatTime = (ms) => {
    if (ms <= 0) return '0:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    await onComplete();
  };

  const handleExtend = (minutes) => {
    // Reset grace period state when extending
    setIsGracePeriod(false);
    graceStartTimeRef.current = null; // Reset grace period tracking
    setAlertShown(false);
    onExtend(minutes);
  };

  return (
    <div className={`${styles.timer} ${isGracePeriod ? styles.timerGrace : ''}`}>
      {/* Activity info */}
      <div className={styles.timerHeader}>
        <span className={styles.timerActivity}>
          {isGracePeriod ? 'Check in now!' : activity.label}
        </span>
      </div>

      {/* Countdown */}
      <div className={`${styles.timerDisplay} ${isGracePeriod ? styles.timerDisplayGrace : ''}`}>
        <span className={styles.timerTime}>{formatTime(timeRemaining)}</span>
        <span className={styles.timerLabel}>
          {isGracePeriod ? 'until alert sent' : 'remaining'}
        </span>
      </div>

      {/* Grace period warning */}
      {isGracePeriod && (
        <div className={styles.graceWarning}>
          <span>Timer expired! {contactName || 'Your contact'} will be alerted in {formatTime(timeRemaining)}</span>
        </div>
      )}

      {/* Main action button */}
      <Button
        onClick={handleComplete}
        loading={isCompleting}
        fullWidth
        className={styles.safeButton}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        I'm Back Safe
      </Button>

      {/* Secondary actions */}
      <div className={styles.timerActions}>
        <button
          className={styles.extendButton}
          onClick={() => handleExtend(30)}
        >
          + Add 30 min
        </button>
        <button
          className={styles.endButton}
          onClick={onCancel}
        >
          End Early
        </button>
      </div>

      {/* Footer info */}
      <p className={styles.timerFooter}>
        {isGracePeriod
          ? `Tap "I'm Back Safe" to cancel the alert`
          : `If timer ends, ${contactName || 'your contact'} will be notified${activity.latitude ? ' with your location' : ''}`
        }
      </p>
    </div>
  );
};
