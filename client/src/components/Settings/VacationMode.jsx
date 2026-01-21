import { useState } from 'react';
import { Button } from '../common/Button';
import { isOnVacation, formatDate } from '../../utils/time';
import { api } from '../../utils/api';
import { trackVacationEnabled, trackVacationDisabled } from '../../utils/analytics';
import styles from './VacationMode.module.css';

const QUICK_DURATIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
];

export const VacationMode = ({ data, updateData }) => {
  const [isSettingVacation, setIsSettingVacation] = useState(false);
  const [returnDate, setReturnDate] = useState('');
  const [notifyContact, setNotifyContact] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const onVacation = isOnVacation(data.vacationUntil);

  const handleQuickVacation = async (days) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    await handleEnableVacation(endDate.toISOString());
  };

  const handleEnableVacation = async (vacationUntilDate) => {
    if (!vacationUntilDate && !returnDate) return;

    setIsSaving(true);
    const vacationUntil = vacationUntilDate || new Date(returnDate).toISOString();

    updateData({ vacationUntil });

    // Track analytics
    const daysUntil = Math.ceil((new Date(vacationUntil) - new Date()) / (1000 * 60 * 60 * 24));
    trackVacationEnabled(daysUntil);

    if (data.userId && navigator.onLine) {
      try {
        await api.setVacation(data.userId, vacationUntil, notifyContact);
      } catch (error) {
        console.error('Failed to sync vacation mode:', error);
      }
    }

    setIsSaving(false);
    setIsSettingVacation(false);
    setReturnDate('');
  };

  const handleDisableVacation = async () => {
    setIsSaving(true);

    updateData({ vacationUntil: null });

    // Track analytics
    trackVacationDisabled();

    if (data.userId && navigator.onLine) {
      try {
        await api.setVacation(data.userId, null);
      } catch (error) {
        console.error('Failed to sync vacation mode:', error);
      }
    }

    setIsSaving(false);
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!data.vacationUntil) return 0;
    const end = new Date(data.vacationUntil);
    const now = new Date();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  if (onVacation) {
    const daysRemaining = getDaysRemaining();

    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.5 2.5l-1.086 4.344L12 4l4.414 2.828L15.328 11l2.172-3.828L22 7.172l-4.5-4.672zM3 5v16h16v-2H5V7h14V5H3zm7 8h2v2h-2v-2z" />
          </svg>
          Vacation Mode
        </h3>
        <div className={styles.vacationActive}>
          <div className={styles.vacationBadge}>
            <span className={styles.vacationEmoji}>✈️</span>
            <div className={styles.vacationDetails}>
              <span className={styles.vacationStatus}>Vacation Mode Active</span>
              <span className={styles.vacationDays}>
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
              <span className={styles.vacationReturn}>
                Returns: {formatDate(data.vacationUntil)}
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleDisableVacation}
            loading={isSaving}
            fullWidth
          >
            End Vacation Early
          </Button>
        </div>
      </div>
    );
  }

  if (isSettingVacation) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.5 2.5l-1.086 4.344L12 4l4.414 2.828L15.328 11l2.172-3.828L22 7.172l-4.5-4.672zM3 5v16h16v-2H5V7h14V5H3zm7 8h2v2h-2v-2z" />
          </svg>
          Set Vacation
        </h3>

        {/* Quick duration buttons */}
        <div className={styles.quickButtons}>
          {QUICK_DURATIONS.map(({ days, label }) => (
            <button
              key={days}
              className={styles.quickButton}
              onClick={() => handleQuickVacation(days)}
              disabled={isSaving}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.divider}>
          <span>or choose a date</span>
        </div>

        <div className={styles.vacationForm}>
          <label className={styles.label}>Return date</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={minDate}
            className={styles.dateInput}
          />

          {/* Notify contact toggle */}
          <div className={styles.notifyToggle}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={notifyContact}
                onChange={(e) => setNotifyContact(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Notify {data.contactName || 'my contact'} that I'm on vacation
              </span>
            </label>
          </div>

          <div className={styles.buttonRow}>
            <Button
              variant="ghost"
              onClick={() => {
                setIsSettingVacation(false);
                setReturnDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleEnableVacation()}
              disabled={!returnDate}
              loading={isSaving}
            >
              Enable
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.5 2.5l-1.086 4.344L12 4l4.414 2.828L15.328 11l2.172-3.828L22 7.172l-4.5-4.672zM3 5v16h16v-2H5V7h14V5H3zm7 8h2v2h-2v-2z" />
        </svg>
        Vacation Mode
      </h3>
      <p className={styles.sectionDescription}>
        Going away? Pause check-in reminders while you're on vacation.
      </p>
      <Button
        variant="secondary"
        onClick={() => setIsSettingVacation(true)}
        fullWidth
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        I'm Traveling
      </Button>
    </div>
  );
};
