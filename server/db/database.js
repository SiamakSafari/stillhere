import initSqlJs from 'sql.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import config from '../config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = config.databasePath.startsWith('.') 
  ? join(__dirname, '..', config.databasePath)
  : config.databasePath;

// Ensure db directory exists
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

let db = null;

// Run database migrations
const runMigrations = (database) => {
  // Get existing columns for users table
  const userColumns = new Set();
  const userPragma = database.exec("PRAGMA table_info(users)");
  if (userPragma.length > 0) {
    userPragma[0].values.forEach(row => userColumns.add(row[1]));
  }

  // Add new user columns if they don't exist
  if (!userColumns.has('contact_phone')) {
    database.run('ALTER TABLE users ADD COLUMN contact_phone TEXT');
  }
  if (!userColumns.has('check_in_window_start')) {
    database.run('ALTER TABLE users ADD COLUMN check_in_window_start TEXT');
  }
  if (!userColumns.has('check_in_window_end')) {
    database.run('ALTER TABLE users ADD COLUMN check_in_window_end TEXT');
  }
  if (!userColumns.has('timezone')) {
    database.run("ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'UTC'");
  }
  if (!userColumns.has('alert_preference')) {
    database.run("ALTER TABLE users ADD COLUMN alert_preference TEXT DEFAULT 'email'");
  }
  if (!userColumns.has('location_sharing_enabled')) {
    database.run('ALTER TABLE users ADD COLUMN location_sharing_enabled INTEGER DEFAULT 0');
  }
  if (!userColumns.has('proof_of_life_enabled')) {
    database.run('ALTER TABLE users ADD COLUMN proof_of_life_enabled INTEGER DEFAULT 0');
  }
  if (!userColumns.has('vet_name')) {
    database.run('ALTER TABLE users ADD COLUMN vet_name TEXT');
  }
  if (!userColumns.has('vet_phone')) {
    database.run('ALTER TABLE users ADD COLUMN vet_phone TEXT');
  }
  if (!userColumns.has('auth_token')) {
    database.run('ALTER TABLE users ADD COLUMN auth_token TEXT');
  }
  if (!userColumns.has('snooze_until')) {
    database.run('ALTER TABLE users ADD COLUMN snooze_until TEXT');
  }

  // Get existing columns for check_ins table
  const checkInColumns = new Set();
  const checkInPragma = database.exec("PRAGMA table_info(check_ins)");
  if (checkInPragma.length > 0) {
    checkInPragma[0].values.forEach(row => checkInColumns.add(row[1]));
  }

  // Add new check-in columns if they don't exist
  if (!checkInColumns.has('mood')) {
    database.run('ALTER TABLE check_ins ADD COLUMN mood TEXT');
  }
  if (!checkInColumns.has('note')) {
    database.run('ALTER TABLE check_ins ADD COLUMN note TEXT');
  }
  if (!checkInColumns.has('latitude')) {
    database.run('ALTER TABLE check_ins ADD COLUMN latitude REAL');
  }
  if (!checkInColumns.has('longitude')) {
    database.run('ALTER TABLE check_ins ADD COLUMN longitude REAL');
  }
};

// Create emergency_contacts table
const createEmergencyContactsTable = (database) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      alert_preference TEXT DEFAULT 'email',
      priority INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      email_verified INTEGER DEFAULT 0,
      email_verification_token TEXT,
      email_verification_sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_verification_token ON emergency_contacts(email_verification_token)`);
};

// Run migrations for emergency_contacts table
const migrateEmergencyContacts = (database) => {
  const columns = new Set();
  const pragma = database.exec("PRAGMA table_info(emergency_contacts)");
  if (pragma.length > 0) {
    pragma[0].values.forEach(row => columns.add(row[1]));
  }

  if (!columns.has('email_verified')) {
    database.run('ALTER TABLE emergency_contacts ADD COLUMN email_verified INTEGER DEFAULT 0');
  }
  if (!columns.has('email_verification_token')) {
    database.run('ALTER TABLE emergency_contacts ADD COLUMN email_verification_token TEXT');
  }
  if (!columns.has('email_verification_sent_at')) {
    database.run('ALTER TABLE emergency_contacts ADD COLUMN email_verification_sent_at TEXT');
  }
};

// Create api_keys table
const createApiKeysTable = (database) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      label TEXT,
      last_used_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`);
  database.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash)`);
};

// Create external_checkins audit table
const createExternalCheckinsTable = (database) => {
  database.run(`
    CREATE TABLE IF NOT EXISTS external_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      key_id INTEGER NOT NULL,
      source TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (key_id) REFERENCES api_keys(id)
    )
  `);
  database.run(`CREATE INDEX IF NOT EXISTS idx_external_checkins_key_id ON external_checkins(key_id)`);
};

// Initialize database
const initDb = async () => {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      pet_name TEXT,
      pet_notes TEXT,
      pet_emoji TEXT,
      streak INTEGER DEFAULT 0,
      last_check_in TEXT,
      vacation_until TEXT,
      auth_token TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      checked_in_at TEXT DEFAULT (datetime('now')),
      mood TEXT,
      note TEXT,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS family_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      share_token TEXT UNIQUE NOT NULL,
      label TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Activities table for persistent storage (fixes in-memory issue)
  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT,
      emoji TEXT,
      label TEXT,
      duration_minutes INTEGER,
      share_location INTEGER DEFAULT 0,
      details TEXT,
      latitude REAL,
      longitude REAL,
      started_at TEXT NOT NULL,
      expected_end_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Run migrations for existing databases BEFORE creating indexes on migrated columns
  runMigrations(db);

  // Create emergency contacts table
  createEmergencyContactsTable(db);

  // Run migrations for emergency contacts (add new columns)
  migrateEmergencyContacts(db);

  // Create API keys table
  createApiKeysTable(db);

  // Create external check-ins audit table
  createExternalCheckinsTable(db);

  // Create indexes (after migrations have added any needed columns)
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_last_check_in ON users(last_check_in)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_users_auth_token ON users(auth_token)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_family_shares_token ON family_shares(share_token)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_family_shares_user_id ON family_shares(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status)`);

  saveDb();
  return db;
};

// Save database to file
export const saveDb = () => {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
};

// Get database instance
export const getDb = async () => {
  if (!db) {
    await initDb();
  }
  return db;
};

// User operations
export const createUser = async (user) => {
  const database = await getDb();

  // Generate auth token for the user
  const crypto = await import('crypto');
  const authToken = crypto.randomBytes(32).toString('hex');

  database.run(`
    INSERT INTO users (id, name, contact_name, contact_email, pet_name, pet_notes, pet_emoji, auth_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [user.id, user.name, user.contactName, user.contactEmail, user.petName || null, user.petNotes || null, user.petEmoji || null, authToken]);

  saveDb();
  return getUser(user.id);
};

export const getUser = async (id) => {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return {
    id: row.id,
    name: row.name,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    petName: row.pet_name,
    petNotes: row.pet_notes,
    petEmoji: row.pet_emoji,
    vetName: row.vet_name,
    vetPhone: row.vet_phone,
    streak: row.streak,
    lastCheckIn: row.last_check_in,
    vacationUntil: row.vacation_until,
    snoozeUntil: row.snooze_until,
    checkInWindowStart: row.check_in_window_start,
    checkInWindowEnd: row.check_in_window_end,
    timezone: row.timezone || 'UTC',
    alertPreference: row.alert_preference,
    locationSharingEnabled: !!row.location_sharing_enabled,
    proofOfLifeEnabled: !!row.proof_of_life_enabled,
    authToken: row.auth_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Get user by auth token
export const getUserByAuthToken = async (token) => {
  if (!token) return null;

  const database = await getDb();
  const stmt = database.prepare('SELECT id FROM users WHERE auth_token = ?');
  stmt.bind([token]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return getUser(row.id);
};

// Get user by phone number (for SMS check-in)
export const getUserByPhoneNumber = async (phone) => {
  if (!phone) return null;

  // Normalize phone number (remove spaces, dashes, etc.)
  const normalizedPhone = phone.replace(/[\s\-()]/g, '');

  const database = await getDb();
  const stmt = database.prepare('SELECT id FROM users WHERE REPLACE(REPLACE(REPLACE(contact_phone, " ", ""), "-", ""), "(", "") LIKE ?');
  stmt.bind([`%${normalizedPhone.slice(-10)}`]); // Match last 10 digits

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return getUser(row.id);
};

export const updateUser = async (id, updates) => {
  const database = await getDb();
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.contactName !== undefined) {
    fields.push('contact_name = ?');
    values.push(updates.contactName);
  }
  if (updates.contactEmail !== undefined) {
    fields.push('contact_email = ?');
    values.push(updates.contactEmail);
  }
  if (updates.petName !== undefined) {
    fields.push('pet_name = ?');
    values.push(updates.petName);
  }
  if (updates.petNotes !== undefined) {
    fields.push('pet_notes = ?');
    values.push(updates.petNotes);
  }
  if (updates.petEmoji !== undefined) {
    fields.push('pet_emoji = ?');
    values.push(updates.petEmoji);
  }
  if (updates.streak !== undefined) {
    fields.push('streak = ?');
    values.push(updates.streak);
  }
  if (updates.lastCheckIn !== undefined) {
    fields.push('last_check_in = ?');
    values.push(updates.lastCheckIn);
  }
  if (updates.vacationUntil !== undefined) {
    fields.push('vacation_until = ?');
    values.push(updates.vacationUntil);
  }
  if (updates.snoozeUntil !== undefined) {
    fields.push('snooze_until = ?');
    values.push(updates.snoozeUntil);
  }
  if (updates.contactPhone !== undefined) {
    fields.push('contact_phone = ?');
    values.push(updates.contactPhone);
  }
  if (updates.checkInWindowStart !== undefined) {
    fields.push('check_in_window_start = ?');
    values.push(updates.checkInWindowStart);
  }
  if (updates.checkInWindowEnd !== undefined) {
    fields.push('check_in_window_end = ?');
    values.push(updates.checkInWindowEnd);
  }
  if (updates.timezone !== undefined) {
    fields.push('timezone = ?');
    values.push(updates.timezone);
  }
  if (updates.alertPreference !== undefined) {
    fields.push('alert_preference = ?');
    values.push(updates.alertPreference);
  }
  if (updates.locationSharingEnabled !== undefined) {
    fields.push('location_sharing_enabled = ?');
    values.push(updates.locationSharingEnabled ? 1 : 0);
  }
  if (updates.proofOfLifeEnabled !== undefined) {
    fields.push('proof_of_life_enabled = ?');
    values.push(updates.proofOfLifeEnabled ? 1 : 0);
  }
  if (updates.vetName !== undefined) {
    fields.push('vet_name = ?');
    values.push(updates.vetName);
  }
  if (updates.vetPhone !== undefined) {
    fields.push('vet_phone = ?');
    values.push(updates.vetPhone);
  }

  if (fields.length === 0) return getUser(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  database.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();

  return getUser(id);
};

// Check-in operations
export const recordCheckIn = async (userId, { mood, note, latitude, longitude } = {}) => {
  const user = await getUser(userId);
  if (!user) return null;

  const now = new Date();
  const lastCheckIn = user.lastCheckIn ? new Date(user.lastCheckIn) : null;

  // Check if already checked in today (timezone-aware)
  if (lastCheckIn && isSameDayInTimezone(lastCheckIn, now, user.timezone)) {
    return { alreadyCheckedIn: true, user };
  }

  // Calculate new streak (timezone-aware)
  let newStreak;
  if (!lastCheckIn) {
    newStreak = 1;
  } else if (isYesterdayInTimezone(lastCheckIn, now, user.timezone)) {
    newStreak = user.streak + 1;
  } else {
    newStreak = 1;
  }

  const database = await getDb();

  // Record check-in with mood, note, and location
  database.run(
    `INSERT INTO check_ins (user_id, mood, note, latitude, longitude) VALUES (?, ?, ?, ?, ?)`,
    [userId, mood || null, note || null, latitude || null, longitude || null]
  );

  // Update user
  database.run(`
    UPDATE users SET
      streak = ?,
      last_check_in = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `, [newStreak, userId]);

  saveDb();

  return { alreadyCheckedIn: false, user: await getUser(userId) };
};

// Get users who haven't checked in
export const getUsersNeedingReminder = async (hours = 24) => {
  const database = await getDb();

  const stmt = database.prepare(`
    SELECT * FROM users
    WHERE (
      last_check_in IS NULL
      OR datetime(last_check_in) < datetime('now', '-' || ? || ' hours')
    )
    AND (
      vacation_until IS NULL
      OR datetime(vacation_until) < datetime('now')
    )
    AND (
      snooze_until IS NULL
      OR datetime(snooze_until) < datetime('now')
    )
  `);
  stmt.bind([hours]);

  const users = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    users.push({
      id: row.id,
      name: row.name,
      contactName: row.contact_name,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      petName: row.pet_name,
      petNotes: row.pet_notes,
      petEmoji: row.pet_emoji,
      streak: row.streak,
      lastCheckIn: row.last_check_in,
      vacationUntil: row.vacation_until,
      checkInWindowStart: row.check_in_window_start,
      checkInWindowEnd: row.check_in_window_end,
      timezone: row.timezone || 'UTC',
      alertPreference: row.alert_preference,
      locationSharingEnabled: !!row.location_sharing_enabled,
      proofOfLifeEnabled: !!row.proof_of_life_enabled,
      vetName: row.vet_name,
      vetPhone: row.vet_phone
    });
  }
  stmt.free();

  return users;
};

// Get last check-in with location for a user
export const getLastCheckInLocation = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT latitude, longitude, checked_in_at
    FROM check_ins
    WHERE user_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY checked_in_at DESC
    LIMIT 1
  `);
  stmt.bind([userId]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return {
    latitude: row.latitude,
    longitude: row.longitude,
    timestamp: row.checked_in_at
  };
};

// Timezone-aware date helpers
function getDateInTimezone(date, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().split('T')[0];
  }
}

function isSameDayInTimezone(date1, date2, timezone) {
  return getDateInTimezone(date1, timezone) === getDateInTimezone(date2, timezone);
}

function isYesterdayInTimezone(checkDate, nowDate, timezone) {
  const checkDateStr = getDateInTimezone(checkDate, timezone);
  
  // Get yesterday in the user's timezone
  const yesterday = new Date(nowDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getDateInTimezone(yesterday, timezone);
  
  return checkDateStr === yesterdayStr;
}

// Legacy helpers (kept for backward compatibility but not recommended)
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

// Family share operations
export const createFamilyShare = async (userId, label = null, expiresAt = null) => {
  const database = await getDb();

  // Generate 64-character cryptographically secure token
  const crypto = await import('crypto');
  const shareToken = crypto.randomBytes(32).toString('hex');

  database.run(`
    INSERT INTO family_shares (user_id, share_token, label, expires_at)
    VALUES (?, ?, ?, ?)
  `, [userId, shareToken, label, expiresAt]);

  saveDb();

  return getFamilyShareByToken(shareToken);
};

export const getFamilyShareByToken = async (token) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM family_shares WHERE share_token = ? AND is_active = 1
  `);
  stmt.bind([token]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  // Check if expired
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    shareToken: row.share_token,
    label: row.label,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isActive: !!row.is_active
  };
};

export const getFamilySharesByUser = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM family_shares WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `);
  stmt.bind([userId]);

  const shares = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    shares.push({
      id: row.id,
      userId: row.user_id,
      shareToken: row.share_token,
      label: row.label,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      isActive: !!row.is_active
    });
  }
  stmt.free();

  return shares;
};

export const deleteFamilyShare = async (shareId, userId) => {
  const database = await getDb();

  // Soft delete - mark as inactive, and verify ownership
  database.run(`
    UPDATE family_shares SET is_active = 0 WHERE id = ? AND user_id = ?
  `, [shareId, userId]);

  saveDb();

  return { success: true };
};

// Get check-in history for a user (for family dashboard)
export const getCheckInHistory = async (userId, days = 7) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT checked_in_at FROM check_ins
    WHERE user_id = ?
    AND datetime(checked_in_at) >= datetime('now', '-' || ? || ' days')
    ORDER BY checked_in_at DESC
  `);
  stmt.bind([userId, days]);

  const checkIns = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    checkIns.push(row.checked_in_at);
  }
  stmt.free();

  return checkIns;
};

// Activity operations (persistent storage)
export const createActivity = async (activity) => {
  const database = await getDb();
  
  // Cancel any existing active activity for this user
  database.run(
    `UPDATE activities SET status = 'cancelled' WHERE user_id = ? AND status = 'active'`,
    [activity.userId]
  );

  database.run(`
    INSERT INTO activities (id, user_id, type, emoji, label, duration_minutes, share_location, details, latitude, longitude, started_at, expected_end_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `, [
    activity.id,
    activity.userId,
    activity.type || null,
    activity.emoji || null,
    activity.label || null,
    activity.durationMinutes || null,
    activity.shareLocation ? 1 : 0,
    activity.details || null,
    activity.latitude || null,
    activity.longitude || null,
    activity.startedAt,
    activity.expectedEndAt
  ]);

  saveDb();
  return getActivity(activity.id);
};

export const getActivity = async (id) => {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM activities WHERE id = ?');
  stmt.bind([id]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return rowToActivity(row);
};

export const getActiveActivityByUser = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM activities WHERE user_id = ? AND status = 'active' LIMIT 1
  `);
  stmt.bind([userId]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return rowToActivity(row);
};

export const updateActivity = async (id, updates) => {
  const database = await getDb();
  const fields = [];
  const values = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.completedAt !== undefined) {
    fields.push('completed_at = ?');
    values.push(updates.completedAt);
  }
  if (updates.expectedEndAt !== undefined) {
    fields.push('expected_end_at = ?');
    values.push(updates.expectedEndAt);
  }
  if (updates.durationMinutes !== undefined) {
    fields.push('duration_minutes = ?');
    values.push(updates.durationMinutes);
  }

  if (fields.length === 0) return getActivity(id);

  values.push(id);
  database.run(`UPDATE activities SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDb();

  return getActivity(id);
};

export const getOverdueActivities = async () => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM activities 
    WHERE status = 'active' 
    AND datetime(expected_end_at) < datetime('now', '-5 minutes')
  `);

  const activities = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    activities.push(rowToActivity(row));
  }
  stmt.free();

  return activities;
};

function rowToActivity(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    emoji: row.emoji,
    label: row.label,
    durationMinutes: row.duration_minutes,
    shareLocation: !!row.share_location,
    details: row.details,
    latitude: row.latitude,
    longitude: row.longitude,
    startedAt: row.started_at,
    expectedEndAt: row.expected_end_at,
    completedAt: row.completed_at,
    status: row.status,
    createdAt: row.created_at
  };
}

// Prune old check-ins (data retention)
export const pruneOldCheckIns = async (days = config.maxCheckInHistoryDays) => {
  const database = await getDb();
  database.run(`
    DELETE FROM check_ins 
    WHERE datetime(checked_in_at) < datetime('now', '-' || ? || ' days')
  `, [days]);
  saveDb();
};

// =====================================================
// EMERGENCY CONTACTS
// =====================================================

// Get all emergency contacts for a user
export const getEmergencyContacts = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM emergency_contacts
    WHERE user_id = ? AND is_active = 1
    ORDER BY priority ASC, created_at ASC
  `);
  stmt.bind([userId]);

  const contacts = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    contacts.push({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      alertPreference: row.alert_preference,
      priority: row.priority,
      isActive: !!row.is_active,
      emailVerified: !!row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
  stmt.free();

  return contacts;
};

// Get a single emergency contact by ID
export const getEmergencyContact = async (contactId, userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM emergency_contacts
    WHERE id = ? AND user_id = ? AND is_active = 1
  `);
  stmt.bind([contactId, userId]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    alertPreference: row.alert_preference,
    priority: row.priority,
    isActive: !!row.is_active,
    emailVerified: !!row.email_verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Get contact by verification token
export const getContactByVerificationToken = async (token) => {
  if (!token) return null;

  const database = await getDb();
  const stmt = database.prepare(`
    SELECT * FROM emergency_contacts
    WHERE email_verification_token = ? AND is_active = 1
  `);
  stmt.bind([token]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    emailVerified: !!row.email_verified,
    emailVerificationSentAt: row.email_verification_sent_at
  };
};

// Set email verification token for a contact
export const setEmailVerificationToken = async (contactId, token) => {
  const database = await getDb();
  database.run(
    `UPDATE emergency_contacts SET 
      email_verification_token = ?, 
      email_verification_sent_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?`,
    [token, contactId]
  );
  saveDb();
};

// Mark email as verified
export const markEmailVerified = async (contactId) => {
  const database = await getDb();
  database.run(
    `UPDATE emergency_contacts SET 
      email_verified = 1, 
      email_verification_token = NULL,
      updated_at = datetime('now')
    WHERE id = ?`,
    [contactId]
  );
  saveDb();
};

// Create a new emergency contact
export const createEmergencyContact = async (userId, contact) => {
  const database = await getDb();

  // Check if user already has maximum contacts (limit to 5)
  const existingContacts = await getEmergencyContacts(userId);
  if (existingContacts.length >= 5) {
    throw new Error('Maximum of 5 emergency contacts allowed');
  }

  // Determine next priority
  const nextPriority = existingContacts.length + 1;

  database.run(`
    INSERT INTO emergency_contacts (user_id, name, email, phone, alert_preference, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    userId,
    contact.name,
    contact.email || null,
    contact.phone || null,
    contact.alertPreference || 'email',
    contact.priority || nextPriority
  ]);

  saveDb();

  // Get the created contact
  const stmt = database.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const { id } = stmt.getAsObject();
  stmt.free();

  return getEmergencyContact(id, userId);
};

// Update an emergency contact
export const updateEmergencyContact = async (contactId, userId, updates) => {
  const database = await getDb();
  const fields = [];
  const values = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.phone !== undefined) {
    fields.push('phone = ?');
    values.push(updates.phone);
  }
  if (updates.alertPreference !== undefined) {
    fields.push('alert_preference = ?');
    values.push(updates.alertPreference);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (fields.length === 0) return getEmergencyContact(contactId, userId);

  fields.push("updated_at = datetime('now')");
  values.push(contactId, userId);

  database.run(
    `UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  saveDb();

  return getEmergencyContact(contactId, userId);
};

// Delete (soft delete) an emergency contact
export const deleteEmergencyContact = async (contactId, userId) => {
  const database = await getDb();
  database.run(
    `UPDATE emergency_contacts SET is_active = 0, updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    [contactId, userId]
  );
  saveDb();
  return { success: true };
};

// =====================================================
// API KEYS
// =====================================================

// Hash an API key using SHA-256
const hashApiKey = async (key) => {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Generate a new API key
export const generateApiKey = async (userId, label = null) => {
  const database = await getDb();
  const crypto = await import('crypto');

  // Generate a random 32-byte key
  const rawKey = crypto.randomBytes(32).toString('hex');
  const keyPrefix = rawKey.substring(0, 8); // First 8 chars for display
  const keyHash = await hashApiKey(rawKey);

  database.run(`
    INSERT INTO api_keys (user_id, key_hash, key_prefix, label)
    VALUES (?, ?, ?, ?)
  `, [userId, keyHash, keyPrefix, label]);

  saveDb();

  // Get the created key ID
  const stmt = database.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const { id } = stmt.getAsObject();
  stmt.free();

  // Return the full key (only shown once!)
  return {
    id,
    key: rawKey,
    prefix: keyPrefix,
    label,
    createdAt: new Date().toISOString()
  };
};

// Validate an API key and return user info if valid
export const validateApiKey = async (key) => {
  const database = await getDb();
  const keyHash = await hashApiKey(key);

  const stmt = database.prepare(`
    SELECT ak.id, ak.user_id, ak.label, u.name as user_name
    FROM api_keys ak
    JOIN users u ON ak.user_id = u.id
    WHERE ak.key_hash = ? AND ak.is_active = 1
  `);
  stmt.bind([keyHash]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  // Update last_used_at
  database.run(
    `UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`,
    [row.id]
  );
  saveDb();

  return {
    keyId: row.id,
    userId: row.user_id,
    userName: row.user_name,
    label: row.label
  };
};

// Get all API keys for a user (without the actual key)
export const getApiKeys = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT id, key_prefix, label, last_used_at, created_at
    FROM api_keys
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `);
  stmt.bind([userId]);

  const keys = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    keys.push({
      id: row.id,
      prefix: row.key_prefix,
      label: row.label,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at
    });
  }
  stmt.free();

  return keys;
};

// Revoke an API key
export const revokeApiKey = async (keyId, userId) => {
  const database = await getDb();
  database.run(
    `UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?`,
    [keyId, userId]
  );
  saveDb();
  return { success: true };
};

// Log an external check-in
export const logExternalCheckIn = async (userId, keyId, source, ipAddress) => {
  const database = await getDb();
  database.run(`
    INSERT INTO external_checkins (user_id, key_id, source, ip_address)
    VALUES (?, ?, ?, ?)
  `, [userId, keyId, source, ipAddress]);
  saveDb();
};

// Get last external check-in for rate limiting
export const getLastExternalCheckIn = async (keyId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT created_at FROM external_checkins
    WHERE key_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  stmt.bind([keyId]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return row.created_at;
};

// Initialize on import
initDb().catch(console.error);

export default { getDb, saveDb };
