import { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { VacationMode } from './VacationMode';
import { ThemeToggle } from './ThemeToggle';
import { AccentColorPicker } from './AccentColorPicker';
import { CheckInWindow } from './CheckInWindow';
import { NotificationSettings } from './NotificationSettings';
import { AlertPreferences } from './AlertPreferences';
import { LocationSettings } from './LocationSettings';
import { ConfirmationStatus } from './ConfirmationStatus';
import { PetCard } from './PetCard';
import { ProofOfLife } from './ProofOfLife';
import { MemberBadge } from './MemberBadge';
import { exportData, importData } from '../../utils/storage';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const SettingsModal = ({ data, updateData, onClose, onReset }) => {
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleTestAlert = async () => {
    if (!data.userId) {
      setTestResult({ success: false, message: 'Please complete setup first' });
      return;
    }

    setIsTestingAlert(true);
    setTestResult(null);

    try {
      await api.testAlert(data.userId);
      setTestResult({
        success: true,
        message: `Test email sent to ${data.contactEmail}`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to send test email'
      });
    } finally {
      setIsTestingAlert(false);
    }
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const importedData = await importData(file);
      updateData(importedData);
      onClose();
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Appearance</h3>
            <p className={styles.sectionDescription}>
              Choose your preferred theme.
            </p>
            <ThemeToggle
              value={data.theme || 'system'}
              onChange={(theme) => updateData({ theme })}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Accent Color</h3>
            <p className={styles.sectionDescription}>
              Personalize your app with a custom accent color.
            </p>
            <AccentColorPicker
              value={data.accentColor || 'green'}
              onChange={(accentColor) => updateData({ accentColor })}
              customColor={data.customAccentColor}
              onCustomColorChange={(customAccentColor) => updateData({ customAccentColor })}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Sound Effects</h3>
            <p className={styles.sectionDescription}>
              Play sounds on check-in and milestones.
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
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                Enable sounds
              </span>
              <button
                className={`${styles.toggle} ${data.soundEnabled ? styles.toggleActive : ''}`}
                onClick={() => updateData({ soundEnabled: !data.soundEnabled })}
                aria-pressed={data.soundEnabled}
                aria-label="Toggle sound effects"
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          <VacationMode data={data} updateData={updateData} />

          <CheckInWindow data={data} updateData={updateData} />

          <NotificationSettings data={data} updateData={updateData} />

          <AlertPreferences data={data} updateData={updateData} />

          <LocationSettings data={data} updateData={updateData} />

          <ConfirmationStatus data={data} />

          <ProofOfLife data={data} updateData={updateData} />

          <PetCard data={data} updateData={updateData} />

          <MemberBadge data={data} />

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Test Alert</h3>
            <p className={styles.sectionDescription}>
              Send a test email to your emergency contact.
            </p>
            <Button
              variant="secondary"
              onClick={handleTestAlert}
              loading={isTestingAlert}
            >
              Send Test Email
            </Button>
            {testResult && (
              <div
                className={`${styles.testResult} ${
                  testResult.success ? styles.success : styles.error
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Backup & Restore</h3>
            <p className={styles.sectionDescription}>
              Export your data or restore from a backup file.
            </p>
            <div className={styles.buttonRow}>
              <Button variant="secondary" onClick={handleExport}>
                Export Data
              </Button>
              <Button
                variant="secondary"
                onClick={handleImportClick}
                loading={isImporting}
              >
                Import Data
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
            {importError && (
              <div className={`${styles.testResult} ${styles.error}`}>
                {importError}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Reset App</h3>
            <p className={styles.sectionDescription}>
              Clear all data and start over. This cannot be undone.
            </p>
            {showResetConfirm ? (
              <div className={styles.resetConfirm}>
                <p className={styles.resetWarning}>
                  Are you sure? All your data will be deleted.
                </p>
                <div className={styles.buttonRow}>
                  <Button
                    variant="ghost"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleReset}>
                    Yes, Reset
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="danger"
                onClick={() => setShowResetConfirm(true)}
              >
                Reset App
              </Button>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Legal</h3>
            <div className={styles.legalLinks}>
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.legalLink}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Privacy Policy
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={styles.externalIcon}
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
            <p className={styles.versionInfo}>
              Still Here v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
