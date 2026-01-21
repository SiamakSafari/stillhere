import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { OnboardingProgress } from './OnboardingProgress';
import { Step1Name } from './Step1Name';
import { Step2Contact } from './Step2Contact';
import { Step3Pet } from './Step3Pet';
import { api } from '../../utils/api';
import { trackOnboardingCompleted, setUserContext } from '../../utils/analytics';
import styles from './Onboarding.module.css';

export const Onboarding = ({ data, updateData, onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    const userId = data.userId || uuidv4();
    const now = new Date().toISOString();

    const completeData = {
      ...data,
      userId,
      onboardingComplete: true,
      createdAt: data.createdAt || now
    };

    updateData(completeData);

    // Try to register with the server
    if (navigator.onLine) {
      try {
        await api.createUser({
          id: userId,
          name: data.name,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          petName: data.petName,
          petNotes: data.petNotes
        });
      } catch (error) {
        console.error('Failed to register with server:', error);
        // Continue anyway - local storage will work offline
      }
    }

    // Track onboarding completion and set user context for Sentry
    trackOnboardingCompleted(userId);
    setUserContext(userId, data.name);

    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Step1Name
            data={data}
            onNext={handleNext}
            onUpdate={updateData}
          />
        );
      case 1:
        return (
          <Step2Contact
            data={data}
            onNext={handleNext}
            onBack={handleBack}
            onUpdate={updateData}
          />
        );
      case 2:
        return (
          <Step3Pet
            data={data}
            onComplete={handleComplete}
            onBack={handleBack}
            onUpdate={updateData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <OnboardingProgress currentStep={step} totalSteps={3} />
      {renderStep()}
    </div>
  );
};
