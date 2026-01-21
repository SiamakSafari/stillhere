import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribed
} from '../../utils/notifications';
import styles from './Settings.module.css';

export const NotificationSettings = ({ data, updateData }) => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      setSupported(isPushSupported());
      setPermission(getPermissionStatus());
      setSubscribed(await isSubscribed());
    };
    checkStatus();
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First request permission
      const permResult = await requestPermission();
      setPermission(permResult.permission || getPermissionStatus());

      if (!permResult.success) {
        setError('Permission denied. Please enable notifications in your browser settings.');
        return;
      }

      // Then subscribe
      const subResult = await subscribeToPush(data.userId);

      if (subResult.success) {
        setSubscribed(true);
        updateData({ pushEnabled: true });
      } else {
        setError(subResult.error || 'Failed to enable notifications');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromPush(data.userId);

      if (result.success) {
        setSubscribed(false);
        updateData({ pushEnabled: false });
      } else {
        setError(result.error || 'Failed to disable notifications');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Push Notifications</h3>
        <p className={styles.sectionDescription}>
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Push Notifications</h3>
      <p className={styles.sectionDescription}>
        Get reminded to check in even when the app isn't open.
      </p>

      {permission === 'denied' ? (
        <div className={`${styles.testResult} ${styles.error}`}>
          Notifications are blocked. Please enable them in your browser settings.
        </div>
      ) : subscribed ? (
        <>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginRight: '8px', color: 'var(--green-primary)' }}
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
              Notifications enabled
            </span>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDisableNotifications}
              loading={isLoading}
            >
              Disable
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="secondary"
          onClick={handleEnableNotifications}
          loading={isLoading}
        >
          Enable Push Notifications
        </Button>
      )}

      {error && (
        <div className={`${styles.testResult} ${styles.error}`}>
          {error}
        </div>
      )}
    </div>
  );
};
