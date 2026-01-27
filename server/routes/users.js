import { Router } from 'express';
import { createUser, getUser, updateUser } from '../db/database.js';
import { sendAlert } from '../services/email.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { validateUser, validateUUIDParam, validateSnooze } from '../middleware/validate.js';
import { success, created, notFound, conflict, serverError } from '../utils/response.js';

const router = Router();

// Create a new user (no auth required - registration)
router.post('/', validateUser, async (req, res) => {
  try {
    const { id, name, contactName, contactEmail, petName, petNotes, petEmoji } = req.body;

    // Check if user already exists
    const existingUser = await getUser(id);
    if (existingUser) {
      return conflict(res, 'User already exists', { user: existingUser });
    }

    const user = await createUser({
      id,
      name,
      contactName,
      contactEmail,
      petName,
      petNotes,
      petEmoji
    });

    // Return user with auth token for future requests
    return created(res, {
      ...user,
      message: 'User created successfully'
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return serverError(res, 'Failed to create user');
  }
});

// Get a user by ID
router.get('/:id', 
  validateUUIDParam('id'),
  authenticate, 
  authorizeUser('id'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.id);

      if (!user) {
        return notFound(res, 'User not found');
      }

      return success(res, user);
    } catch (err) {
      console.error('Error getting user:', err);
      return serverError(res, 'Failed to get user');
    }
  }
);

// Update a user
router.put('/:id',
  validateUUIDParam('id'),
  validateUser,
  authenticate,
  authorizeUser('id'),
  async (req, res) => {
    try {
      const existingUser = await getUser(req.params.id);

      if (!existingUser) {
        return notFound(res, 'User not found');
      }

      const user = await updateUser(req.params.id, req.body);
      return success(res, user);
    } catch (err) {
      console.error('Error updating user:', err);
      return serverError(res, 'Failed to update user');
    }
  }
);

// Send test alert
router.post('/:id/test-alert',
  validateUUIDParam('id'),
  authenticate,
  authorizeUser('id'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.id);

      if (!user) {
        return notFound(res, 'User not found');
      }

      const result = await sendAlert(user, true);

      if (result.success) {
        return success(res, { message: 'Test email sent successfully' });
      } else {
        return serverError(res, result.error || 'Failed to send test email');
      }
    } catch (err) {
      console.error('Error sending test alert:', err);
      return serverError(res, 'Failed to send test alert');
    }
  }
);

// Snooze alerts for a specified duration
router.post('/:id/snooze',
  validateUUIDParam('id'),
  validateSnooze,
  authenticate,
  authorizeUser('id'),
  async (req, res) => {
    try {
      const { hours = 2 } = req.body;

      // Validate hours (max 24 hours)
      const snoozeHours = Math.min(Math.max(1, parseInt(hours) || 2), 24);

      const user = await getUser(req.params.id);

      if (!user) {
        return notFound(res, 'User not found');
      }

      // Calculate snooze end time
      const snoozeUntil = new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString();

      const updatedUser = await updateUser(req.params.id, { snoozeUntil });

      return success(res, {
        message: `Alerts snoozed for ${snoozeHours} hour${snoozeHours > 1 ? 's' : ''}`,
        snoozeUntil: updatedUser.snoozeUntil
      });
    } catch (err) {
      console.error('Error snoozing alerts:', err);
      return serverError(res, 'Failed to snooze alerts');
    }
  }
);

// Cancel snooze
router.delete('/:id/snooze',
  validateUUIDParam('id'),
  authenticate,
  authorizeUser('id'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.id);

      if (!user) {
        return notFound(res, 'User not found');
      }

      await updateUser(req.params.id, { snoozeUntil: null });

      return success(res, { message: 'Snooze cancelled' });
    } catch (err) {
      console.error('Error cancelling snooze:', err);
      return serverError(res, 'Failed to cancel snooze');
    }
  }
);

export default router;
