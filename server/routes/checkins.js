import { Router } from 'express';
import { recordCheckIn, getUser, updateUser } from '../db/database.js';
import { sendAlert, sendProofOfLife, sendVacationNotification } from '../services/email.js';

const router = Router();

// Record a check-in
router.post('/', async (req, res) => {
  try {
    const { userId, mood, note, latitude, longitude } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const result = await recordCheckIn(userId, { mood, note, latitude, longitude });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.alreadyCheckedIn) {
      return res.status(200).json({
        message: 'Already checked in today',
        user: result.user
      });
    }

    // Send proof of life notification if enabled
    if (result.user.proofOfLifeEnabled) {
      try {
        await sendProofOfLife(result.user);
      } catch (error) {
        console.error('Failed to send proof of life:', error);
        // Don't fail the check-in if notification fails
      }
    }

    res.json({
      message: 'Check-in recorded',
      user: result.user
    });
  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// Set vacation mode
router.put('/vacation', async (req, res) => {
  try {
    const { userId, vacationUntil, notifyContact } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const existingUser = await getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await updateUser(userId, { vacationUntil });

    // Send vacation notification to contact if requested
    if (vacationUntil && notifyContact) {
      try {
        await sendVacationNotification(user, vacationUntil);
      } catch (error) {
        console.error('Failed to send vacation notification:', error);
        // Don't fail if notification fails
      }
    }

    res.json({
      message: vacationUntil ? 'Vacation mode enabled' : 'Vacation mode disabled',
      user
    });
  } catch (error) {
    console.error('Error setting vacation mode:', error);
    res.status(500).json({ error: 'Failed to set vacation mode' });
  }
});

// Send test alert (alternative endpoint)
router.post('/test-alert', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await sendAlert(user, true);

    if (result.success) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send test email' });
    }
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert' });
  }
});

export default router;
