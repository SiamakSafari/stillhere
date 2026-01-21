import { Router } from 'express';
import {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
  sendPushNotification
} from '../services/push.js';
import { getUser } from '../db/database.js';

const router = Router();

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return res.status(503).json({
      error: 'Push notifications not configured'
    });
  }

  res.json({ publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({
        error: 'Missing userId or subscription'
      });
    }

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await saveSubscription(userId, subscription);

    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    await removeSubscription(userId);

    res.json({ message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// Test push notification (for debugging)
router.post('/test', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await sendPushNotification(userId, {
      title: 'Test Notification',
      body: 'This is a test push notification from Still Here!',
      icon: '/icon-192.png',
      tag: 'test'
    });

    if (result.success) {
      res.json({ message: 'Test notification sent', ...result });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
