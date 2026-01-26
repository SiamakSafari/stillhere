import { Router } from 'express';
import { 
  getUser, 
  createActivity, 
  getActiveActivityByUser, 
  updateActivity,
  getActivity 
} from '../db/database.js';
import { sendActivityAlert } from '../services/email.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { validateActivity, validateUUIDParam } from '../middleware/validate.js';
import { success, notFound, badRequest, serverError } from '../utils/response.js';
import config from '../config.js';

const router = Router();

// Start an activity
router.post('/start',
  validateActivity,
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { 
        userId, 
        type, 
        emoji, 
        label, 
        durationMinutes, 
        shareLocation, 
        details, 
        latitude, 
        longitude, 
        startedAt, 
        expectedEndAt 
      } = req.body;

      // Verify user exists (with await - fixes the critical bug)
      const user = await getUser(userId);
      if (!user) {
        return notFound(res, 'User not found');
      }

      const activityId = Date.now().toString();
      
      const activity = await createActivity({
        id: activityId,
        userId,
        type,
        emoji,
        label,
        durationMinutes,
        shareLocation,
        details,
        latitude,
        longitude,
        startedAt: startedAt || new Date().toISOString(),
        expectedEndAt
      });

      console.log(`[Activity] Started: ${label} for user ${userId}, ends at ${expectedEndAt}`);

      return success(res, { success: true, activity });
    } catch (err) {
      console.error('[Activity] Start error:', err);
      return serverError(res, 'Failed to start activity');
    }
  }
);

// Complete an activity (user checked back in safely)
router.post('/complete',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return badRequest(res, 'userId required');
      }

      const activity = await getActiveActivityByUser(userId);
      
      if (activity) {
        await updateActivity(activity.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });

        console.log(`[Activity] Completed safely: ${activity.label} for user ${userId}`);
      }

      return success(res, { success: true });
    } catch (err) {
      console.error('[Activity] Complete error:', err);
      return serverError(res, 'Failed to complete activity');
    }
  }
);

// Extend an activity
router.post('/extend',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId, minutes } = req.body;

      if (!userId || !minutes) {
        return badRequest(res, 'userId and minutes required');
      }

      if (typeof minutes !== 'number' || minutes < 1 || minutes > 1440) {
        return badRequest(res, 'Minutes must be between 1 and 1440');
      }

      const activity = await getActiveActivityByUser(userId);
      
      if (!activity) {
        return notFound(res, 'No active activity found');
      }

      // Extend the end time
      const newEndTime = new Date(activity.expectedEndAt);
      newEndTime.setMinutes(newEndTime.getMinutes() + minutes);
      
      const updated = await updateActivity(activity.id, {
        expectedEndAt: newEndTime.toISOString(),
        durationMinutes: activity.durationMinutes + minutes
      });

      console.log(`[Activity] Extended by ${minutes} min: ${activity.label} for user ${userId}`);

      return success(res, { success: true, activity: updated });
    } catch (err) {
      console.error('[Activity] Extend error:', err);
      return serverError(res, 'Failed to extend activity');
    }
  }
);

// Cancel an activity
router.post('/cancel',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return badRequest(res, 'userId required');
      }

      const activity = await getActiveActivityByUser(userId);
      
      if (activity) {
        await updateActivity(activity.id, { status: 'cancelled' });
        console.log(`[Activity] Cancelled: ${activity.label} for user ${userId}`);
      }

      return success(res, { success: true });
    } catch (err) {
      console.error('[Activity] Cancel error:', err);
      return serverError(res, 'Failed to cancel activity');
    }
  }
);

// Manually trigger activity alert (from client if server check fails)
router.post('/alert',
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId, activity } = req.body;

      if (!userId || !activity) {
        return badRequest(res, 'userId and activity required');
      }

      // Verify user exists
      const user = await getUser(userId);
      if (!user) {
        return notFound(res, 'User not found');
      }

      await sendActivityAlert(user, activity);

      // Mark the activity as alerted in database
      if (activity.id) {
        await updateActivity(activity.id, { status: 'alerted' });
      }

      console.log(`[Activity] Alert sent for: ${activity.label} for user ${userId}`);

      return success(res, { success: true });
    } catch (err) {
      console.error('[Activity] Alert error:', err);
      return serverError(res, 'Failed to send activity alert');
    }
  }
);

// Get current activity status
router.get('/status/:userId',
  validateUUIDParam('userId'),
  authenticate,
  authorizeUser('userId'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const activity = await getActiveActivityByUser(userId);

      return success(res, { activity: activity || null });
    } catch (err) {
      console.error('[Activity] Status error:', err);
      return serverError(res, 'Failed to get activity status');
    }
  }
);

export default router;
