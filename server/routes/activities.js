import express from 'express';
import { getUser, updateUser } from '../db/database.js';
import { sendActivityAlert } from '../services/email.js';

const router = express.Router();

// In-memory storage for active activities (in production, use database)
const activeActivities = new Map();

// Start an activity
router.post('/start', async (req, res) => {
  try {
    const { userId, type, emoji, label, durationMinutes, shareLocation, details, latitude, longitude, startedAt, expectedEndAt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const user = getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activity = {
      id: Date.now().toString(),
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
      expectedEndAt,
      status: 'active'
    };

    // Store active activity
    activeActivities.set(userId, activity);

    // Schedule alert check
    const endTime = new Date(expectedEndAt).getTime();
    const gracePeriodMs = 5 * 60 * 1000; // 5 minutes
    const alertTime = endTime + gracePeriodMs - Date.now();

    if (alertTime > 0) {
      setTimeout(async () => {
        // Check if activity is still active
        const current = activeActivities.get(userId);
        if (current && current.id === activity.id && current.status === 'active') {
          // Activity expired, send alert
          try {
            const currentUser = getUser(userId);
            if (currentUser) {
              await sendActivityAlert(currentUser, activity);
              current.status = 'alerted';
              activeActivities.set(userId, current);
            }
          } catch (e) {
            console.error('[Activity] Failed to send alert:', e);
          }
        }
      }, alertTime);
    }

    console.log(`[Activity] Started: ${label} for user ${userId}, ends at ${expectedEndAt}`);

    res.json({ success: true, activity });
  } catch (error) {
    console.error('[Activity] Start error:', error);
    res.status(500).json({ error: 'Failed to start activity' });
  }
});

// Complete an activity (user checked back in safely)
router.post('/complete', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const activity = activeActivities.get(userId);
    if (activity) {
      activity.status = 'completed';
      activity.completedAt = new Date().toISOString();
      activeActivities.delete(userId);

      console.log(`[Activity] Completed safely: ${activity.label} for user ${userId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Activity] Complete error:', error);
    res.status(500).json({ error: 'Failed to complete activity' });
  }
});

// Extend an activity
router.post('/extend', (req, res) => {
  try {
    const { userId, minutes } = req.body;

    if (!userId || !minutes) {
      return res.status(400).json({ error: 'userId and minutes required' });
    }

    const activity = activeActivities.get(userId);
    if (!activity) {
      return res.status(404).json({ error: 'No active activity found' });
    }

    // Extend the end time
    const newEndTime = new Date(activity.expectedEndAt);
    newEndTime.setMinutes(newEndTime.getMinutes() + minutes);
    activity.expectedEndAt = newEndTime.toISOString();
    activity.durationMinutes += minutes;

    activeActivities.set(userId, activity);

    console.log(`[Activity] Extended by ${minutes} min: ${activity.label} for user ${userId}`);

    res.json({ success: true, activity });
  } catch (error) {
    console.error('[Activity] Extend error:', error);
    res.status(500).json({ error: 'Failed to extend activity' });
  }
});

// Cancel an activity
router.post('/cancel', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const activity = activeActivities.get(userId);
    if (activity) {
      activity.status = 'cancelled';
      activeActivities.delete(userId);

      console.log(`[Activity] Cancelled: ${activity.label} for user ${userId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Activity] Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel activity' });
  }
});

// Manually trigger activity alert (from client if server check fails)
router.post('/alert', async (req, res) => {
  try {
    const { userId, activity } = req.body;

    if (!userId || !activity) {
      return res.status(400).json({ error: 'userId and activity required' });
    }

    const user = getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await sendActivityAlert(user, activity);

    // Remove from active activities
    activeActivities.delete(userId);

    console.log(`[Activity] Alert sent for: ${activity.label} for user ${userId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('[Activity] Alert error:', error);
    res.status(500).json({ error: 'Failed to send activity alert' });
  }
});

// Get current activity status
router.get('/status/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const activity = activeActivities.get(userId);

    res.json({ activity: activity || null });
  } catch (error) {
    console.error('[Activity] Status error:', error);
    res.status(500).json({ error: 'Failed to get activity status' });
  }
});

export default router;
