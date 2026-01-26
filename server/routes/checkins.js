import { Router } from 'express';
import { recordCheckIn, getUser, updateUser } from '../db/database.js';
import { sendProofOfLife, sendVacationNotification } from '../services/email.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { validateCheckIn, validateVacation } from '../middleware/validate.js';
import { success, notFound, serverError } from '../utils/response.js';

const router = Router();

// Record a check-in
router.post('/',
  validateCheckIn,
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId, mood, note, latitude, longitude } = req.body;

      const result = await recordCheckIn(userId, { mood, note, latitude, longitude });

      if (!result) {
        return notFound(res, 'User not found');
      }

      if (result.alreadyCheckedIn) {
        return success(res, {
          message: 'Already checked in today',
          user: result.user
        });
      }

      // Send proof of life notification if enabled
      if (result.user.proofOfLifeEnabled) {
        try {
          await sendProofOfLife(result.user);
        } catch (err) {
          console.error('Failed to send proof of life:', err);
          // Don't fail the check-in if notification fails
        }
      }

      return success(res, {
        message: 'Check-in recorded',
        user: result.user
      });
    } catch (err) {
      console.error('Error recording check-in:', err);
      return serverError(res, 'Failed to record check-in');
    }
  }
);

// Set vacation mode
router.put('/vacation',
  validateVacation,
  authenticate,
  authorizeUser(),
  async (req, res) => {
    try {
      const { userId, vacationUntil, notifyContact } = req.body;

      const existingUser = await getUser(userId);
      if (!existingUser) {
        return notFound(res, 'User not found');
      }

      const user = await updateUser(userId, { vacationUntil });

      // Send vacation notification to contact if requested
      if (vacationUntil && notifyContact) {
        try {
          await sendVacationNotification(user, vacationUntil);
        } catch (err) {
          console.error('Failed to send vacation notification:', err);
          // Don't fail if notification fails
        }
      }

      return success(res, {
        message: vacationUntil ? 'Vacation mode enabled' : 'Vacation mode disabled',
        user
      });
    } catch (err) {
      console.error('Error setting vacation mode:', err);
      return serverError(res, 'Failed to set vacation mode');
    }
  }
);

// Note: test-alert endpoint removed - use /api/users/:id/test-alert instead

export default router;
