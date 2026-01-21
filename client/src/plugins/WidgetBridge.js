import { registerPlugin } from '@capacitor/core';

/**
 * Widget Bridge Plugin
 *
 * This plugin provides a bridge between the React app and native home screen widgets
 * on iOS and Android. It allows the app to update widget data after check-ins and
 * on app launch/resume.
 *
 * Widget Data Structure:
 * - streak: Current check-in streak count
 * - lastCheckIn: ISO timestamp of last check-in (or null)
 * - hasCheckedInToday: Whether user has checked in today
 * - checkInWindowStart: Start time of check-in window (HH:MM format or null)
 * - checkInWindowEnd: End time of check-in window (HH:MM format or null)
 * - isOnVacation: Whether vacation mode is active
 *
 * The native implementations use platform-specific storage:
 * - iOS: App Groups shared UserDefaults
 * - Android: SharedPreferences
 */

const WidgetBridge = registerPlugin('WidgetBridge', {
  web: () => ({
    // Web fallback - no-op since widgets don't exist on web
    updateWidget: async () => {
      console.log('[WidgetBridge] updateWidget called (web no-op)');
      return { success: true };
    },
    getWidgetData: async () => {
      console.log('[WidgetBridge] getWidgetData called (web no-op)');
      return null;
    }
  })
});

/**
 * Updates the home screen widget with the latest check-in data
 *
 * @param {Object} options Widget data to display
 * @param {number} options.streak Current streak count
 * @param {string|null} options.lastCheckIn ISO timestamp of last check-in
 * @param {boolean} options.hasCheckedInToday Whether checked in today
 * @param {string|null} options.checkInWindowStart Check-in window start (HH:MM)
 * @param {string|null} options.checkInWindowEnd Check-in window end (HH:MM)
 * @param {boolean} options.isOnVacation Whether vacation mode is active
 * @returns {Promise<{success: boolean}>}
 */
export const updateWidget = async (options) => {
  try {
    return await WidgetBridge.updateWidget(options);
  } catch (error) {
    console.error('[WidgetBridge] Failed to update widget:', error);
    return { success: false };
  }
};

/**
 * Gets the current widget data (if available)
 * Useful for debugging or syncing state
 *
 * @returns {Promise<Object|null>}
 */
export const getWidgetData = async () => {
  try {
    return await WidgetBridge.getWidgetData();
  } catch (error) {
    console.error('[WidgetBridge] Failed to get widget data:', error);
    return null;
  }
};

/**
 * Builds widget data from app state
 * Centralizes the logic for creating widget-compatible data
 *
 * @param {Object} data App state data
 * @returns {Object} Widget-compatible data object
 */
export const buildWidgetData = (data) => {
  const now = new Date();
  const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;

  // Check if checked in today
  const hasCheckedInToday = lastCheckIn &&
    lastCheckIn.toDateString() === now.toDateString();

  // Check vacation status
  const isOnVacation = data.vacationUntil &&
    new Date(data.vacationUntil) > now;

  return {
    streak: data.streak || 0,
    lastCheckIn: data.lastCheckIn || null,
    hasCheckedInToday: !!hasCheckedInToday,
    checkInWindowStart: data.checkInWindowStart || null,
    checkInWindowEnd: data.checkInWindowEnd || null,
    isOnVacation: !!isOnVacation
  };
};

/**
 * Convenience function to sync widget with current app state
 *
 * @param {Object} data App state data
 * @returns {Promise<{success: boolean}>}
 */
export const syncWidget = async (data) => {
  const widgetData = buildWidgetData(data);
  return updateWidget(widgetData);
};

export default WidgetBridge;
