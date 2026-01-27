import { useState } from 'react';
import { Button } from '../common/Button';
import styles from './Onboarding.module.css';

export const Step2Contact = ({ data, onNext, onBack, onUpdate }) => {
  const [contactName, setContactName] = useState(data.contactName || '');
  const [contactEmail, setContactEmail] = useState(data.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(data.contactPhone || '');
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedName = contactName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      newErrors.contactName = 'Please enter a contact name';
    }

    if (!trimmedEmail) {
      newErrors.contactEmail = 'Please enter an email address';
    } else if (!validateEmail(trimmedEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onUpdate({
      contactName: trimmedName,
      contactEmail: trimmedEmail,
      contactPhone: trimmedPhone || null
    });
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

        <h1 className={styles.title}>Emergency Contact</h1>
        <p className={styles.subtitle}>
          Who should we notify if you miss your check-in?
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="contactName" className={styles.label}>
              Contact name
            </label>
            <input
              type="text"
              id="contactName"
              value={contactName}
              onChange={(e) => {
                setContactName(e.target.value);
                setErrors(prev => ({ ...prev, contactName: '' }));
              }}
              placeholder="Mom, Partner, Friend..."
              autoFocus
              className={errors.contactName ? styles.inputError : ''}
            />
            {errors.contactName && (
              <span className={styles.error}>{errors.contactName}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactEmail" className={styles.label}>
              Their email address
            </label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value);
                setErrors(prev => ({ ...prev, contactEmail: '' }));
              }}
              placeholder="email@example.com"
              autoComplete="email"
              className={errors.contactEmail ? styles.inputError : ''}
            />
            {errors.contactEmail && (
              <span className={styles.error}>{errors.contactEmail}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="contactPhone" className={styles.label}>
              Their phone number <span className={styles.optional}>(optional)</span>
            </label>
            <input
              type="tel"
              id="contactPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              autoComplete="tel"
            />
            <span className={styles.hint}>
              For SMS alerts (can be added later in settings)
            </span>
          </div>

          <Button type="submit" fullWidth size="large">
            Continue
          </Button>
          
          <button
            type="button"
            className={styles.skipLink}
            onClick={() => {
              onUpdate({
                contactName: '',
                contactEmail: '',
                contactPhone: null
              });
              onNext();
            }}
          >
            I'll add this later in settings
          </button>
        </form>
      </div>
    </div>
  );
};
