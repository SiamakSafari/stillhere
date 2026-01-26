import { Router } from 'express';
import {
  getUser,
  getFamilyShareByToken,
  getFamilySharesByUser,
  createFamilyShare,
  deleteFamilyShare,
  getCheckInHistory
} from '../db/database.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import { validateShareToken, validateUUIDParam } from '../middleware/validate.js';
import { success, created, notFound, badRequest, tooManyRequests, serverError } from '../utils/response.js';
import config from '../config.js';

const router = Router();

// Simple in-memory rate limiter for family dashboard access
const rateLimitStore = new Map();

const checkRateLimit = (token, ip) => {
  const now = Date.now();
  // Rate limit by token AND IP for better protection
  const key = `family:${token}:${ip || 'unknown'}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.rateLimitMaxRequests - 1 };
  }

  const record = rateLimitStore.get(key);

  // Reset if window has passed
  if (now - record.windowStart > config.rateLimitWindowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.rateLimitMaxRequests - 1 };
  }

  // Check if over limit
  if (record.count >= config.rateLimitMaxRequests) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  record.count++;
  return { allowed: true, remaining: config.rateLimitMaxRequests - record.count };
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > config.rateLimitWindowMs) {
      rateLimitStore.delete(key);
    }
  }
}, config.rateLimitCleanupIntervalMs);

// Get family dashboard data by share token (public endpoint)
router.get('/dashboard/:token',
  validateShareToken,
  async (req, res) => {
    try {
      const { token } = req.params;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

      // Check rate limit
      const rateLimit = checkRateLimit(token, clientIp);
      res.set('X-RateLimit-Remaining', rateLimit.remaining);
      res.set('X-RateLimit-Limit', config.rateLimitMaxRequests);

      if (!rateLimit.allowed) {
        return tooManyRequests(res, 'Too many requests. Please try again later.');
      }

      // Look up the share
      const share = await getFamilyShareByToken(token);
      if (!share) {
        return notFound(res, 'Share link not found or expired');
      }

      // Get user data
      const user = await getUser(share.userId);
      if (!user) {
        return notFound(res, 'User not found');
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
        if (hoursSinceCheckIn < config.reminderThresholdHours) {
          status = 'checked_in';
        } else if (hoursSinceCheckIn < config.alertThresholdHours) {
          status = 'pending';
        } else {
          status = 'overdue';
        }
      }

      // Return only safe, privacy-respecting data
      return success(res, {
        name: user.name,
        lastCheckIn: user.lastCheckIn,
        streak: user.streak,
        status,
        isOnVacation,
        vacationUntil: isOnVacation ? user.vacationUntil : null,
        checkInHistory: checkInHistory.map(date => date), // Just timestamps, no mood/notes
        shareLabel: share.label
      });
    } catch (err) {
      console.error('Error fetching family dashboard:', err);
      return serverError(res, 'Failed to fetch dashboard data');
    }
  }
);

// Get user's share links (requires auth)
router.get('/shares/:userId',
  validateUUIDParam('userId'),
  authenticate,
  authorizeUser('userId'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.userId);
      if (!user) {
        return notFound(res, 'User not found');
      }

      const shares = await getFamilySharesByUser(req.params.userId);
      return success(res, shares);
    } catch (err) {
      console.error('Error getting family shares:', err);
      return serverError(res, 'Failed to get share links');
    }
  }
);

// Create a new share link
router.post('/shares/:userId',
  validateUUIDParam('userId'),
  authenticate,
  authorizeUser('userId'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.userId);
      if (!user) {
        return notFound(res, 'User not found');
      }

      const { label, expiresAt } = req.body;

      // Validate label length
      if (label && (typeof label !== 'string' || label.length > 100)) {
        return badRequest(res, 'Label must be 100 characters or less');
      }

      // Validate expiration date if provided
      if (expiresAt) {
        const expDate = new Date(expiresAt);
        if (isNaN(expDate.getTime())) {
          return badRequest(res, 'Invalid expiration date format');
        }
        if (expDate <= new Date()) {
          return badRequest(res, 'Expiration date must be in the future');
        }
      }

      const share = await createFamilyShare(req.params.userId, label || null, expiresAt || null);
      return created(res, share);
    } catch (err) {
      console.error('Error creating family share:', err);
      return serverError(res, 'Failed to create share link');
    }
  }
);

// Delete a share link
router.delete('/shares/:userId/:shareId',
  validateUUIDParam('userId'),
  authenticate,
  authorizeUser('userId'),
  async (req, res) => {
    try {
      const user = await getUser(req.params.userId);
      if (!user) {
        return notFound(res, 'User not found');
      }

      const shareId = parseInt(req.params.shareId, 10);
      if (isNaN(shareId)) {
        return badRequest(res, 'Invalid share ID');
      }

      await deleteFamilyShare(shareId, req.params.userId);
      return success(res, { message: 'Share link revoked successfully' });
    } catch (err) {
      console.error('Error deleting family share:', err);
      return serverError(res, 'Failed to revoke share link');
    }
  }
);

export default router;
