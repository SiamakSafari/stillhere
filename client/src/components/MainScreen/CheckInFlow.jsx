import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { MoodFaces } from '../icons/HandDrawnIcons';
import { Button } from '../common/Button';
import styles from './CheckInFlow.module.css';

// Moods with warmer colors and face icons
const MOODS = [
  { value: 'great', label: 'Great', color: '#7cb87c' },
  { value: 'good', label: 'Good', color: '#9fcdaa' },
  { value: 'okay', label: 'Okay', color: '#d4c36a' },
  { value: 'low', label: 'Low', color: '#d4a574' },
  { value: 'rough', label: 'Rough', color: '#c98a8a' }
];

// Valid mood values for validation
const VALID_MOOD_VALUES = MOODS.map((m) => m.value);

// Sanitize note input - remove potentially harmful content
const sanitizeNote = (input) => {
  if (!input || typeof input !== 'string') return null;

  return input
    .trim()
    .slice(0, 500) // Enforce max length
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
};

// Validate mood value
const isValidMood = (mood) => {
  return mood === null || VALID_MOOD_VALUES.includes(mood);
};

export const CheckInFlow = ({ onComplete, onCancel, isSubmitting }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState('mood'); // 'mood' or 'note'

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const handleContinue = () => {
    setStep('note');
  };

  const handleSubmit = () => {
    // Validate mood
    const validatedMood = isValidMood(selectedMood) ? selectedMood : null;
    // Sanitize note
    const sanitizedNote = sanitizeNote(note);

    onComplete({
      mood: validatedMood,
      note: sanitizedNote
    });
  };

  const handleSkip = () => {
    onComplete({ mood: null, note: null });
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 'mood' ? (
          <>
            <div className={styles.header}>
              <div className={styles.checkmark}>
                <Check size={32} strokeWidth={3} />
              </div>
              <h2 className={styles.title}>Checked in!</h2>
              <p className={styles.subtitle}>How are you feeling today?</p>
            </div>

            <div className={styles.moodGrid}>
              {MOODS.map((mood) => {
                const FaceIcon = MoodFaces[mood.value];
                return (
                  <button
                    key={mood.value}
                    className={`${styles.moodButton} ${selectedMood === mood.value ? styles.selected : ''}`}
                    onClick={() => handleMoodSelect(mood.value)}
                    aria-label={mood.label}
                    style={{ '--mood-color': mood.color }}
                  >
                    <span className={styles.moodFace}>
                      <FaceIcon size={36} color={mood.color} />
                    </span>
                    <span className={styles.moodLabel}>{mood.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.actions}>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!selectedMood || isSubmitting}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <button className={styles.backButton} onClick={() => setStep('mood')}>
                <ArrowLeft size={20} />
              </button>
              <h2 className={styles.title}>Add a note</h2>
              <p className={styles.subtitle}>Optional: capture any thoughts</p>
            </div>

            <div className={styles.noteContainer}>
              <textarea
                className={styles.noteInput}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's on your mind today?"
                maxLength={500}
                rows={4}
                autoFocus
              />
              <span className={styles.charCount}>{note.length}/500</span>
            </div>

            <div className={styles.actions}>
              <Button
                variant="ghost"
                onClick={() => onComplete({ mood: isValidMood(selectedMood) ? selectedMood : null, note: null })}
                disabled={isSubmitting}
              >
                Skip note
              </Button>
              <Button
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
