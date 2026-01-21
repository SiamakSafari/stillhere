import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import {
  isGeolocationSupported,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentPosition
} from '../../utils/geolocation';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const LocationSettings = ({ data, updateData }) => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState('unknown');
  const [enabled, setEnabled] = useState(data.locationSharingEnabled || false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      setSupported(isGeolocationSupported());
      const perm = await checkLocationPermission();
      setPermission(perm);
    };
    checkStatus();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    setTestResult(null);

    if (!enabled) {
      // Enabling - request permission first
      const result = await requestLocationPermission();

      if (result.success) {
        setEnabled(true);
        setPermission('granted');
        await saveToServer(true);
        updateData({ locationSharingEnabled: true });
      } else {
        setTestResult({
          type: 'error',
          message: result.error || 'Could not enable location sharing'
        });
      }
    } else {
      // Disabling
      setEnabled(false);
      await saveToServer(false);
      updateData({ locationSharingEnabled: false });
    }

    setIsLoading(false);
  };

  const saveToServer = async (value) => {
    if (!data.userId) return;

    try {
      await api.updateUser(data.userId, {
        locationSharingEnabled: value
      });
    } catch (error) {
      console.error('Failed to save location settings:', error);
    }
  };

  const handleTestLocation = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const position = await getCurrentPosition();
      setTestResult({
        type: 'success',
        message: `Location found: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)} (accuracy: ${Math.round(position.accuracy)}m)`
      });
    } catch (error) {
      setTestResult({
        type: 'error',
        message: error.message
      });
    }

    setIsLoading(false);
  };

  if (!supported) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Location Sharing</h3>
        <p className={styles.sectionDescription}>
          Location sharing is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Location Sharing</h3>
      <p className={styles.sectionDescription}>
        Include your last known location when alerts are sent to your emergency contact.
      </p>

      {permission === 'denied' ? (
        <div className={`${styles.testResult} ${styles.error}`}>
          Location access is blocked. Please enable it in your browser settings.
        </div>
      ) : (
        <>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              Share location with alerts
            </span>
            <button
              className={`${styles.toggle} ${enabled ? styles.toggleActive : ''}`}
              onClick={handleToggle}
              disabled={isLoading}
              aria-label={enabled ? 'Disable location sharing' : 'Enable location sharing'}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {enabled && (
            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <Button
                variant="secondary"
                size="small"
                onClick={handleTestLocation}
                loading={isLoading}
              >
                Test Location
              </Button>
            </div>
          )}
        </>
      )}

      {testResult && (
        <div className={`${styles.testResult} ${testResult.type === 'success' ? styles.success : styles.error}`}>
          {testResult.message}
        </div>
      )}

      {enabled && (
        <p className={styles.sectionDescription} style={{ marginTop: 'var(--spacing-md)', marginBottom: 0 }}>
          Your location will only be captured when you check in, and only shared if an alert is sent.
        </p>
      )}
    </div>
  );
};
