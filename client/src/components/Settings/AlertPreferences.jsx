import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

const ALERT_OPTIONS = [
  {
    value: 'email',
    iconType: 'email',
    title: 'Email only',
    description: 'Alert sent via email'
  },
  {
    value: 'sms',
    iconType: 'sms',
    title: 'SMS only',
    description: 'Alert sent via text message'
  },
  {
    value: 'both',
    iconType: 'both',
    title: 'Email & SMS',
    description: 'Alert sent via both channels'
  }
];

const AlertIcon = ({ type }) => {
  if (type === 'email') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    );
  }
  if (type === 'sms') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
    </svg>
  );
};

export const AlertPreferences = ({ data, updateData }) => {
  const [preference, setPreference] = useState(data.alertPreference || 'email');
  const [phone, setPhone] = useState(data.contactPhone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showPhoneInput, setShowPhoneInput] = useState(
    data.alertPreference === 'sms' || data.alertPreference === 'both'
  );

  const handlePreferenceChange = async (value) => {
    setPreference(value);
    const needsPhone = value === 'sms' || value === 'both';
    setShowPhoneInput(needsPhone);

    // If doesn't need phone or already has phone, save immediately
    if (!needsPhone || data.contactPhone) {
      await saveSettings(value, data.contactPhone);
    }
  };

  const handlePhoneSave = async () => {
    if (!phone.trim()) {
      setSaveStatus({ type: 'error', message: 'Please enter a phone number' });
      return;
    }

    await saveSettings(preference, phone.trim());
  };

  const saveSettings = async (alertPref, contactPhone) => {
    if (!data.userId) return;

    setIsSaving(true);
    setSaveStatus(null);

    try {
      await api.updateUser(data.userId, {
        alertPreference: alertPref,
        contactPhone: contactPhone || null
      });

      updateData({
        alertPreference: alertPref,
        contactPhone: contactPhone || null
      });

      setSaveStatus({ type: 'success', message: 'Settings saved' });
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Failed to save alert preferences:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Alert Preferences</h3>
      <p className={styles.sectionDescription}>
        How should we contact your emergency contact if you miss check-ins?
      </p>

      <div className={styles.alertOptions}>
        {ALERT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`${styles.alertOption} ${preference === option.value ? styles.selected : ''}`}
            onClick={() => handlePreferenceChange(option.value)}
          >
            <span className={styles.alertOptionIcon}><AlertIcon type={option.iconType} /></span>
            <div className={styles.alertOptionContent}>
              <span className={styles.alertOptionTitle}>{option.title}</span>
              <span className={styles.alertOptionDesc}>{option.description}</span>
            </div>
            {preference === option.value && (
              <svg
                className={styles.alertOptionCheck}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {showPhoneInput && (
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <label className={styles.label}>Contact's phone number</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-xs)' }}>
            <input
              type="tel"
              className={styles.phoneInput}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
      )}

      {saveStatus && (
        <div className={`${styles.testResult} ${saveStatus.type === 'success' ? styles.success : styles.error}`}>
          {saveStatus.message}
        </div>
      )}
    </div>
  );
};
