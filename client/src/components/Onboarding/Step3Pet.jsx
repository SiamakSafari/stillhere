import { useState } from 'react';
import { Button } from '../common/Button';
import styles from './Onboarding.module.css';

export const Step3Pet = ({ data, onComplete, onBack, onUpdate }) => {
  const [petName, setPetName] = useState(data.petName || '');
  const [petNotes, setPetNotes] = useState(data.petNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    onUpdate({
      petName: petName.trim(),
      petNotes: petNotes.trim()
    });

    await onComplete();
    setIsSubmitting(false);
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    onUpdate({
      petName: '',
      petNotes: ''
    });
    await onComplete();
    setIsSubmitting(false);
  };

  return (
    <div className={`${styles.step} animate-fadeIn`}>
      <div className={styles.stepContent}>
        <button onClick={onBack} className={styles.backButton} disabled={isSubmitting}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className={styles.title}>Got a Pet?</h1>
        <p className={styles.subtitle}>
          Optional: Include pet care info in alerts
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="petName" className={styles.label}>
              Pet's name
            </label>
            <input
              type="text"
              id="petName"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Fluffy, Max, Buddy..."
              autoFocus
            />
          </div>

          {petName && (
            <div className={styles.inputGroup}>
              <label htmlFor="petNotes" className={styles.label}>
                Care notes (optional)
              </label>
              <textarea
                id="petNotes"
                value={petNotes}
                onChange={(e) => setPetNotes(e.target.value)}
                placeholder="Feeding schedule, medications, vet info..."
                rows={3}
                className={styles.textarea}
              />
            </div>
          )}

          <div className={styles.buttonGroup}>
            <Button
              type="submit"
              fullWidth
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {petName ? 'Complete Setup' : 'Skip & Complete'}
            </Button>

            {petName && (
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip this step
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
