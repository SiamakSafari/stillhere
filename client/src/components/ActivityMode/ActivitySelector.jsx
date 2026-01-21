import { useState } from 'react';
import { ActivityIcons } from '../icons/HandDrawnIcons';
import { Button } from '../common/Button';
import styles from './ActivityMode.module.css';

// Warmer, earthier color palette
const ACTIVITY_PRESETS = [
  { id: 'run', label: 'Run', defaultMinutes: 60, color: '#7cb87c' },
  { id: 'date', label: 'Date', defaultMinutes: 120, color: '#e89b9b' },
  { id: 'showing', label: 'Showing', defaultMinutes: 60, color: '#8bb8c4' },
  { id: 'ride', label: 'Ride', defaultMinutes: 30, color: '#e4c36a' },
  { id: 'walking', label: 'Walking', defaultMinutes: 30, color: '#9fcdaa' },
  { id: 'meeting', label: 'Meeting', defaultMinutes: 60, color: '#b8a6d4' },
  { id: 'nightout', label: 'Night Out', defaultMinutes: 180, color: '#d4a574' },
  { id: 'custom', label: 'Custom', defaultMinutes: 60, color: '#a8a8a0' },
];

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
];

export const ActivitySelector = ({ onStartActivity, onCancel, contactName }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [duration, setDuration] = useState(60);
  const [customLabel, setCustomLabel] = useState('');
  const [shareLocation, setShareLocation] = useState(true);
  const [activityDetails, setActivityDetails] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    setDuration(activity.defaultMinutes);
  };

  const handleStart = async () => {
    if (!selectedActivity) return;

    setIsStarting(true);

    const activityData = {
      type: selectedActivity.id,
      label: selectedActivity.id === 'custom' ? customLabel || 'Custom Activity' : selectedActivity.label,
      durationMinutes: duration,
      shareLocation,
      details: activityDetails || null,
      startedAt: new Date().toISOString(),
      expectedEndAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
    };

    // Get location if enabled
    if (shareLocation && navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });
        activityData.latitude = position.coords.latitude;
        activityData.longitude = position.coords.longitude;
      } catch (e) {
        console.log('Could not get location:', e);
      }
    }

    onStartActivity(activityData);
  };

  const getDetailsPlaceholder = () => {
    if (!selectedActivity) return '';
    switch (selectedActivity.id) {
      case 'date': return "Person's name, where meeting...";
      case 'showing': return 'Property address, client name...';
      case 'ride': return 'Driver name, license plate...';
      case 'meeting': return "Person's name, meeting location...";
      default: return 'Any details to include in alert...';
    }
  };

  return (
    <div className={styles.selector}>
      <h2 className={styles.selectorTitle}>What are you doing?</h2>

      {/* Activity grid */}
      <div className={styles.activityGrid}>
        {ACTIVITY_PRESETS.map((activity) => {
          const IconComponent = ActivityIcons[activity.id];
          return (
            <button
              key={activity.id}
              className={`${styles.activityButton} ${selectedActivity?.id === activity.id ? styles.activityButtonSelected : ''}`}
              onClick={() => handleSelectActivity(activity)}
              style={{ '--activity-color': activity.color }}
            >
              <span className={styles.activityIcon}>
                <IconComponent size={28} color={activity.color} />
              </span>
              <span className={styles.activityLabel}>{activity.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom label input */}
      {selectedActivity?.id === 'custom' && (
        <input
          type="text"
          placeholder="What are you doing?"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          className={styles.customInput}
          maxLength={50}
        />
      )}

      {selectedActivity && (
        <>
          {/* Duration selector */}
          <div className={styles.durationSection}>
            <label className={styles.durationLabel}>Check back in:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={styles.durationSelect}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location toggle */}
          <label className={styles.locationToggle}>
            <input
              type="checkbox"
              checked={shareLocation}
              onChange={(e) => setShareLocation(e.target.checked)}
            />
            <span>Share my location</span>
          </label>

          {/* Optional details */}
          <div className={styles.detailsSection}>
            <textarea
              placeholder={getDetailsPlaceholder()}
              value={activityDetails}
              onChange={(e) => setActivityDetails(e.target.value)}
              className={styles.detailsInput}
              rows={2}
              maxLength={500}
            />
            <span className={styles.detailsHint}>
              Only shared if you don't check back in
            </span>
          </div>

          {/* Action buttons */}
          <div className={styles.selectorActions}>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleStart} loading={isStarting}>
              Start Activity
            </Button>
          </div>

          <p className={styles.selectorFooter}>
            If you don't check back in, {contactName || 'your contact'} will be notified
          </p>
        </>
      )}
    </div>
  );
};
