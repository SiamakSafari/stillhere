import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const SmsCheckIn = ({ data, updateData }) => {
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || '');
  const [enabled, setEnabled] = useState(data.smsCheckinEnabled || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [twilioNumber, setTwilioNumber] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if SMS webhook is configured
    const checkSmsStatus = async () => {
      try {
        const status = await api.getSmsStatus();
        setIsConfigured(status.configured);
        setTwilioNumber(status.twilioNumber);
      } catch (err) {
        console.error('Failed to check SMS status:', err);
      }
    };

    checkSmsStatus();
  }, []);

  const handleToggle = async () => {
    if (!enabled && !phoneNumber.trim()) {
      setSaveStatus({ type: 'error', message: 'Please enter your phone number first' });
      return;
    }

    const newEnabled = !enabled;
    setEnabled(newEnabled);

    await saveSettings(phoneNumber, newEnabled);
  };

  const handlePhoneSave = async () => {
    if (!phoneNumber.trim()) {
      setSaveStatus({ type: 'error', message: 'Please enter a phone number' });
      return;
    }

    await saveSettings(phoneNumber.trim(), enabled);
  };

  const saveSettings = async (phone, isEnabled) => {
    if (!data.userId) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      await api.updateUser(data.userId, {
        phoneNumber: phone,
        smsCheckinEnabled: isEnabled
      });

      updateData({
        phoneNumber: phone,
        smsCheckinEnabled: isEnabled
      });

      setSaveStatus({ type: 'success', message: 'Settings saved' });
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save SMS settings:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save settings' });
      setEnabled(!isEnabled); // Revert toggle on error
    } finally {
      setIsSaving(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          SMS Check-in
        </h3>
        <p className={styles.sectionDescription}>
          SMS check-in is not currently configured on this server.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        SMS Check-in
      </h3>
      <p className={styles.sectionDescription}>
        Check in by texting "OK" to the Still Here number anytime. No need to open the app.
      </p>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          Enable SMS check-in
        </span>
        <button
          className={`${styles.toggle} ${enabled ? styles.toggleActive : ''}`}
          onClick={handleToggle}
          disabled={isSaving}
          aria-pressed={enabled}
          aria-label="Toggle SMS check-in"
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      <div style={{ marginTop: 'var(--spacing-md)' }}>
        <label className={styles.label}>Your phone number</label>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
          <input
            type="tel"
            className={styles.phoneInput}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
          <Button
            variant="secondary"
            onClick={handlePhoneSave}
            loading={isSaving}
          >
            Save
          </Button>
        </div>
      </div>

      {saveStatus && (
        <div className={`${styles.testResult} ${saveStatus.type === 'success' ? styles.success : styles.error}`}>
          {saveStatus.message}
        </div>
      )}

      {enabled && twilioNumber && (
        <div className={styles.proofOfLifeInfo}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div>
            <p style={{ margin: 0 }}>
              Text <strong>OK</strong>, <strong>YES</strong>, or <strong>HERE</strong> to:
            </p>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-base)', color: 'var(--white)' }}>
              {twilioNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsCheckIn;
