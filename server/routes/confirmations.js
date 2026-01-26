import { Router } from 'express';
import { getDb, saveDb, getUser } from '../db/database.js';
import crypto from 'crypto';
import config from '../config.js';

const router = Router();

// Initialize confirmation table
export const initConfirmationsTable = async () => {
  const db = await getDb();
  db.run(`
    CREATE TABLE IF NOT EXISTS alert_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      confirmation_token TEXT UNIQUE NOT NULL,
      sent_at TEXT DEFAULT (datetime('now')),
      confirmed_at TEXT,
      alert_type TEXT DEFAULT 'email',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_confirmations_token ON alert_confirmations(confirmation_token)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_confirmations_user_id ON alert_confirmations(user_id)`);
  saveDb();
};

// Generate a new confirmation token
export const createConfirmationToken = async (userId, alertType = 'email') => {
  const db = await getDb();
  const token = crypto.randomBytes(32).toString('hex');

  db.run(
    `INSERT INTO alert_confirmations (user_id, confirmation_token, alert_type) VALUES (?, ?, ?)`,
    [userId, token, alertType]
  );
  saveDb();

  return token;
};

// Get confirmation URL
export const getConfirmationUrl = (token) => {
  return `${config.appUrl}/api/confirmations/confirm/${token}`;
};

// Confirm alert was received (returns HTML page)
router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token format
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).send(getErrorPage('Invalid confirmation link format.'));
    }

    const db = await getDb();

    // Find the confirmation
    const stmt = db.prepare(`
      SELECT ac.*, u.name as user_name
      FROM alert_confirmations ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.confirmation_token = ?
    `);
    stmt.bind([token]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).send(getErrorPage('Invalid or expired confirmation link.'));
    }

    const confirmation = stmt.getAsObject();
    stmt.free();

    // Check if already confirmed
    if (confirmation.confirmed_at) {
      return res.send(getSuccessPage(confirmation.user_name, true));
    }

    // Mark as confirmed
    db.run(
      `UPDATE alert_confirmations SET confirmed_at = datetime('now') WHERE confirmation_token = ?`,
      [token]
    );
    saveDb();

    res.send(getSuccessPage(confirmation.user_name, false));
  } catch (err) {
    console.error('Error confirming alert:', err);
    res.status(500).send(getErrorPage('An error occurred. Please try again.'));
  }
});

// Get confirmation status for a user's most recent alert
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_UUID'
      });
    }

    const db = await getDb();

    const stmt = db.prepare(`
      SELECT * FROM alert_confirmations
      WHERE user_id = ?
      ORDER BY sent_at DESC
      LIMIT 1
    `);
    stmt.bind([userId]);

    if (!stmt.step()) {
      stmt.free();
      return res.json({ hasAlerts: false });
    }

    const confirmation = stmt.getAsObject();
    stmt.free();

    res.json({
      hasAlerts: true,
      lastAlert: {
        sentAt: confirmation.sent_at,
        confirmedAt: confirmation.confirmed_at,
        alertType: confirmation.alert_type
      }
    });
  } catch (err) {
    console.error('Error getting confirmation status:', err);
    res.status(500).json({ 
      error: 'Failed to get confirmation status',
      code: 'INTERNAL_ERROR'
    });
  }
});

// HTML templates for confirmation page
function getSuccessPage(userName, alreadyConfirmed) {
  const escapedName = escapeHtml(userName);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alert Confirmed - Still Here</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: #16213e;
          border-radius: 16px;
          padding: 40px;
          max-width: 400px;
          text-align: center;
          border: 1px solid #374151;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
        }
        h1 { color: #fff; margin-bottom: 16px; font-size: 24px; }
        p { color: #9ca3af; line-height: 1.6; margin-bottom: 16px; }
        .user-name { color: #4ade80; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✓</div>
        <h1>${alreadyConfirmed ? 'Already Confirmed' : 'Alert Confirmed!'}</h1>
        <p>
          ${alreadyConfirmed
            ? `You've already confirmed that you received the alert about <span class="user-name">${escapedName}</span>.`
            : `Thank you for confirming that you received the alert about <span class="user-name">${escapedName}</span>.`
          }
        </p>
        <p>
          This helps ensure ${escapedName} is safe and that the alert system is working properly.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getErrorPage(message) {
  const escapedMessage = escapeHtml(message);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error - Still Here</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: #16213e;
          border-radius: 16px;
          padding: 40px;
          max-width: 400px;
          text-align: center;
          border: 1px solid #374151;
        }
        .icon {
          width: 80px;
          height: 80px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 40px;
        }
        h1 { color: #fff; margin-bottom: 16px; font-size: 24px; }
        p { color: #9ca3af; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">!</div>
        <h1>Error</h1>
        <p>${escapedMessage}</p>
      </div>
    </body>
    </html>
  `;
}

// Simple HTML escape to prevent XSS
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

export default router;
