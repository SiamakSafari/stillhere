import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const CheckInWindow = ({ data, updateData }) => {
  const [startTime, setStartTime] = useState(data.checkInWindowStart || '08:00');
  const [endTime, setEndTime] = useState(data.checkInWindowEnd || '22:00');
  const [isEnabled, setIsEnabled] = useState(!!data.checkInWindowStart);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleToggle = () => {
    if (isEnabled) {
      // Disable window
      setIsEnabled(false);
      updateData({
        checkInWindowStart: null,
        checkInWindowEnd: null
      });
      syncToServer(null, null);
    } else {
      // Enable window with current times
      setIsEnabled(true);
      updateData({
        checkInWindowStart: startTime,
        checkInWindowEnd: endTime
      });
      syncToServer(startTime, endTime);
    }
  };

  const handleTimeChange = (type, value) => {
    if (type === 'start') {
      setStartTime(value);
      if (isEnabled) {
        updateData({ checkInWindowStart: value });
        syncToServer(value, endTime);
      }
    } else {
      setEndTime(value);
      if (isEnabled) {
        updateData({ checkInWindowEnd: value });
        syncToServer(startTime, value);
      }
    }
  };

  const syncToServer = async (start, end) => {
    if (!data.userId) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      await api.updateUser(data.userId, {
        checkInWindowStart: start,
        checkInWindowEnd: end,
        timezone: data.timezone
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to sync check-in window:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate time options (every 30 minutes)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      const value = `${hour}:${minute}`;
      const label = new Date(`2000-01-01T${value}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      timeOptions.push({ value, label });
    }
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Check-in Window</h3>
      <p className={styles.sectionDescription}>
        Set your preferred check-in time. Reminders will be sent if you miss this window.
      </p>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>Enable check-in window</span>
        <button
          className={`${styles.toggle} ${isEnabled ? styles.toggleActive : ''}`}
          onClick={handleToggle}
          aria-label={isEnabled ? 'Disable check-in window' : 'Enable check-in window'}
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      {isEnabled && (
        <div className={styles.timeInputs}>
          <div className={styles.timeField}>
            <label className={styles.label}>From</label>
            <select
              className={styles.select}
              value={startTime}
              onChange={(e) => handleTimeChange('start', e.target.value)}
            >
              {timeOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className={styles.timeField}>
            <label className={styles.label}>To</label>
            <select
              className={styles.select}
              value={endTime}
              onChange={(e) => handleTimeChange('end', e.target.value)}
            >
              {timeOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {saveStatus === 'saved' && (
        <div className={`${styles.testResult} ${styles.success}`}>
          Settings saved
        </div>
      )}
      {saveStatus === 'error' && (
        <div className={`${styles.testResult} ${styles.error}`}>
          Failed to save settings
        </div>
      )}
    </div>
  );
};
