import { useState, useEffect } from 'react';
import styles from './Settings.module.css';

export const ConfirmationStatus = ({ data }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!data.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/confirmations/status/${data.userId}`);
        if (response.ok) {
          const result = await response.json();
          setStatus(result);
        }
      } catch (error) {
        console.error('Failed to fetch confirmation status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [data.userId]);

  if (loading) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Alert Status</h3>
        <p className={styles.sectionDescription}>Loading...</p>
      </div>
    );
  }

  if (!status || !status.hasAlerts) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Alert Status</h3>
        <p className={styles.sectionDescription}>
          No alerts have been sent yet. Keep up the check-ins!
        </p>
        <div className={styles.statusBadge} data-status="good">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          All good
        </div>
      </div>
    );
  }

  const { lastAlert } = status;
  const sentDate = new Date(lastAlert.sentAt).toLocaleDateString();
  const sentTime = new Date(lastAlert.sentAt).toLocaleTimeString();

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Alert Status</h3>
      <p className={styles.sectionDescription}>
        Information about the most recent alert sent to your emergency contact.
      </p>

      <div className={styles.alertStatus}>
        <div className={styles.alertStatusRow}>
          <span className={styles.alertStatusLabel}>Last alert sent:</span>
          <span className={styles.alertStatusValue}>{sentDate} at {sentTime}</span>
        </div>
        <div className={styles.alertStatusRow}>
          <span className={styles.alertStatusLabel}>Alert type:</span>
          <span className={styles.alertStatusValue}>
            {lastAlert.alertType === 'email' ? 'Email' :
             lastAlert.alertType === 'sms' ? 'SMS' : 'Email & SMS'}
          </span>
        </div>
        <div className={styles.alertStatusRow}>
          <span className={styles.alertStatusLabel}>Confirmation:</span>
          {lastAlert.confirmedAt ? (
            <span className={`${styles.alertStatusValue} ${styles.confirmed}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Confirmed on {new Date(lastAlert.confirmedAt).toLocaleDateString()}
            </span>
          ) : (
            <span className={`${styles.alertStatusValue} ${styles.pending}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Awaiting confirmation
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
