import express from 'express';
import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} from '../db/database.js';

const router = express.Router();

// GET /api/contacts/:userId - List all contacts for a user
router.get('/:userId', async (req, res) => {
  try {
    const contacts = await getEmergencyContacts(req.params.userId);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/contacts/:userId - Add a new contact
router.post('/:userId', async (req, res) => {
  try {
    const { name, email, phone, alertPreference } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required' });
    }

    const contact = await createEmergencyContact(req.params.userId, {
      name,
      email,
      phone,
      alertPreference
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error.message.includes('Maximum')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// PUT /api/contacts/:userId/:contactId - Update a contact
router.put('/:userId/:contactId', async (req, res) => {
  try {
    const { name, email, phone, alertPreference, priority } = req.body;

    const contact = await updateEmergencyContact(
      parseInt(req.params.contactId),
      req.params.userId,
      { name, email, phone, alertPreference, priority }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:userId/:contactId - Delete a contact
router.delete('/:userId/:contactId', async (req, res) => {
  try {
    await deleteEmergencyContact(
      parseInt(req.params.contactId),
      req.params.userId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
