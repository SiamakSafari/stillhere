import { useState, useEffect, useCallback } from 'react';
import { ActivitySelector } from './ActivitySelector';
import { ActivityTimer } from './ActivityTimer';
import { api } from '../../utils/api';
import { trackActivityStarted, trackActivityEnded, trackAlertSent } from '../../utils/analytics';
import styles from './ActivityMode.module.css';

const ACTIVITY_STORAGE_KEY = 'still-here-activity';

export const ActivityMode = ({ data, onActivityComplete }) => {
  const [showSelector, setShowSelector] = useState(false);
  const [activeActivity, setActiveActivity] = useState(null);

  // Load any existing activity from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (stored) {
      try {
        const activity = JSON.parse(stored);
        // Check if activity has expired (including grace period)
        const graceEnd = new Date(activity.expectedEndAt).getTime() + 5 * 60 * 1000;
        if (Date.now() < graceEnd) {
          setActiveActivity(activity);
        } else {
          // Activity fully expired, clear it
          localStorage.removeItem(ACTIVITY_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      }
    }
  }, []);

  // Save activity to storage when it changes
  useEffect(() => {
    if (activeActivity) {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activeActivity));
    } else {
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
    }
  }, [activeActivity]);

  const handleStartActivity = useCallback((activityData) => {
    setActiveActivity(activityData);
    setShowSelector(false);

    // Track analytics
    trackActivityStarted(activityData.type || activityData.label, activityData.durationMinutes);

    // Sync to server
    if (data.userId && navigator.onLine) {
      api.startActivity(data.userId, activityData).catch(console.error);
    }
  }, [data.userId]);

  const handleCompleteActivity = useCallback(async () => {
    const completedActivity = {
      ...activeActivity,
      completedAt: new Date().toISOString(),
      status: 'completed'
    };

    // Add to activity history
    const history = JSON.parse(localStorage.getItem('still-here-activity-history') || '[]');
    history.unshift(completedActivity);
    // Keep last 50 activities
    localStorage.setItem('still-here-activity-history', JSON.stringify(history.slice(0, 50)));

    // Clear active activity
    setActiveActivity(null);

    // Track analytics
    trackActivityEnded(activeActivity.type || activeActivity.label, true);

    // Sync to server
    if (data.userId && navigator.onLine) {
      try {
        await api.completeActivity(data.userId, activeActivity.id || 'current');
      } catch (e) {
        console.error('Failed to sync activity completion:', e);
      }
    }

    // Callback
    if (onActivityComplete) {
      onActivityComplete(completedActivity);
    }
  }, [activeActivity, data.userId, onActivityComplete]);

  const handleExtendActivity = useCallback((minutes) => {
    if (!activeActivity) return;

    const newEndTime = new Date(activeActivity.expectedEndAt);
    newEndTime.setMinutes(newEndTime.getMinutes() + minutes);

    const extended = {
      ...activeActivity,
      expectedEndAt: newEndTime.toISOString(),
      durationMinutes: activeActivity.durationMinutes + minutes
    };

    setActiveActivity(extended);

    // Sync to server
    if (data.userId && navigator.onLine) {
      api.extendActivity(data.userId, minutes).catch(console.error);
    }
  }, [activeActivity, data.userId]);

  const handleCancelActivity = useCallback(() => {
    const cancelledActivity = {
      ...activeActivity,
      completedAt: new Date().toISOString(),
      status: 'cancelled'
    };

    // Add to activity history
    const history = JSON.parse(localStorage.getItem('still-here-activity-history') || '[]');
    history.unshift(cancelledActivity);
    localStorage.setItem('still-here-activity-history', JSON.stringify(history.slice(0, 50)));

    setActiveActivity(null);

    // Track analytics
    trackActivityEnded(activeActivity?.type || activeActivity?.label, false);

    // Sync to server
    if (data.userId && navigator.onLine) {
      api.cancelActivity(data.userId).catch(console.error);
    }
  }, [activeActivity, data.userId]);

  const handleGracePeriodExpired = useCallback(async () => {
    // Alert will be sent by server, but also try to trigger from client
    const alertedActivity = {
      ...activeActivity,
      completedAt: new Date().toISOString(),
      status: 'alerted'
    };

    // Add to activity history
    const history = JSON.parse(localStorage.getItem('still-here-activity-history') || '[]');
    history.unshift(alertedActivity);
    localStorage.setItem('still-here-activity-history', JSON.stringify(history.slice(0, 50)));

    // Try to send alert
    if (data.userId && navigator.onLine) {
      try {
        await api.sendActivityAlert(data.userId, activeActivity);
        // Track that alert was sent
        trackAlertSent('activity_grace_period');
      } catch (e) {
        console.error('Failed to send activity alert:', e);
      }
    }

    setActiveActivity(null);
  }, [activeActivity, data.userId]);

  // If there's an active activity, show the timer
  if (activeActivity) {
    return (
      <ActivityTimer
        activity={activeActivity}
        onComplete={handleCompleteActivity}
        onExtend={handleExtendActivity}
        onCancel={handleCancelActivity}
        onGracePeriodExpired={handleGracePeriodExpired}
        contactName={data.contactName}
      />
    );
  }

  // If selector is open, show it
  if (showSelector) {
    return (
      <ActivitySelector
        onStartActivity={handleStartActivity}
        onCancel={() => setShowSelector(false)}
        contactName={data.contactName}
      />
    );
  }

  // Default: show the start button
  return (
    <button
      className={styles.startButton}
      onClick={() => setShowSelector(true)}
    >
      <span className={styles.startIcon}>⏱️</span>
      <span className={styles.startText}>Start Activity</span>
      <span className={styles.startHint}>Timed check-in for runs, dates, etc.</span>
    </button>
  );
};

export default ActivityMode;
