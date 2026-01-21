import webpush from 'web-push';
import { getDb, saveDb } from '../db/database.js';

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:alerts@stillhere.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] Web push configured');
} else {
  console.warn('[Push] VAPID keys not configured - push notifications disabled');
}

// Initialize push_subscriptions table
export const initPushTable = async () => {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)`);
  saveDb();
};

// Save push subscription
export const saveSubscription = async (userId, subscription) => {
  const db = await getDb();

  // Remove existing subscriptions for this endpoint
  db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [subscription.endpoint]);

  // Insert new subscription
  db.run(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`,
    [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
  );

  saveDb();
  return true;
};

// Remove push subscription
export const removeSubscription = async (userId) => {
  const db = await getDb();
  db.run('DELETE FROM push_subscriptions WHERE user_id = ?', [userId]);
  saveDb();
  return true;
};

// Get subscriptions for a user
export const getSubscriptions = async (userId) => {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?');
  stmt.bind([userId]);

  const subscriptions = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    subscriptions.push({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    });
  }
  stmt.free();

  return subscriptions;
};

// Send push notification to a user
export const sendPushNotification = async (userId, payload) => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured - skipping push');
    return { success: false, error: 'Push not configured' };
  }

  const subscriptions = await getSubscriptions(userId);

  if (subscriptions.length === 0) {
    return { success: false, error: 'No subscriptions found' };
  }

  const results = await Promise.allSettled(
    subscriptions.map(subscription =>
      webpush.sendNotification(subscription, JSON.stringify(payload))
    )
  );

  // Remove failed subscriptions (410 Gone = unsubscribed)
  const db = await getDb();
  results.forEach((result, index) => {
    if (result.status === 'rejected' && result.reason?.statusCode === 410) {
      db.run('DELETE FROM push_subscriptions WHERE endpoint = ?', [subscriptions[index].endpoint]);
    }
  });
  saveDb();

  const successful = results.filter(r => r.status === 'fulfilled').length;
  return {
    success: successful > 0,
    sent: successful,
    failed: results.length - successful
  };
};

// Send reminder notification
export const sendReminderPush = async (user) => {
  return sendPushNotification(user.id, {
    title: 'Time to check in!',
    body: `Hey ${user.name}, don't forget to check in today.`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'check-in-reminder',
    data: {
      type: 'reminder',
      userId: user.id
    }
  });
};

// Send alert notification (to contacts - for future use)
export const sendAlertPush = async (user) => {
  return sendPushNotification(user.id, {
    title: 'Still Here Alert',
    body: `You haven't checked in for over 48 hours. Your emergency contact has been notified.`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'still-here-alert',
    requireInteraction: true,
    data: {
      type: 'alert',
      userId: user.id
    }
  });
};

export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;
