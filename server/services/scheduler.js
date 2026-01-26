import cron from 'node-cron';
import { 
  getUsersNeedingReminder, 
  getLastCheckInLocation,
  getOverdueActivities,
  updateActivity,
  getUser,
  pruneOldCheckIns
} from '../db/database.js';
import { sendAlert, sendReminder, sendActivityAlert } from './email.js';
import { sendAlertSMS, isSMSConfigured } from './sms.js';
import { sendReminderPush } from './push.js';
import config from '../config.js';

// Track which users have received reminders/alerts to avoid duplicates per day
const sentReminders = new Map();
const sentAlerts = new Map();

// Check if current time is past user's check-in window end
const isPastCheckInWindow = (user) => {
  if (!user.checkInWindowEnd) return true; // No window set, always apply default behavior

  const now = new Date();
  const userTimezone = user.timezone || 'UTC';

  try {
    // Get current time in user's timezone
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const [endHour, endMinute] = user.checkInWindowEnd.split(':').map(Number);

    const windowEnd = new Date(userTime);
    windowEnd.setHours(endHour, endMinute, 0, 0);

    return userTime > windowEnd;
  } catch (err) {
    console.error(`[Scheduler] Error checking window for user ${user.name}:`, err);
    return true; // Default to sending if we can't determine
  }
};

// Get today's date string for tracking
const getTodayKey = () => new Date().toISOString().split('T')[0];

const checkMissedCheckIns = async () => {
  console.log('[Scheduler] Checking for missed check-ins...');

  try {
    // Get users who haven't checked in for 24+ hours (reminder)
    const usersForReminder = await getUsersNeedingReminder(config.reminderThresholdHours);
    const todayKey = getTodayKey();

    for (const user of usersForReminder) {
      const reminderKey = `${user.id}:${todayKey}`;

      // Skip if already sent reminder today
      if (sentReminders.has(reminderKey)) continue;

      // Check if this user should get an alert instead (48+ hours)
      const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
      const hoursSinceCheckIn = lastCheckIn
        ? (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Check if we're past the user's check-in window
      const pastWindow = isPastCheckInWindow(user);

      if (hoursSinceCheckIn >= config.alertThresholdHours) {
        const alertKey = `${user.id}:${todayKey}`;

        if (!sentAlerts.has(alertKey)) {
          console.log(`[Scheduler] Sending alert for user ${user.name} (${hoursSinceCheckIn.toFixed(1)}h since check-in)`);

          const alertPref = user.alertPreference || 'email';

          // Get last known location if location sharing is enabled
          let location = null;
          if (user.locationSharingEnabled) {
            location = await getLastCheckInLocation(user.id);
          }

          // Send email alert
          if (alertPref === 'email' || alertPref === 'both') {
            await sendAlert(user, false, location);
          }

          // Send SMS alert
          if ((alertPref === 'sms' || alertPref === 'both') && isSMSConfigured()) {
            await sendAlertSMS(user, {
              includeLocation: !!location,
              latitude: location?.latitude,
              longitude: location?.longitude
            });
          }

          sentAlerts.set(alertKey, Date.now());
        }
      } else if (hoursSinceCheckIn >= config.reminderThresholdHours && pastWindow) {
        // Only send reminder if past user's check-in window
        console.log(`[Scheduler] Sending reminder for user ${user.name} (${hoursSinceCheckIn.toFixed(1)}h since check-in, past window)`);
        await sendReminder(user);

        // Also try to send push notification reminder
        try {
          await sendReminderPush(user);
        } catch (e) {
          // Push notification is optional, don't fail if it doesn't work
        }

        sentReminders.set(reminderKey, Date.now());
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking missed check-ins:', err);
  }
};

// Check for overdue activities and send alerts
const checkOverdueActivities = async () => {
  console.log('[Scheduler] Checking for overdue activities...');

  try {
    const overdueActivities = await getOverdueActivities();

    for (const activity of overdueActivities) {
      console.log(`[Scheduler] Activity overdue: ${activity.label} for user ${activity.userId}`);

      const user = await getUser(activity.userId);
      if (!user) {
        console.warn(`[Scheduler] User not found for activity: ${activity.userId}`);
        continue;
      }

      try {
        await sendActivityAlert(user, activity);
        await updateActivity(activity.id, { status: 'alerted' });
        console.log(`[Scheduler] Activity alert sent for: ${activity.label}`);
      } catch (err) {
        console.error(`[Scheduler] Failed to send activity alert:`, err);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking overdue activities:', err);
  }
};

// Clean up old tracking entries
const cleanupTracking = () => {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Clean entries older than 24 hours
  for (const [key, timestamp] of sentReminders.entries()) {
    if (now - timestamp > oneDayMs) {
      sentReminders.delete(key);
    }
  }

  for (const [key, timestamp] of sentAlerts.entries()) {
    if (now - timestamp > oneDayMs) {
      sentAlerts.delete(key);
    }
  }
};

// Prune old data for data retention
const pruneOldData = async () => {
  console.log('[Scheduler] Pruning old check-in data...');
  try {
    await pruneOldCheckIns(config.maxCheckInHistoryDays);
    console.log('[Scheduler] Old data pruned successfully');
  } catch (err) {
    console.error('[Scheduler] Error pruning old data:', err);
  }
};

export const startScheduler = () => {
  console.log('[Scheduler] Starting scheduler...');

  // Check for missed check-ins every hour at minute 0
  cron.schedule('0 * * * *', () => {
    checkMissedCheckIns();
  });

  // Check for overdue activities every minute
  cron.schedule('* * * * *', () => {
    checkOverdueActivities();
  });

  // Clean up tracking daily at midnight
  cron.schedule('0 0 * * *', () => {
    cleanupTracking();
  });

  // Prune old check-in data weekly on Sunday at 3am
  cron.schedule('0 3 * * 0', () => {
    pruneOldData();
  });

  // Run initial checks on startup (delayed to allow DB to initialize)
  setTimeout(() => {
    checkMissedCheckIns();
    checkOverdueActivities();
  }, 2000);

  console.log('[Scheduler] Scheduler started:');
  console.log('  - Check-in monitoring: every hour');
  console.log('  - Activity monitoring: every minute');
  console.log('  - Tracking cleanup: daily at midnight');
  console.log('  - Data pruning: weekly on Sunday at 3am');
};
