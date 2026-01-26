import express from 'express';
import {
  validateApiKey,
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  recordCheckIn,
  getUser,
  logExternalCheckIn,
  getLastExternalCheckIn
} from '../db/database.js';

const router = express.Router();

// Rate limit: 1 check-in per hour per API key
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

// Middleware to extract API key from Authorization header
const extractApiKey = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  // Support "Bearer <key>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
};

// POST /api/checkin/external - External check-in (API key auth)
router.post('/checkin/external', async (req, res) => {
  try {
    const apiKey = extractApiKey(req);

    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key',
        message: 'Include your API key in the Authorization header: Bearer YOUR_API_KEY'
      });
    }

    // Validate API key
    const keyData = await validateApiKey(apiKey);

    if (!keyData) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or has been revoked'
      });
    }

    // Check rate limit
    const lastCheckIn = await getLastExternalCheckIn(keyData.keyId);
    if (lastCheckIn) {
      const timeSince = Date.now() - new Date(lastCheckIn + 'Z').getTime();
      if (timeSince < RATE_LIMIT_MS) {
        const minutesRemaining = Math.ceil((RATE_LIMIT_MS - timeSince) / 60000);
        return res.status(429).json({
          error: 'Rate limited',
          message: `Please wait ${minutesRemaining} minutes before checking in again`,
          retryAfter: Math.ceil((RATE_LIMIT_MS - timeSince) / 1000)
        });
      }
    }

    // Get source from request body or query
    const source = req.body?.source || req.query?.source || 'api';
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';

    // Record the check-in
    const result = await recordCheckIn(keyData.userId, {
      note: `External check-in via ${source}`
    });

    // Log the external check-in
    await logExternalCheckIn(keyData.userId, keyData.keyId, source, ipAddress);

    if (result.alreadyCheckedIn) {
      return res.json({
        success: true,
        alreadyCheckedIn: true,
        message: 'Already checked in today',
        streak: result.user.streak,
        user: keyData.userName
      });
    }

    console.log(`[External API] Check-in for ${keyData.userName} via ${source}`);

    res.json({
      success: true,
      message: 'Check-in recorded',
      streak: result.user.streak,
      user: keyData.userName
    });

  } catch (error) {
    console.error('[External API] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/keys/:userId - List user's API keys
router.get('/keys/:userId', async (req, res) => {
  try {
    const keys = await getApiKeys(req.params.userId);
    res.json(keys);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// POST /api/keys/:userId - Generate new API key
router.post('/keys/:userId', async (req, res) => {
  try {
    const { label } = req.body;

    // Check if user exists
    const user = await getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has too many keys
    const existingKeys = await getApiKeys(req.params.userId);
    if (existingKeys.length >= 10) {
      return res.status(400).json({ error: 'Maximum of 10 API keys allowed' });
    }

    const key = await generateApiKey(req.params.userId, label);

    console.log(`[External API] New API key generated for user ${req.params.userId}`);

    res.status(201).json({
      ...key,
      message: 'Save this API key - it will not be shown again!'
    });

  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// DELETE /api/keys/:userId/:keyId - Revoke API key
router.delete('/keys/:userId/:keyId', async (req, res) => {
  try {
    await revokeApiKey(
      parseInt(req.params.keyId),
      req.params.userId
    );

    console.log(`[External API] API key ${req.params.keyId} revoked`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export default router;
