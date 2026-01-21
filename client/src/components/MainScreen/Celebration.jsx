import { useEffect } from 'react';
import Lottie from 'lottie-react';
import celebrationAnimation from '../../assets/animations/celebration.json';
import styles from './Celebration.module.css';

// Milestone configurations
const MILESTONES = {
  7: {
    label: 'Week One',
    title: 'First Week!',
    message: "You've checked in for a whole week. You're building a healthy habit!",
    tier: 'week'
  },
  14: {
    label: 'Two Weeks',
    title: 'Two Weeks Strong!',
    message: "Two weeks of consistency. You're really committed to this!",
    tier: 'twoweeks'
  },
  30: {
    label: 'One Month',
    title: 'One Month!',
    message: "A whole month! You've proven this habit is here to stay.",
    tier: 'month'
  },
  60: {
    label: 'Two Months',
    title: 'Two Months!',
    message: "60 days of showing up. You're an inspiration!",
    tier: 'twomonths'
  },
  100: {
    label: 'Century',
    title: 'Century Club!',
    message: "100 days! You've joined an elite group of dedicated people.",
    tier: 'century'
  },
  365: {
    label: 'One Year',
    title: 'One Full Year!',
    message: "365 days of checking in. This is truly remarkable!",
    tier: 'year'
  }
};

export const Celebration = ({ streak, onDismiss, soundEnabled = false }) => {
  const milestone = MILESTONES[streak];

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Play sound if enabled
  useEffect(() => {
    if (soundEnabled) {
      const audio = new Audio('/sounds/milestone.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore audio play errors (e.g., if file doesn't exist)
      });
    }
  }, [soundEnabled]);

  if (!milestone) return null;

  return (
    <div
      className={styles.celebrationOverlay}
      onClick={onDismiss}
      role="dialog"
      aria-label={`Milestone celebration: ${milestone.title}`}
    >
      <div
        className={`${styles.celebrationContent} ${styles[`tier-${milestone.tier}`]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.lottieCelebration}>
          <Lottie
            animationData={celebrationAnimation}
            loop={true}
            autoplay={true}
            style={{ width: 200, height: 200 }}
          />
        </div>
        <p className={styles.milestoneLabel}>{milestone.label}</p>
        <h2 className={styles.milestoneTitle}>{milestone.title}</h2>
        <p className={styles.milestoneStreak}>{streak} Day Streak</p>

        <p className={styles.celebrationMessage}>{milestone.message}</p>

        <button
          className={styles.dismissButton}
          onClick={onDismiss}
        >
          Keep Going!
        </button>
      </div>
    </div>
  );
};
