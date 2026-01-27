import { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import styles from './Onboarding.module.css';

// Generate time options (every 30 minutes)
const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      const value = `${hour}:${minute}`;
      const label = new Date(`2000-01-01T${value}`).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
      });
      options.push({ value, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

export const Step3Window = ({ data, onNext, onBack, onUpdate }) => {
  const [startTime, setStartTime] = useState(data.checkInWindowStart || '08:00');
  const [endTime, setEndTime] = useState(data.checkInWindowEnd || '22:00');
  const [isEnabled, setIsEnabled] = useState(!!data.checkInWindowStart);

  // Detect user's timezone
  useEffect(() => {
    if (!data.timezone) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      onUpdate({ timezone });
    }
  }, []);

  const handleContinue = () => {
    if (isEnabled) {
      onUpdate({
        checkInWindowStart: startTime,
        checkInWindowEnd: endTime
      });
    } else {
      onUpdate({
        checkInWindowStart: null,
        checkInWindowEnd: null
      });
    }
    onNext();
  };

  return (
    <div className={`${styles.step} animate-fadeIn`}>
      <div className={styles.stepContent}>
        <button onClick={onBack} className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className={styles.title}>Check-in Window</h1>
        <p className={styles.subtitle}>
          When do you want to be reminded to check in?
        </p>

        <div className={styles.form}>
          <div className={styles.explainerBox}>
            <div className={styles.explainerIcon}>⏰</div>
            <div className={styles.explainerText}>
              <strong>How it works:</strong> If you don't check in within your window, 
              you'll get a reminder. If you still don't respond after 48 hours, 
              your emergency contact will be notified.
            </div>
          </div>

          <div className={styles.toggleSection}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Set a check-in window</span>
                <span className={styles.toggleHint}>
                  {isEnabled ? 'Custom schedule' : 'Using default (24hr window)'}
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${isEnabled ? styles.toggleActive : ''}`}
                onClick={() => setIsEnabled(!isEnabled)}
                aria-label={isEnabled ? 'Disable check-in window' : 'Enable check-in window'}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          {isEnabled && (
            <div className={styles.timeInputs}>
              <div className={styles.timeField}>
                <label className={styles.label}>Check in after</label>
                <select
                  className={styles.select}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  {timeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.timeField}>
                <label className={styles.label}>Check in before</label>
                <select
                  className={styles.select}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeOptions.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!isEnabled && (
            <div className={styles.defaultInfo}>
              <p>With the default setting, you just need to check in once every 24 hours, 
              any time that works for you.</p>
            </div>
          )}

          <Button 
            type="button" 
            fullWidth 
            size="large"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
