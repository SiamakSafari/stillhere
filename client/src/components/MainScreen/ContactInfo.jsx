import styles from './MainScreen.module.css';

export const ContactInfo = ({ contactName, contactEmail, petName }) => {
  return (
    <div className={styles.infoContainer}>
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Emergency Contact</span>
        </div>
        <div className={styles.infoContent}>
          <span className={styles.infoName}>{contactName}</span>
          <span className={styles.infoEmail}>{contactEmail}</span>
        </div>
      </div>

      {petName && (
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="3" />
              <circle cx="6" cy="5" r="2" />
              <circle cx="18" cy="5" r="2" />
              <circle cx="7" cy="12" r="2" />
              <circle cx="17" cy="12" r="2" />
            </svg>
            <span>Pet</span>
          </div>
          <div className={styles.infoContent}>
            <span className={styles.infoName}>{petName}</span>
          </div>
        </div>
      )}
    </div>
  );
};
