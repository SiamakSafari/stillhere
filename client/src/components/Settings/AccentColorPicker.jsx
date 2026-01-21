import { useRef } from 'react';
import styles from './Settings.module.css';

const ACCENT_COLORS = [
  { id: 'green', label: 'Green', color: '#4ade80' },
  { id: 'blue', label: 'Blue', color: '#60a5fa' },
  { id: 'purple', label: 'Purple', color: '#a78bfa' },
  { id: 'orange', label: 'Orange', color: '#fb923c' },
  { id: 'pink', label: 'Pink', color: '#f472b6' }
];

export const AccentColorPicker = ({ value, onChange, customColor, onCustomColorChange }) => {
  const colorInputRef = useRef(null);

  const handleCustomClick = () => {
    colorInputRef.current?.click();
  };

  const handleColorInputChange = (e) => {
    const color = e.target.value;
    onCustomColorChange(color);
    onChange('custom');
  };

  const isCustomSelected = value === 'custom';
  const displayCustomColor = customColor || '#888888';

  return (
    <div className={styles.colorPicker}>
      {ACCENT_COLORS.map((accent) => (
        <button
          key={accent.id}
          className={`${styles.colorOption} ${value === accent.id ? styles.colorOptionSelected : ''}`}
          onClick={() => onChange(accent.id)}
          aria-label={`Select ${accent.label} accent color`}
          aria-pressed={value === accent.id}
          style={{ '--color-option': accent.color }}
        >
          <span
            className={styles.colorSwatch}
            style={{ backgroundColor: accent.color }}
          />
          <span className={styles.colorLabel}>{accent.label}</span>
        </button>
      ))}
      <button
        className={`${styles.colorOption} ${isCustomSelected ? styles.colorOptionSelected : ''}`}
        onClick={handleCustomClick}
        aria-label="Select custom accent color"
        aria-pressed={isCustomSelected}
        style={{ '--color-option': displayCustomColor }}
      >
        <span
          className={styles.colorSwatch}
          style={{ backgroundColor: displayCustomColor }}
        >
          {!isCustomSelected && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.customIcon}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20" />
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
          )}
        </span>
        <span className={styles.colorLabel}>Custom</span>
      </button>
      <input
        ref={colorInputRef}
        type="color"
        value={displayCustomColor}
        onChange={handleColorInputChange}
        className={styles.hiddenColorInput}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};
