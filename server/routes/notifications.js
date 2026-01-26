import { Router } from 'express';
import { saveSubscription, removeSubscription, getVapidPublicKey } from '../services/push.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { success, badRequest, serverError } from '../utils/response.js';

const router = Router();

// Get VAPID public key for push subscription
router.get('/vapid-public-key', (req, res) => {
  const publicKey = getVapidPublicKey();
  
  if (!publicKey) {
    return badRequest(res, 'Push notifications not configured');
  }
  
  return success(res, { publicKey });
});

// Subscribe to push notifications
router.post('/subscribe',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId, subscription } = req.body;

      if (!userId) {
        return badRequest(res, 'userId required');
      }

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return badRequest(res, 'Invalid subscription object');
      }

      if (!subscription.keys.p256dh || !subscription.keys.auth) {
        return badRequest(res, 'Subscription missing required keys');
      }

      await saveSubscription(userId, subscription);
      return success(res, { message: 'Subscription saved successfully' });
    } catch (err) {
      console.error('Error saving push subscription:', err);
      return serverError(res, 'Failed to save subscription');
    }
  }
);

// Unsubscribe from push notifications
router.post('/unsubscribe',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return badRequest(res, 'userId required');
      }

      await removeSubscription(userId);
      return success(res, { message: 'Subscription removed successfully' });
    } catch (err) {
      console.error('Error removing push subscription:', err);
      return serverError(res, 'Failed to remove subscription');
    }
  }
);

export default router;
