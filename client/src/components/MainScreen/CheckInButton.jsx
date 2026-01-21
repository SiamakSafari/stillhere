import { useState } from 'react';
import { getNextMilestone, MILESTONES } from '../../utils/time';
import styles from './MainScreen.module.css';

export const CheckInButton = ({
  hasCheckedIn,
  isChecking,
  onCheckIn,
  disabled = false,
  streak = 0
}) => {
  // Calculate progress toward next milestone
  const nextMilestone = getNextMilestone(streak);
  const prevMilestone = MILESTONES.filter(m => m <= streak).pop() || 0;
  const progressInSegment = streak - prevMilestone;
  const segmentSize = nextMilestone - prevMilestone;
  const progressPercent = segmentSize > 0 ? (progressInSegment / segmentSize) * 100 : 0;

  // SVG circle properties
  const size = 220;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    if (hasCheckedIn || isChecking || disabled) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onCheckIn();
  };

  const buttonClass = [
    styles.checkInButton,
    hasCheckedIn && styles.checkedIn,
    !hasCheckedIn && !disabled && styles.animate,
    disabled && styles.disabled
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.checkInButtonWrapper}>
      {/* Progress ring showing streak progress toward next milestone */}
      {streak > 0 && (
        <svg
          className={styles.progressRing}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            className={styles.progressRingBg}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            className={styles.progressRingFill}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
      )}
      <button
        className={buttonClass}
        onClick={handleClick}
        disabled={disabled || hasCheckedIn}
        aria-label={hasCheckedIn ? 'Already checked in today' : 'Check in'}
      >
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className={styles.ripple}
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}

      <div className={styles.buttonContent}>
        {isChecking ? (
          <div className={styles.spinner} />
        ) : hasCheckedIn ? (
          <>
            <svg
              className={styles.checkIcon}
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" className="animate-check" />
            </svg>
            <span className={styles.buttonLabel}>Done</span>
          </>
        ) : (
          <>
            <span className={styles.buttonText}>Check In</span>
            <span className={styles.tapHint}>Tap to confirm</span>
          </>
        )}
      </div>
    </button>
    </div>
  );
};
