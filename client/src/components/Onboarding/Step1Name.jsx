import { useState } from 'react';
import { Button } from '../common/Button';
import styles from './Onboarding.module.css';

export const Step1Name = ({ data, onNext, onUpdate }) => {
  const [name, setName] = useState(data.name || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    onUpdate({ name: trimmedName });
    onNext();
  };

  return (
    <div className={`${styles.step} animate-fadeIn`}>
      <div className={styles.stepContent}>
        <h1 className={styles.title}>Welcome to Still Here</h1>
        <p className={styles.subtitle}>
          A simple daily check-in for peace of mind
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              What's your name?
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              autoFocus
              autoComplete="name"
              className={error ? styles.inputError : ''}
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>

          <Button type="submit" fullWidth size="large">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};
