import { useState, useEffect } from 'react';
import { Calendar, Settings, Palmtree } from 'lucide-react';
import { Greeting } from './Greeting';
import { CheckInButton } from './CheckInButton';
import { Stats } from './Stats';
import { ContactInfo } from './ContactInfo';
import { Confetti } from './Confetti';
import { HistoryCalendar } from './HistoryCalendar';
import { CheckInFlow } from './CheckInFlow';
import { ParticleBackground } from './ParticleBackground';
import { Avatar } from './Avatar';
import { DailyQuote } from './DailyQuote';
import { Celebration } from './Celebration';
import { SnoozeButton } from './SnoozeButton';
import { ActivityMode } from '../ActivityMode';
import { SettingsModal } from '../Settings/SettingsModal';
import { useCheckIn } from '../../hooks/useCheckIn';
import { useToast } from '../../context/ToastContext';
import { isOnVacation, formatDate, getDaysUntil, isMilestone } from '../../utils/time';
import { sounds } from '../../utils/sounds';
import styles from './MainScreen.module.css';

export const MainScreen = ({ data, updateData, onReset }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStreak, setCelebrationStreak] = useState(0);
  const toast = useToast();
  const {
    initiateCheckIn,
    completeCheckIn,
    cancelCheckInFlow,
    isChecking,
    hasCheckedInToday,
    showConfetti,
    setShowConfetti,
    showCheckInFlow
  } = useCheckIn(data, updateData);

  // Initialize sounds on mount
  useEffect(() => {
    sounds.init().catch(err => console.warn('Sound init failed:', err));
  }, []);

  const onVacation = isOnVacation(data.vacationUntil);
  const daysUntilReturn = getDaysUntil(data.vacationUntil);

  const handleSnoozeChange = (action, value) => {
    if (action === 'snoozed') {
      toast.info(`Alerts snoozed for ${value} hour${value > 1 ? 's' : ''}`);
    } else if (action === 'cancelled') {
      toast.info('Snooze cancelled');
    } else if (action === 'error') {
      toast.error(value || 'Failed to update snooze');
    }
  };

  const handleCheckIn = () => {
    initiateCheckIn();
  };

  const handleCheckInComplete = async ({ mood, note }) => {
    const result = await completeCheckIn({ mood, note });

    // Play check-in sound
    if (result?.success && data.soundEnabled) {
      if (result.isMilestone) {
        sounds.playMilestone(true);
      } else {
        sounds.playCheckIn(true);
      }
    }

    // Show celebration for milestones
    if (result?.success && result.isMilestone) {
      setCelebrationStreak(result.streak);
      setShowCelebration(true);
    }
  };

  return (
    <div className={styles.container}>
      <ParticleBackground />
      <header className={styles.header}>
        <Avatar
          name={data.name}
          onClick={() => setShowSettings(true)}
        />
        <div className={styles.headerActions}>
          <button
            className={styles.calendarButton}
            onClick={() => setShowCalendar(true)}
            aria-label="View history"
          >
            <Calendar size={24} strokeWidth={2} />
          </button>
          <button
            className={styles.settingsButton}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <Settings size={24} strokeWidth={2} />
          </button>
        </div>
      </header>

      <Greeting name={data.name} />

      {onVacation && (
        <div className={styles.vacationBadge}>
          <Palmtree size={16} />
          On vacation until {formatDate(data.vacationUntil)} ({daysUntilReturn} days)
        </div>
      )}

      <div className={styles.checkInWrapper}>
        <CheckInButton
          hasCheckedIn={hasCheckedInToday}
          isChecking={isChecking}
          onCheckIn={handleCheckIn}
          disabled={onVacation}
          streak={data.streak}
        />
      </div>

      <div className={styles.contentWrapper}>
        <Stats streak={data.streak} hasCheckedIn={hasCheckedInToday} lastCheckIn={data.lastCheckIn} checkInHistory={data.checkInHistory} />

        {/* Activity Mode - timed check-ins for specific activities */}
        {!onVacation && (
          <div className={styles.activitySection}>
            <ActivityMode data={data} />
          </div>
        )}

        {/* Snooze alerts */}
        {!onVacation && (
          <div className={styles.snoozeSection}>
            <SnoozeButton
              data={data}
              updateData={updateData}
              onSnoozeChange={handleSnoozeChange}
            />
          </div>
        )}

        <DailyQuote />

        <ContactInfo
          contactName={data.contactName}
          contactEmail={data.contactEmail}
          petName={data.petName}
          userId={data.userId}
        />
      </div>

      <Confetti trigger={showConfetti} streak={data.streak} />

      {showSettings && (
        <SettingsModal
          data={data}
          updateData={updateData}
          onClose={() => setShowSettings(false)}
          onReset={onReset}
        />
      )}

      {showCalendar && (
        <HistoryCalendar
          checkInHistory={data.checkInHistory}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {showCheckInFlow && (
        <CheckInFlow
          onComplete={handleCheckInComplete}
          onCancel={cancelCheckInFlow}
          isSubmitting={isChecking}
        />
      )}

      {showCelebration && (
        <Celebration
          streak={celebrationStreak}
          onDismiss={() => setShowCelebration(false)}
          soundEnabled={data.soundEnabled}
        />
      )}
    </div>
  );
};
