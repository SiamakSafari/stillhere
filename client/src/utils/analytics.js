/**
 * Analytics and tracking utilities using Sentry
 * Tracks key user events as breadcrumbs for debugging
 */

// Get Sentry instance (initialized in main.jsx)
const getSentry = () => window.Sentry;

/**
 * Add a breadcrumb for debugging
 */
export const addBreadcrumb = (category, message, data = {}, level = 'info') => {
  const Sentry = getSentry();
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set user context after onboarding
 */
export const setUserContext = (userId, name) => {
  const Sentry = getSentry();
  if (!Sentry) return;

  Sentry.setUser({
    id: userId,
    // Don't send name to protect privacy, just use first letter
    username: name ? name.charAt(0) + '***' : undefined,
  });
};

/**
 * Clear user context (on logout/reset)
 */
export const clearUserContext = () => {
  const Sentry = getSentry();
  if (!Sentry) return;

  Sentry.setUser(null);
};

/**
 * Track custom event (as breadcrumb with 'event' category)
 */
export const trackEvent = (eventName, data = {}) => {
  addBreadcrumb('event', eventName, data);
};

// Specific event tracking functions

export const trackOnboardingCompleted = (userId) => {
  trackEvent('onboarding_completed', { userId });
};

export const trackCheckInCompleted = (mood) => {
  trackEvent('checkin_completed', { mood: mood || 'skipped' });
};

export const trackActivityStarted = (activityType, durationMinutes) => {
  trackEvent('activity_started', { activityType, durationMinutes });
};

export const trackActivityEnded = (activityType, completedNormally) => {
  trackEvent('activity_ended', { activityType, completedNormally });
};

export const trackVacationEnabled = (durationDays) => {
  trackEvent('vacation_enabled', { durationDays });
};

export const trackVacationDisabled = () => {
  trackEvent('vacation_disabled');
};

export const trackAlertSent = (alertType) => {
  // This is typically server-side, but can be tracked client-side too
  trackEvent('alert_sent', { alertType });
};

export const trackError = (errorType, errorMessage) => {
  addBreadcrumb('error', errorMessage, { errorType }, 'error');
};

// Export for use in components
export default {
  addBreadcrumb,
  setUserContext,
  clearUserContext,
  trackEvent,
  trackOnboardingCompleted,
  trackCheckInCompleted,
  trackActivityStarted,
  trackActivityEnded,
  trackVacationEnabled,
  trackVacationDisabled,
  trackAlertSent,
  trackError,
};
