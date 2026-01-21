import styles from './ThemeToggle.module.css';

// Clean, modern light bulb SVG icons
const LightBulbAuto = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 21h6M12 3a6 6 0 0 0-4 10.5V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.5A6 6 0 0 0 12 3z" />
    <path d="M12 8v2M10 12h4" strokeLinecap="round" />
  </svg>
);

const LightBulbOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
    <path d="M9 21h6M12 3a6 6 0 0 0-4 10.5V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.5A6 6 0 0 0 12 3z" />
  </svg>
);

const LightBulbOn = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 21h6" fill="none" />
    <path d="M12 3a6 6 0 0 0-4 10.5V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3.5A6 6 0 0 0 12 3z" fillOpacity="0.3" />
    <circle cx="12" cy="9" r="2" fill="currentColor" fillOpacity="0.8" stroke="none" />
  </svg>
);

const themes = [
  { value: 'system', label: 'Auto', Icon: LightBulbAuto },
  { value: 'dark', label: 'Dark', Icon: LightBulbOff },
  { value: 'light', label: 'Light', Icon: LightBulbOn }
];

export const ThemeToggle = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      {themes.map((theme) => (
        <button
          key={theme.value}
          className={`${styles.option} ${value === theme.value ? styles.active : ''}`}
          onClick={() => onChange(theme.value)}
          aria-label={`${theme.label} theme`}
        >
          <span className={styles.icon}><theme.Icon /></span>
          <span className={styles.label}>{theme.label}</span>
        </button>
      ))}
    </div>
  );
};
