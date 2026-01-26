import initSqlJs from 'sql.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(__dirname, 'stillhere.db');

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
  // New columns for SMS check-in
  if (!userColumns.has('phone_number')) {
    database.run('ALTER TABLE users ADD COLUMN phone_number TEXT');
  }
  if (!userColumns.has('sms_checkin_enabled')) {
    database.run('ALTER TABLE users ADD COLUMN sms_checkin_enabled INTEGER DEFAULT 0');
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

  // Migrate existing contact data to emergency_contacts table (if not already migrated)
  migrateExistingContacts(database);
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

  db.run(`CREATE INDEX IF NOT EXISTS idx_users_last_check_in ON users(last_check_in)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_family_shares_token ON family_shares(share_token)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_family_shares_user_id ON family_shares(user_id)`);

  // Feature 1: Emergency Contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      alert_preference TEXT DEFAULT 'email',
      priority INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id)`);

  // Feature 3: API Keys table for Smart Home Integration
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      api_key TEXT UNIQUE NOT NULL,
      label TEXT,
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key)`);

  // Feature 3: External check-ins audit log
  db.run(`
    CREATE TABLE IF NOT EXISTS external_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      api_key_id INTEGER,
      source TEXT,
      ip_address TEXT,
      checked_in_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_external_checkins_user_id ON external_checkins(user_id)`);

  // Run migrations for existing databases
  runMigrations(db);

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

  database.run(`
    INSERT INTO users (id, name, contact_name, contact_email, pet_name, pet_notes, pet_emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [user.id, user.name, user.contactName, user.contactEmail, user.petName || null, user.petNotes || null, user.petEmoji || null]);

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
    checkInWindowStart: row.check_in_window_start,
    checkInWindowEnd: row.check_in_window_end,
    timezone: row.timezone,
    alertPreference: row.alert_preference,
    locationSharingEnabled: !!row.location_sharing_enabled,
    proofOfLifeEnabled: !!row.proof_of_life_enabled,
    phoneNumber: row.phone_number,
    smsCheckinEnabled: !!row.sms_checkin_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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
  if (updates.phoneNumber !== undefined) {
    fields.push('phone_number = ?');
    values.push(updates.phoneNumber);
  }
  if (updates.smsCheckinEnabled !== undefined) {
    fields.push('sms_checkin_enabled = ?');
    values.push(updates.smsCheckinEnabled ? 1 : 0);
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

  // Check if already checked in today
  if (lastCheckIn && isSameDay(lastCheckIn, now)) {
    return { alreadyCheckedIn: true, user };
  }

  // Calculate new streak
  let newStreak;
  if (!lastCheckIn) {
    newStreak = 1;
  } else if (isYesterday(lastCheckIn)) {
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
      timezone: row.timezone,
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

// Helper functions
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

// Migrate existing contact data from users table to emergency_contacts table
const migrateExistingContacts = (database) => {
  // Check if there are users with contact_email that don't have emergency contacts
  const stmt = database.prepare(`
    SELECT u.id, u.contact_name, u.contact_email, u.contact_phone, u.alert_preference
    FROM users u
    WHERE u.contact_email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM emergency_contacts ec WHERE ec.user_id = u.id
    )
  `);

  const usersToMigrate = [];
  while (stmt.step()) {
    usersToMigrate.push(stmt.getAsObject());
  }
  stmt.free();

  // Migrate each user's contact
  for (const user of usersToMigrate) {
    if (user.contact_email) {
      database.run(`
        INSERT INTO emergency_contacts (user_id, name, email, phone, alert_preference, priority, is_active)
        VALUES (?, ?, ?, ?, ?, 1, 1)
      `, [
        user.id,
        user.contact_name || 'Emergency Contact',
        user.contact_email,
        user.contact_phone || null,
        user.alert_preference || 'email'
      ]);
      console.log(`[Migration] Migrated contact for user ${user.id}`);
    }
  }
};

// ==========================================
// Feature 1: Emergency Contacts CRUD
// ==========================================

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
      createdAt: row.created_at
    });
  }
  stmt.free();

  return contacts;
};

export const createEmergencyContact = async (userId, contact) => {
  const database = await getDb();

  // Check if user already has 5 contacts
  const countStmt = database.prepare(
    'SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = ? AND is_active = 1'
  );
  countStmt.bind([userId]);
  countStmt.step();
  const count = countStmt.getAsObject().count;
  countStmt.free();

  if (count >= 5) {
    throw new Error('Maximum of 5 emergency contacts allowed');
  }

  // Get next priority
  const priorityStmt = database.prepare(
    'SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM emergency_contacts WHERE user_id = ?'
  );
  priorityStmt.bind([userId]);
  priorityStmt.step();
  const nextPriority = priorityStmt.getAsObject().next_priority;
  priorityStmt.free();

  database.run(`
    INSERT INTO emergency_contacts (user_id, name, email, phone, alert_preference, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    userId,
    contact.name,
    contact.email || null,
    contact.phone || null,
    contact.alertPreference || 'email',
    nextPriority
  ]);

  saveDb();

  // Get the inserted contact
  const idStmt = database.prepare('SELECT last_insert_rowid() as id');
  idStmt.step();
  const newId = idStmt.getAsObject().id;
  idStmt.free();

  return getEmergencyContactById(newId);
};

export const getEmergencyContactById = async (contactId) => {
  const database = await getDb();
  const stmt = database.prepare('SELECT * FROM emergency_contacts WHERE id = ?');
  stmt.bind([contactId]);

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
    createdAt: row.created_at
  };
};

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

  if (fields.length === 0) return getEmergencyContactById(contactId);

  values.push(contactId, userId);

  database.run(
    `UPDATE emergency_contacts SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  saveDb();

  return getEmergencyContactById(contactId);
};

export const deleteEmergencyContact = async (contactId, userId) => {
  const database = await getDb();

  // Soft delete
  database.run(
    'UPDATE emergency_contacts SET is_active = 0 WHERE id = ? AND user_id = ?',
    [contactId, userId]
  );
  saveDb();

  return { success: true };
};

// ==========================================
// Feature 2: SMS Check-in User Lookup
// ==========================================

export const getUserByPhoneNumber = async (phoneNumber) => {
  const database = await getDb();

  // Normalize phone number - strip all non-digits
  const normalized = phoneNumber.replace(/\D/g, '');

  // Try to match with various formats
  const stmt = database.prepare(`
    SELECT * FROM users
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone_number, '+', ''), '-', ''), ' ', ''), '(', '') LIKE ?
    AND sms_checkin_enabled = 1
  `);
  stmt.bind(['%' + normalized.slice(-10)]); // Match last 10 digits

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
    phoneNumber: row.phone_number,
    smsCheckinEnabled: !!row.sms_checkin_enabled,
    petName: row.pet_name,
    petNotes: row.pet_notes,
    petEmoji: row.pet_emoji,
    streak: row.streak,
    lastCheckIn: row.last_check_in
  };
};

// ==========================================
// Feature 3: API Keys for Smart Home
// ==========================================

export const generateApiKey = async (userId, label = null) => {
  const database = await getDb();

  // Generate a secure 32-byte API key
  const apiKey = crypto.randomBytes(32).toString('hex');

  database.run(`
    INSERT INTO api_keys (user_id, api_key, label)
    VALUES (?, ?, ?)
  `, [userId, apiKey, label]);

  saveDb();

  // Get the inserted key
  const stmt = database.prepare('SELECT * FROM api_keys WHERE api_key = ?');
  stmt.bind([apiKey]);
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();

  return {
    id: row.id,
    userId: row.user_id,
    apiKey: row.api_key, // Only returned on creation!
    label: row.label,
    isActive: !!row.is_active,
    createdAt: row.created_at
  };
};

export const getApiKeys = async (userId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT id, user_id, label, is_active, last_used_at, created_at,
           SUBSTR(api_key, 1, 8) || '...' as key_preview
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
      userId: row.user_id,
      keyPreview: row.key_preview,
      label: row.label,
      isActive: !!row.is_active,
      lastUsedAt: row.last_used_at,
      createdAt: row.created_at
    });
  }
  stmt.free();

  return keys;
};

export const validateApiKey = async (apiKey) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT ak.*, u.id as uid, u.name
    FROM api_keys ak
    JOIN users u ON ak.user_id = u.id
    WHERE ak.api_key = ? AND ak.is_active = 1
  `);
  stmt.bind([apiKey]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  // Update last_used_at
  database.run(
    "UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?",
    [row.id]
  );
  saveDb();

  return {
    keyId: row.id,
    userId: row.user_id,
    userName: row.name,
    label: row.label
  };
};

export const revokeApiKey = async (keyId, userId) => {
  const database = await getDb();

  database.run(
    'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
    [keyId, userId]
  );
  saveDb();

  return { success: true };
};

export const logExternalCheckIn = async (userId, apiKeyId, source, ipAddress) => {
  const database = await getDb();

  database.run(`
    INSERT INTO external_checkins (user_id, api_key_id, source, ip_address)
    VALUES (?, ?, ?, ?)
  `, [userId, apiKeyId, source, ipAddress]);

  saveDb();
};

export const getLastExternalCheckIn = async (apiKeyId) => {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT checked_in_at FROM external_checkins
    WHERE api_key_id = ?
    ORDER BY checked_in_at DESC
    LIMIT 1
  `);
  stmt.bind([apiKeyId]);

  if (!stmt.step()) {
    stmt.free();
    return null;
  }

  const row = stmt.getAsObject();
  stmt.free();

  return row.checked_in_at;
};

// Initialize on import
initDb().catch(console.error);

export default { getDb, saveDb };
