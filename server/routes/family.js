import { Router } from 'express';
import {
  getUser,
  getFamilyShareByToken,
  getFamilySharesByUser,
  createFamilyShare,
  deleteFamilyShare,
  getCheckInHistory
} from '../db/database.js';

const router = Router();

// Simple in-memory rate limiter for family dashboard access
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 60; // 60 requests per hour per token

const checkRateLimit = (token) => {
  const now = Date.now();
  const key = `family:${token}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  const record = rateLimitStore.get(key);

  // Reset if window has passed
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  // Check if over limit
  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Get family dashboard data by share token (public endpoint)
router.get('/dashboard/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token format (should be 64 hex characters)
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    // Check rate limit
    const rateLimit = checkRateLimit(token);
    res.set('X-RateLimit-Remaining', rateLimit.remaining);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.'
      });
    }

    // Look up the share
    const share = await getFamilyShareByToken(token);
    if (!share) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    // Get user data
    const user = await getUser(share.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get check-in history (last 7 days)
    const checkInHistory = await getCheckInHistory(share.userId, 7);

    // Calculate status
    const now = new Date();
    const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;
    const isOnVacation = user.vacationUntil && new Date(user.vacationUntil) > now;

    let status = 'unknown';
    if (isOnVacation) {
      status = 'vacation';
    } else if (lastCheckIn) {
      const hoursSinceCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);
      if (hoursSinceCheckIn < 24) {
        status = 'checked_in';
      } else if (hoursSinceCheckIn < 48) {
        status = 'pending';
      } else {
        status = 'overdue';
      }
    }

    // Return only safe, privacy-respecting data
    res.json({
      name: user.name,
      lastCheckIn: user.lastCheckIn,
      streak: user.streak,
      status,
      isOnVacation,
      vacationUntil: isOnVacation ? user.vacationUntil : null,
      checkInHistory: checkInHistory.map(date => date), // Just timestamps, no mood/notes
      shareLabel: share.label
    });
  } catch (error) {
    console.error('Error fetching family dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get user's share links (requires userId)
router.get('/shares/:userId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const shares = await getFamilySharesByUser(req.params.userId);
    res.json(shares);
  } catch (error) {
    console.error('Error getting family shares:', error);
    res.status(500).json({ error: 'Failed to get share links' });
  }
});

// Create a new share link
router.post('/shares/:userId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { label, expiresAt } = req.body;

    // Validate expiration date if provided
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return res.status(400).json({ error: 'Expiration date must be in the future' });
    }

    const share = await createFamilyShare(req.params.userId, label || null, expiresAt || null);
    res.status(201).json(share);
  } catch (error) {
    console.error('Error creating family share:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Delete a share link
router.delete('/shares/:userId/:shareId', async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await deleteFamilyShare(parseInt(req.params.shareId), req.params.userId);
    res.json({ message: 'Share link revoked successfully' });
  } catch (error) {
    console.error('Error deleting family share:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

export default router;
