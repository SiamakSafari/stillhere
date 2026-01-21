import { Router } from 'express';
import { createUser, getUser, updateUser } from '../db/database.js';
import { sendAlert } from '../services/email.js';

const router = Router();

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { id, name, contactName, contactEmail, petName, petNotes, petEmoji } = req.body;

    if (!id || !name || !contactName || !contactEmail) {
      return res.status(400).json({
        error: 'Missing required fields: id, name, contactName, contactEmail'
      });
    }

    // Check if user already exists
    const existingUser = await getUser(id);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        user: existingUser
      });
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

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get a user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await getUser(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const existingUser = await getUser(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Send test alert
router.post('/:id/test-alert', async (req, res) => {
  try {
    const user = await getUser(req.params.id);

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
