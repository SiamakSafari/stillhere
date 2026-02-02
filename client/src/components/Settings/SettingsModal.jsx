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
import { ShareLinkManager } from './ShareLinkManager';
import { MemberBadge } from './MemberBadge';
import { EmergencyContacts } from './EmergencyContacts';
import { SmsCheckIn } from './SmsCheckIn';
import { SmartHomeIntegration } from './SmartHomeIntegration';
import { ExportData } from './ExportData';
import { AccordionSection } from './AccordionSection';
import { exportData, importData } from '../../utils/storage';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

/* Inline SVG icons for each accordion section */
const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

const icons = {
  account: (
    <svg {...iconProps}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  appearance: (
    <svg {...iconProps}>
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="19" cy="13" r="2.5" />
      <circle cx="16" cy="20" r="2.5" />
      <circle cx="7" cy="20" r="2.5" />
      <circle cx="5" cy="13" r="2.5" />
      <path d="M12 2a10 10 0 0 0 0 20 4 4 0 0 0 4-4v-.5a2 2 0 0 1 2-2h.5A4 4 0 0 0 22 12 10 10 0 0 0 12 2z" />
    </svg>
  ),
  notifications: (
    <svg {...iconProps}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  safety: (
    <svg {...iconProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  subscription: (
    <svg {...iconProps}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  about: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export const SettingsModal = ({ data, updateData, onClose, onReset }) => {
  const [openSection, setOpenSection] = useState(null);
  const [isTestingAlert, setIsTestingAlert] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const toggle = (key) => setOpenSection((prev) => (prev === key ? null : key));

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

  /* Dynamic subtitles */
  const accountSub = [data.name, data.email].filter(Boolean).join(' · ') || 'Not configured';
  const themeName = (data.theme || 'system').charAt(0).toUpperCase() + (data.theme || 'system').slice(1);
  const accentName = (data.accentColor || 'green').charAt(0).toUpperCase() + (data.accentColor || 'green').slice(1);
  const appearanceSub = `${themeName} · ${accentName} accent`;
  const windowStart = data.checkInWindowStart || '8:00 AM';
  const windowEnd = data.checkInWindowEnd || '10:00 PM';
  const notifSub = `Check-in ${windowStart} – ${windowEnd}`;
  const vacOn = data.vacationMode ? 'On' : 'Off';
  const locOn = data.locationEnabled ? 'On' : 'Off';
  const safetySub = `Vacation ${vacOn} · Location ${locOn}`;
  const subSub = data.plan || 'Free plan';
  const aboutSub = 'v1.0.0';

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
          {/* ── Account ── */}
          <AccordionSection
            title="Account"
            subtitle={accountSub}
            icon={icons.account}
            iconBg="rgba(96, 165, 250, 0.2)"
            isOpen={openSection === 'account'}
            onToggle={() => toggle('account')}
          >
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Your Info</h3>
              <p className={styles.sectionDescription}>
                {data.name || 'Name not set'} · {data.email || 'Email not set'}
              </p>
            </div>
            <EmergencyContacts data={data} />
          </AccordionSection>

          {/* ── Appearance ── */}
          <AccordionSection
            title="Appearance"
            subtitle={appearanceSub}
            icon={icons.appearance}
            iconBg="rgba(168, 85, 247, 0.2)"
            isOpen={openSection === 'appearance'}
            onToggle={() => toggle('appearance')}
          >
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Theme</h3>
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
          </AccordionSection>

          {/* ── Notifications ── */}
          <AccordionSection
            title="Notifications"
            subtitle={notifSub}
            icon={icons.notifications}
            iconBg="rgba(251, 191, 36, 0.2)"
            isOpen={openSection === 'notifications'}
            onToggle={() => toggle('notifications')}
          >
            <CheckInWindow data={data} updateData={updateData} />
            <NotificationSettings data={data} updateData={updateData} />
            <AlertPreferences data={data} updateData={updateData} />
            <SmsCheckIn data={data} updateData={updateData} />
          </AccordionSection>

          {/* ── Safety & Privacy ── */}
          <AccordionSection
            title="Safety & Privacy"
            subtitle={safetySub}
            icon={icons.safety}
            iconBg="rgba(74, 222, 128, 0.2)"
            isOpen={openSection === 'safety'}
            onToggle={() => toggle('safety')}
          >
            <VacationMode data={data} updateData={updateData} />
            <LocationSettings data={data} updateData={updateData} />
            <ProofOfLife data={data} updateData={updateData} />
            <ShareLinkManager data={data} />
            <SmartHomeIntegration data={data} />
            <ConfirmationStatus data={data} />
          </AccordionSection>

          {/* ── Subscription ── */}
          <AccordionSection
            title="Subscription"
            subtitle={subSub}
            icon={icons.subscription}
            iconBg="rgba(244, 114, 182, 0.2)"
            isOpen={openSection === 'subscription'}
            onToggle={() => toggle('subscription')}
          >
            <MemberBadge data={data} />
            <PetCard data={data} updateData={updateData} />
          </AccordionSection>

          {/* ── About ── */}
          <AccordionSection
            title="About"
            subtitle={aboutSub}
            icon={icons.about}
            iconBg="rgba(148, 163, 184, 0.2)"
            isOpen={openSection === 'about'}
            onToggle={() => toggle('about')}
          >
            <ExportData data={data} />

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

            <p className={styles.versionInfo}>
              Still Here v1.0.0
            </p>
          </AccordionSection>
        </div>
      </div>
    </div>
  );
};
