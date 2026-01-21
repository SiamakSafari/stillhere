import { useState } from 'react';
import { api } from '../../utils/api';
import styles from './Settings.module.css';

export const ProofOfLife = ({ data, updateData }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    const newValue = !data.proofOfLifeEnabled;
    setIsSaving(true);

    updateData({ proofOfLifeEnabled: newValue });

    // Sync to server
    if (data.userId && navigator.onLine) {
      try {
        await api.updateUser(data.userId, { proofOfLifeEnabled: newValue });
      } catch (error) {
        console.error('Failed to sync proof of life setting:', error);
      }
    }

    setIsSaving(false);
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22,4 12,14.01 9,11.01" />
        </svg>
        Proof of Life
      </h3>
      <p className={styles.sectionDescription}>
        Send {data.contactName || 'your contact'} a daily notification when you check in.
        No more "just checking if you're okay" texts.
      </p>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Send daily check-in confirmation
        </span>
        <button
          className={`${styles.toggle} ${data.proofOfLifeEnabled ? styles.toggleActive : ''}`}
          onClick={handleToggle}
          disabled={isSaving}
          aria-pressed={data.proofOfLifeEnabled}
          aria-label="Toggle proof of life notifications"
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      {data.proofOfLifeEnabled && (
        <div className={styles.proofOfLifeInfo}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            {data.contactName || 'Your contact'} will receive a brief email each day you check in.
          </span>
        </div>
      )}
    </div>
  );
};
