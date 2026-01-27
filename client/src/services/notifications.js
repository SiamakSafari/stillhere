import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

// Check if we're running on a native platform
const isNative = Capacitor.isNativePlatform();

/**
 * Initialize push notifications
 * Returns the device token on success
 */
export const initPushNotifications = async () => {
  if (!isNative) {
    console.log('[Notifications] Running in browser, using web push');
    return initWebPush();
  }

  try {
    // Request permission
    const permResult = await PushNotifications.requestPermissions();

    if (permResult.receive !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Register for push
    await PushNotifications.register();

    // Set up listeners
    PushNotifications.addListener('registration', (token) => {
      console.log('[Notifications] Push registration success:', token.value);
      // Send this token to your server
      sendTokenToServer(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Notifications] Push registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Notifications] Push received:', notification);
      // Handle foreground notification
      handleForegroundNotification(notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('[Notifications] Push action performed:', notification);
      // Handle notification tap
      handleNotificationTap(notification);
    });

    return true;
  } catch (error) {
    console.error('[Notifications] Init error:', error);
    return null;
  }
};

/**
 * Initialize web push notifications (fallback for PWA)
 */
const initWebPush = async () => {
  if (!('Notification' in window)) {
    console.log('[Notifications] Web notifications not supported');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('[Notifications] Web notification permission denied');
    return null;
  }

  // Register service worker for push
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Notifications] Service worker ready for push');
      return registration;
    } catch (error) {
      console.error('[Notifications] Service worker error:', error);
      return null;
    }
  }

  return true;
};

/**
 * Send device token to server for push notifications
 */
const sendTokenToServer = async (token) => {
  try {
    const userId = localStorage.getItem('still-here-user-id');
    if (!userId) return;

    await fetch('/api/users/' + userId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: token })
    });

    console.log('[Notifications] Token sent to server');
  } catch (error) {
    console.error('[Notifications] Failed to send token:', error);
  }
};

/**
 * Handle notification received while app is in foreground
 */
const handleForegroundNotification = async (notification) => {
  // Show a local notification since push won't show automatically in foreground
  await LocalNotifications.schedule({
    notifications: [{
      title: notification.title || 'Still Here',
      body: notification.body || '',
      id: Date.now(),
      schedule: { at: new Date(Date.now() + 100) },
      sound: 'default',
      smallIcon: 'ic_stat_icon'
    }]
  });
};

/**
 * Handle user tapping on a notification
 */
const handleNotificationTap = (notification) => {
  // Navigate or perform action based on notification data
  const data = notification.notification?.data;

  if (data?.action === 'checkin') {
    // User needs to check in
    window.location.href = '/';
  } else if (data?.action === 'alert') {
    // Someone triggered an alert
    window.location.href = '/?alert=true';
  }
};

/**
 * Schedule a local reminder notification
 */
export const scheduleReminder = async (title, body, scheduleAt) => {
  if (!isNative) {
    console.log('[Notifications] Local notifications not available in browser');
    return false;
  }

  try {
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      return false;
    }

    await LocalNotifications.schedule({
      notifications: [{
        title,
        body,
        id: Date.now(),
        schedule: { at: scheduleAt },
        sound: 'default',
        smallIcon: 'ic_stat_icon',
        actionTypeId: 'CHECKIN_REMINDER'
      }]
    });

    console.log('[Notifications] Reminder scheduled for', scheduleAt);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to schedule reminder:', error);
    return false;
  }
};

/**
 * Cancel all pending notifications
 */
export const cancelAllNotifications = async () => {
  if (!isNative) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  } catch (error) {
    console.error('[Notifications] Failed to cancel notifications:', error);
  }
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async () => {
  if (!isNative) {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  try {
    const permResult = await PushNotifications.checkPermissions();
    return permResult.receive === 'granted';
  } catch (error) {
    return false;
  }
};

/**
 * Schedule daily check-in reminders based on user's check-in window
 * @param {Object} options Reminder options
 * @param {string} options.checkInWindowEnd End of check-in window (HH:MM)
 * @param {string} options.timezone User's timezone
 * @param {number} options.streak Current streak
 */
export const scheduleDailyReminders = async ({ checkInWindowEnd, timezone, streak }) => {
  if (!isNative) {
    console.log('[Notifications] Skipping local reminders (not native)');
    return false;
  }

  try {
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      console.log('[Notifications] Permission not granted for local notifications');
      return false;
    }

    // Cancel existing reminders first
    await cancelAllNotifications();

    // If no window end time, skip scheduling
    if (!checkInWindowEnd) {
      console.log('[Notifications] No check-in window end time set');
      return false;
    }

    // Parse end time
    const [hours, minutes] = checkInWindowEnd.split(':').map(Number);

    // Schedule reminder for 2 hours before window end
    const reminderDate = new Date();
    reminderDate.setHours(hours - 2, minutes, 0, 0);
    
    // If time already passed today, schedule for tomorrow
    if (reminderDate <= new Date()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const streakMessage = streak > 1 
      ? `Don't break your ${streak}-day streak! 🔥` 
      : 'Time to check in!';

    await LocalNotifications.schedule({
      notifications: [{
        title: 'Still Here Reminder',
        body: streakMessage,
        id: 1001, // Fixed ID for daily reminder
        schedule: { 
          at: reminderDate,
          repeats: true,
          every: 'day'
        },
        sound: 'default',
        smallIcon: 'ic_stat_icon',
        actionTypeId: 'CHECKIN_REMINDER'
      }]
    });

    console.log(`[Notifications] Daily reminder scheduled for ${reminderDate.toLocaleTimeString()}`);
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to schedule daily reminders:', error);
    return false;
  }
};

/**
 * Schedule a streak warning notification
 * Shows if user hasn't checked in and streak is at risk
 * @param {Object} options Notification options
 * @param {number} options.streak Current streak
 * @param {Date} options.lastCheckIn Last check-in date
 */
export const scheduleStreakWarning = async ({ streak, lastCheckIn }) => {
  if (!isNative || streak < 2) {
    return false;
  }

  try {
    const permResult = await LocalNotifications.requestPermissions();
    if (permResult.display !== 'granted') {
      return false;
    }

    const lastCheck = new Date(lastCheckIn);
    const now = new Date();
    
    // Calculate hours since last check-in
    const hoursSinceLastCheckIn = (now - lastCheck) / (1000 * 60 * 60);
    
    // If approaching 24 hours (at 20 hours), schedule urgent reminder
    if (hoursSinceLastCheckIn >= 16 && hoursSinceLastCheckIn < 24) {
      const hoursRemaining = Math.floor(24 - hoursSinceLastCheckIn);
      
      // Schedule for 30 minutes from now to not spam
      const warningTime = new Date(now.getTime() + 30 * 60 * 1000);
      
      await LocalNotifications.schedule({
        notifications: [{
          title: '⚠️ Streak at Risk!',
          body: `Only ${hoursRemaining} hours left to keep your ${streak}-day streak! Check in now!`,
          id: 2001, // Fixed ID for streak warning
          schedule: { at: warningTime },
          sound: 'default',
          smallIcon: 'ic_stat_icon',
          actionTypeId: 'STREAK_WARNING'
        }]
      });

      console.log(`[Notifications] Streak warning scheduled for ${warningTime.toLocaleTimeString()}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Notifications] Failed to schedule streak warning:', error);
    return false;
  }
};

/**
 * Initialize notifications for the app
 * Sets up reminders based on user preferences
 */
export const initializeNotifications = async (userData) => {
  const results = {
    push: false,
    local: false
  };

  // Try to set up push notifications
  results.push = await initPushNotifications();

  // Set up local reminder notifications
  if (userData.checkInWindowEnd) {
    results.local = await scheduleDailyReminders({
      checkInWindowEnd: userData.checkInWindowEnd,
      timezone: userData.timezone,
      streak: userData.streak || 0
    });
  }

  // Schedule streak warning if applicable
  if (userData.streak > 1 && userData.lastCheckIn) {
    await scheduleStreakWarning({
      streak: userData.streak,
      lastCheckIn: userData.lastCheckIn
    });
  }

  return results;
};
