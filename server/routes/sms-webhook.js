import express from 'express';
import twilio from 'twilio';
import { getUserByPhoneNumber, recordCheckIn } from '../db/database.js';

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Valid check-in responses (case-insensitive)
const VALID_RESPONSES = ['ok', 'yes', 'y', 'here', 'alive', 'good', 'fine', 'present', '1'];

// Generate TwiML response
const twimlResponse = (message) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`;
};

// Validate Twilio request signature
const validateTwilioRequest = (req) => {
  if (!accountSid || !authToken) {
    console.warn('[SMS Webhook] Twilio credentials not configured - skipping validation');
    return true; // Allow in dev mode without credentials
  }

  const signature = req.headers['x-twilio-signature'];
  if (!signature) {
    return false;
  }

  // Build the full URL that Twilio used to sign the request
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = `${protocol}://${host}${req.originalUrl}`;

  return twilio.validateRequest(authToken, signature, url, req.body);
};

// POST /api/sms/webhook - Twilio incoming SMS webhook
router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    // Set content type for TwiML response
    res.type('text/xml');

    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!validateTwilioRequest(req)) {
        console.warn('[SMS Webhook] Invalid Twilio signature');
        return res.status(403).send(twimlResponse('Unauthorized'));
      }
    }

    const { From: fromNumber, Body: body } = req.body;

    if (!fromNumber || !body) {
      return res.status(400).send(twimlResponse('Invalid request'));
    }

    console.log(`[SMS Webhook] Received from ${fromNumber}: "${body}"`);

    // Look up user by phone number
    const user = await getUserByPhoneNumber(fromNumber);

    if (!user) {
      console.log(`[SMS Webhook] No user found for phone ${fromNumber}`);
      return res.send(twimlResponse(
        'No account found for this number. Enable SMS check-in in the Still Here app settings.'
      ));
    }

    // Normalize and check the response
    const normalizedBody = body.trim().toLowerCase();

    if (VALID_RESPONSES.includes(normalizedBody)) {
      // Record the check-in
      const result = await recordCheckIn(user.id, {
        note: 'SMS check-in'
      });

      if (result.alreadyCheckedIn) {
        console.log(`[SMS Webhook] ${user.name} already checked in today`);
        return res.send(twimlResponse(
          `Hi ${user.name}! You already checked in today. Your streak is ${user.streak} days.`
        ));
      }

      console.log(`[SMS Webhook] Check-in recorded for ${user.name}`);
      return res.send(twimlResponse(
        `Got it, ${user.name}! You're checked in. Your streak is now ${result.user.streak} days.`
      ));
    }

    // Help message for unrecognized responses
    return res.send(twimlResponse(
      `Hi ${user.name}! To check in, reply with OK, YES, or HERE.`
    ));

  } catch (error) {
    console.error('[SMS Webhook] Error:', error);
    res.status(500).send(twimlResponse('Something went wrong. Please try again.'));
  }
});

// GET /api/sms/status - Check if SMS webhook is configured
router.get('/status', (req, res) => {
  const configured = !!(accountSid && authToken && process.env.TWILIO_PHONE_NUMBER);
  res.json({
    configured,
    twilioNumber: configured ? process.env.TWILIO_PHONE_NUMBER : null
  });
});

export default router;
