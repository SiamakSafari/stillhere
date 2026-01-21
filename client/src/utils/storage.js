const STORAGE_KEY = 'still-here-data';
const MAX_HISTORY_DAYS = 365; // Keep last 365 days of check-in history

// Prune old check-in history entries to save space
const pruneOldHistory = (history) => {
  if (!Array.isArray(history) || history.length === 0) return history;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
  const cutoffTime = cutoffDate.getTime();

  return history.filter((entry) => {
    const entryDate = entry.date ? new Date(entry.date).getTime() : 0;
    return entryDate >= cutoffTime;
  });
};

// Check if error is a quota exceeded error
const isQuotaExceededError = (error) => {
  return (
    error instanceof DOMException &&
    (error.code === 22 || // Legacy browsers
      error.code === 1014 || // Firefox
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
};

const defaultData = {
  userId: null,
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  petName: '',
  petNotes: '',
  petPhoto: null,
  vetName: '',
  vetPhone: '',
  // Proof of Life - send daily check-in confirmation to contact
  proofOfLifeEnabled: false,
  // Still Here since date (account creation)
  memberSince: null,
  streak: 0,
  lastCheckIn: null,
  vacationUntil: null,
  onboardingComplete: false,
  checkInHistory: [],
  createdAt: null,
  // Theme settings
  theme: 'system',
  // Accent color (green, blue, purple, orange, pink, custom)
  accentColor: 'green',
  // Custom accent color hex value (used when accentColor is 'custom')
  customAccentColor: null,
  // Sound settings
  soundEnabled: false,
  // Check-in window settings
  checkInWindowStart: null,
  checkInWindowEnd: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  // Notification settings
  alertPreference: 'email',
  pushEnabled: false,
  // Location settings
  locationSharingEnabled: false
};

export const getStoredData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...defaultData };
    return { ...defaultData, ...JSON.parse(stored) };
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { ...defaultData };
  }
};

export const setStoredData = (data) => {
  try {
    const current = getStoredData();
    let updated = { ...current, ...data };

    // Try to save
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      // If quota exceeded, try pruning old history
      if (isQuotaExceededError(error)) {
        console.warn('localStorage quota exceeded, pruning old history...');

        // Prune old check-in history
        updated.checkInHistory = pruneOldHistory(updated.checkInHistory);

        // Try again
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        } catch (retryError) {
          // If still failing, try more aggressive pruning (keep last 30 days)
          if (isQuotaExceededError(retryError)) {
            console.warn('Still over quota, aggressive pruning...');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoffTime = thirtyDaysAgo.getTime();

            updated.checkInHistory = (updated.checkInHistory || []).filter((entry) => {
              const entryDate = entry.date ? new Date(entry.date).getTime() : 0;
              return entryDate >= cutoffTime;
            });

            // Remove large optional fields if still over quota
            if (updated.petPhoto && updated.petPhoto.length > 10000) {
              updated.petPhoto = null;
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          }
          throw retryError;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error writing to localStorage:', error);

    // Report to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: { type: 'localStorage_error' },
      });
    }

    return null;
  }
};

export const clearStoredData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

export const exportData = () => {
  const data = getStoredData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `still-here-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Validate required fields
        if (!data.name || !data.contactName || !data.contactEmail) {
          reject(new Error('Invalid backup file: missing required fields'));
          return;
        }
        setStoredData(data);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid backup file: could not parse JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
