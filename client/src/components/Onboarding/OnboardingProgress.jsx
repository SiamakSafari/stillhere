import styles from './Onboarding.module.css';

export const OnboardingProgress = ({ currentStep, totalSteps = 3 }) => {
  return (
    <div className={styles.progressContainer}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <span
          key={i}
          className={`${styles.progressDot} ${i < currentStep ? styles.completed : ''} ${i === currentStep ? styles.active : ''}`}
        />
      ))}
    </div>
  );
};
