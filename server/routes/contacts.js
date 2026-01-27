import express from 'express';
import crypto from 'crypto';
import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContact,
  getContactByVerificationToken,
  setEmailVerificationToken,
  markEmailVerified,
  getUser
} from '../db/database.js';
import { sendVerificationEmail } from '../services/email.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { validateUUIDParam, validateEmergencyContact } from '../middleware/validate.js';

const router = express.Router();

// Generate a secure verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// GET /api/contacts/:userId - List all contacts for a user
router.get('/:userId', validateUUIDParam('userId'), authenticate, authorizeUser('userId'), async (req, res) => {
  try {
    const contacts = await getEmergencyContacts(req.params.userId);
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/contacts/:userId - Add a new contact
router.post('/:userId', validateUUIDParam('userId'), validateEmergencyContact, authenticate, authorizeUser('userId'), async (req, res) => {
  try {
    const { name, email, phone, alertPreference } = req.body;

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
router.put('/:userId/:contactId', validateUUIDParam('userId'), validateEmergencyContact, authenticate, authorizeUser('userId'), async (req, res) => {
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
router.delete('/:userId/:contactId', validateUUIDParam('userId'), authenticate, authorizeUser('userId'), async (req, res) => {
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

// POST /api/contacts/:userId/:contactId/send-verification - Send verification email
router.post('/:userId/:contactId/send-verification', validateUUIDParam('userId'), authenticate, authorizeUser('userId'), async (req, res) => {
  try {
    const contact = await getEmergencyContact(parseInt(req.params.contactId), req.params.userId);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (!contact.email) {
      return res.status(400).json({ error: 'Contact has no email address' });
    }

    if (contact.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Get user info for the email
    const user = await getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate and save verification token
    const token = generateVerificationToken();
    await setEmailVerificationToken(contact.id, token);

    // Send verification email
    const result = await sendVerificationEmail(user, contact, token);

    if (result.success) {
      res.json({ success: true, message: 'Verification email sent' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// GET /api/contacts/verify/:token - Verify email (public endpoint)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      return res.status(400).send(renderVerificationPage(false, 'Invalid verification link'));
    }

    const contact = await getContactByVerificationToken(token);

    if (!contact) {
      return res.status(404).send(renderVerificationPage(false, 'Verification link expired or invalid'));
    }

    if (contact.emailVerified) {
      return res.send(renderVerificationPage(true, 'Email already verified'));
    }

    // Mark as verified
    await markEmailVerified(contact.id);

    res.send(renderVerificationPage(true, `Thank you, ${contact.name}! Your email has been verified.`));
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).send(renderVerificationPage(false, 'Verification failed. Please try again.'));
  }
});

// Helper function to render verification result page
function renderVerificationPage(success, message) {
  const bgColor = success ? '#0a0a0a' : '#0a0a0a';
  const accentColor = success ? '#4ade80' : '#ef4444';
  const icon = success ? '✓' : '✗';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Still Here</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: ${bgColor};
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 40px;
          border: 1px solid #374151;
          max-width: 400px;
          text-align: center;
        }
        .icon {
          width: 60px;
          height: 60px;
          background: ${accentColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 30px;
          color: #0a0a0a;
        }
        h1 {
          color: #ffffff;
          font-size: 24px;
          margin-bottom: 16px;
        }
        p {
          color: #9ca3af;
          font-size: 16px;
          line-height: 1.6;
        }
        .success { color: ${accentColor}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${icon}</div>
        <h1>${success ? 'Verified!' : 'Verification Failed'}</h1>
        <p class="${success ? 'success' : ''}">${message}</p>
        <p style="margin-top: 20px; font-size: 14px;">You can close this page now.</p>
      </div>
    </body>
    </html>
  `;
}

export default router;
