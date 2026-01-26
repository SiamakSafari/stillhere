// Server configuration - extract magic numbers and settings
export const config = {
  // Server
  port: process.env.PORT || 3002,
  
  // Database
  databasePath: process.env.DATABASE_PATH || './db/stillhere.db',
  
  // Check-in timing
  reminderThresholdHours: 24,
  alertThresholdHours: 48,
  
  // Activity mode
  activityGracePeriodMinutes: 5,
  
  // Rate limiting
  rateLimitWindowMs: 60 * 60 * 1000, // 1 hour
  rateLimitMaxRequests: 60,
  rateLimitCleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  
  // Retry/timeout
  defaultTimeoutMs: 15000,
  maxRetries: 3,
  retryDelayBaseMs: 1000,
  
  // Data retention
  maxCheckInHistoryDays: 365,
  
  // Auth
  authEnabled: process.env.AUTH_ENABLED === 'true',
  
  // App URL for confirmation links
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  
  // Email
  fromEmail: process.env.FROM_EMAIL || 'alerts@stillhere.app',
};

export default config;
