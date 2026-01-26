import cron from 'node-cron';
import { getUsersNeedingReminder, getLastCheckInLocation, getEmergencyContacts } from '../db/database.js';
import { sendAlertToContact, sendReminderToContact } from './email.js';
import { sendAlertSMSToContact, isSMSConfigured } from './sms.js';
import { sendReminderPush } from './push.js';

// Track which users have received reminders/alerts to avoid duplicates
const sentReminders = new Set();
const sentAlerts = new Set();

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
  } catch (error) {
    console.error(`[Scheduler] Error checking window for user ${user.name}:`, error);
    return true; // Default to sending if we can't determine
  }
};

const checkMissedCheckIns = async () => {
  console.log('[Scheduler] Checking for missed check-ins...');

  try {
    // Get users who haven't checked in for 24+ hours (reminder)
    const usersForReminder = await getUsersNeedingReminder(24);

    for (const user of usersForReminder) {
      const reminderKey = `${user.id}-${new Date().toDateString()}`;

      // Skip if already sent reminder today
      if (sentReminders.has(reminderKey)) continue;

      // Check if this user should get an alert instead (48+ hours)
      const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
      const hoursSinceCheckIn = lastCheckIn
        ? (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60)
        : Infinity;

      // Check if we're past the user's check-in window
      const pastWindow = isPastCheckInWindow(user);

      if (hoursSinceCheckIn >= 48) {
        const alertKey = `${user.id}-${new Date().toDateString()}`;

        if (!sentAlerts.has(alertKey)) {
          console.log(`[Scheduler] Sending alert for user ${user.name} (${hoursSinceCheckIn.toFixed(1)}h since check-in)`);

          // Get last known location if location sharing is enabled
          let location = null;
          if (user.locationSharingEnabled) {
            location = await getLastCheckInLocation(user.id);
          }

          // Get all emergency contacts for this user
          const contacts = await getEmergencyContacts(user.id);

          // If no contacts in new table, fall back to legacy contact
          if (contacts.length === 0 && user.contactEmail) {
            contacts.push({
              name: user.contactName,
              email: user.contactEmail,
              phone: user.contactPhone,
              alertPreference: user.alertPreference || 'email'
            });
          }

          // Send alerts to each contact based on their preferences
          for (const contact of contacts) {
            const alertPref = contact.alertPreference || 'email';

            // Send email alert
            if ((alertPref === 'email' || alertPref === 'both') && contact.email) {
              await sendAlertToContact(user, contact, false, location);
            }

            // Send SMS alert
            if ((alertPref === 'sms' || alertPref === 'both') && contact.phone && isSMSConfigured()) {
              await sendAlertSMSToContact(user, contact, {
                includeLocation: !!location,
                latitude: location?.latitude,
                longitude: location?.longitude
              });
            }
          }

          sentAlerts.add(alertKey);
        }
      } else if (hoursSinceCheckIn >= 24 && pastWindow) {
        // Only send reminder if past user's check-in window
        console.log(`[Scheduler] Sending reminder for user ${user.name} (${hoursSinceCheckIn.toFixed(1)}h since check-in, past window)`);

        // Get all emergency contacts for this user
        const contacts = await getEmergencyContacts(user.id);

        // If no contacts in new table, fall back to legacy contact
        if (contacts.length === 0 && user.contactEmail) {
          contacts.push({
            name: user.contactName,
            email: user.contactEmail,
            phone: user.contactPhone,
            alertPreference: user.alertPreference || 'email'
          });
        }

        // Send reminders to each contact (email only for reminders)
        for (const contact of contacts) {
          if (contact.email) {
            await sendReminderToContact(user, contact);
          }
        }

        // Also try to send push notification reminder
        try {
          await sendReminderPush(user);
        } catch (e) {
          // Push notification is optional, don't fail if it doesn't work
        }

        sentReminders.add(reminderKey);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking missed check-ins:', error);
  }
};

// Clean up old tracking entries daily
const cleanupTracking = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();

  for (const key of sentReminders) {
    if (key.includes(yesterdayKey)) {
      sentReminders.delete(key);
    }
  }

  for (const key of sentAlerts) {
    if (key.includes(yesterdayKey)) {
      sentAlerts.delete(key);
    }
  }
};

export const startScheduler = () => {
  console.log('[Scheduler] Starting scheduler...');

  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    checkMissedCheckIns();
  });

  // Clean up tracking daily at midnight
  cron.schedule('0 0 * * *', () => {
    cleanupTracking();
  });

  // Run initial check on startup (delayed to allow DB to initialize)
  setTimeout(() => {
    checkMissedCheckIns();
  }, 2000);

  console.log('[Scheduler] Scheduler started - checking every hour');
};
