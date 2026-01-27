import express from 'express';
import { getDb, getUserByAuthToken } from '../db/database.js';
import { authenticate, authorizeUser } from '../middleware/auth.js';
import config from '../config.js';

const router = express.Router();

// Middleware to handle auth via query param for downloads (in addition to header)
const authenticateDownload = async (req, res, next) => {
  // If auth is disabled, skip
  if (!config.authEnabled) {
    return next();
  }

  // Try header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }

  // Fall back to query param for downloads
  const token = req.query.token;
  if (token) {
    try {
      const user = await getUserByAuthToken(token);
      if (user) {
        req.user = user;
        req.userId = user.id;
        return next();
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return res.status(401).json({
    error: 'Authentication required',
    code: 'AUTH_REQUIRED'
  });
};

// GET /api/export/:userId/checkins - Export check-in history as CSV
router.get('/:userId/checkins', authenticateDownload, authorizeUser('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 365 } = req.query;

    const database = await getDb();
    const stmt = database.prepare(`
      SELECT
        checked_in_at,
        mood,
        note,
        latitude,
        longitude
      FROM check_ins
      WHERE user_id = ?
      AND datetime(checked_in_at) >= datetime('now', '-' || ? || ' days')
      ORDER BY checked_in_at DESC
    `);
    stmt.bind([userId, parseInt(days)]);

    const checkIns = [];
    while (stmt.step()) {
      checkIns.push(stmt.getAsObject());
    }
    stmt.free();

    // Build CSV
    const headers = ['Date', 'Time', 'Mood', 'Note', 'Latitude', 'Longitude'];
    const rows = checkIns.map(c => {
      const date = c.checked_in_at ? new Date(c.checked_in_at + 'Z') : null;
      return [
        date ? date.toISOString().split('T')[0] : '',
        date ? date.toISOString().split('T')[1].split('.')[0] : '',
        escapeCsvField(c.mood || ''),
        escapeCsvField(c.note || ''),
        c.latitude || '',
        c.longitude || ''
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Set headers for file download
    const filename = `stillhere-checkins-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

  } catch (error) {
    console.error('Error exporting check-ins:', error);
    res.status(500).json({ error: 'Failed to export check-ins' });
  }
});

// GET /api/export/:userId/summary - Export account summary
router.get('/:userId/summary', authenticateDownload, authorizeUser('userId'), async (req, res) => {
  try {
    const { userId } = req.params;

    const database = await getDb();

    // Get user info
    const userStmt = database.prepare('SELECT * FROM users WHERE id = ?');
    userStmt.bind([userId]);
    userStmt.step();
    const user = userStmt.getAsObject();
    userStmt.free();

    if (!user.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get check-in stats
    const statsStmt = database.prepare(`
      SELECT
        COUNT(*) as total_checkins,
        MIN(checked_in_at) as first_checkin,
        MAX(checked_in_at) as last_checkin
      FROM check_ins
      WHERE user_id = ?
    `);
    statsStmt.bind([userId]);
    statsStmt.step();
    const stats = statsStmt.getAsObject();
    statsStmt.free();

    // Get mood distribution
    const moodStmt = database.prepare(`
      SELECT mood, COUNT(*) as count
      FROM check_ins
      WHERE user_id = ? AND mood IS NOT NULL
      GROUP BY mood
      ORDER BY count DESC
    `);
    moodStmt.bind([userId]);
    const moods = [];
    while (moodStmt.step()) {
      moods.push(moodStmt.getAsObject());
    }
    moodStmt.free();

    // Build summary text
    const lines = [
      'Still Here - Account Summary',
      '============================',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      'ACCOUNT INFO',
      '------------',
      `Name: ${user.name || 'Not set'}`,
      `Member since: ${user.created_at || 'Unknown'}`,
      `Current streak: ${user.streak || 0} days`,
      '',
      'CHECK-IN STATS',
      '--------------',
      `Total check-ins: ${stats.total_checkins || 0}`,
      `First check-in: ${stats.first_checkin || 'Never'}`,
      `Last check-in: ${stats.last_checkin || 'Never'}`,
      '',
      'MOOD DISTRIBUTION',
      '-----------------',
      ...moods.map(m => `${m.mood}: ${m.count}`),
      moods.length === 0 ? 'No mood data recorded' : '',
      '',
      'EMERGENCY CONTACTS',
      '------------------',
      `Primary: ${user.contact_name || 'Not set'} (${user.contact_email || 'No email'})`,
    ];

    const summary = lines.join('\n');

    // Set headers for file download
    const filename = `stillhere-summary-${new Date().toISOString().split('T')[0]}.txt`;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(summary);

  } catch (error) {
    console.error('Error exporting summary:', error);
    res.status(500).json({ error: 'Failed to export summary' });
  }
});

// Helper to escape CSV fields
function escapeCsvField(field) {
  if (!field) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default router;
