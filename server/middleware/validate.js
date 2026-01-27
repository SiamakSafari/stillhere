/**
 * Input validation middleware
 * Simple validation without external dependencies
 */

// Validation helpers
const isString = (val) => typeof val === 'string';
const isEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
const isUUID = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
const isHexToken = (val, length = 64) => new RegExp(`^[a-f0-9]{${length}}$`, 'i').test(val);
const isPhoneNumber = (val) => /^[+]?[\d\s\-()]{7,20}$/.test(val);
const isTimezone = (val) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: val });
    return true;
  } catch {
    return false;
  }
};
const isISO8601 = (val) => !isNaN(Date.parse(val));
const isTimeString = (val) => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val);

// Sanitize string (trim, limit length)
const sanitizeString = (val, maxLength = 1000) => {
  if (!isString(val)) return val;
  return val.trim().slice(0, maxLength);
};

// Standard error response
const validationError = (res, errors) => {
  return res.status(400).json({
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors
  });
};

/**
 * Validate user creation/update
 */
export const validateUser = (req, res, next) => {
  const errors = [];
  const { id, name, contactName, contactEmail, contactPhone, petName, petNotes, petEmoji, timezone } = req.body;

  // For creation, id is required
  if (req.method === 'POST') {
    if (!id) {
      errors.push({ field: 'id', message: 'User ID is required' });
    } else if (!isUUID(id)) {
      errors.push({ field: 'id', message: 'User ID must be a valid UUID' });
    }
    
    if (!name || !isString(name) || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (!contactName || !isString(contactName) || contactName.trim().length === 0) {
      errors.push({ field: 'contactName', message: 'Contact name is required' });
    }
    
    if (!contactEmail || !isEmail(contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Valid contact email is required' });
    }
  }

  // Optional field validations
  if (name !== undefined) {
    if (!isString(name) || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
    }
  }

  if (contactName !== undefined && contactName !== null) {
    if (!isString(contactName) || contactName.trim().length === 0) {
      errors.push({ field: 'contactName', message: 'Contact name must be a non-empty string' });
    } else if (contactName.length > 100) {
      errors.push({ field: 'contactName', message: 'Contact name must be 100 characters or less' });
    }
  }

  if (contactEmail !== undefined && contactEmail !== null) {
    if (!isEmail(contactEmail)) {
      errors.push({ field: 'contactEmail', message: 'Invalid email format' });
    }
  }

  if (contactPhone !== undefined && contactPhone !== null && contactPhone !== '') {
    if (!isPhoneNumber(contactPhone)) {
      errors.push({ field: 'contactPhone', message: 'Invalid phone number format' });
    }
  }

  if (petName !== undefined && petName !== null) {
    if (!isString(petName) || petName.length > 100) {
      errors.push({ field: 'petName', message: 'Pet name must be 100 characters or less' });
    }
  }

  if (petNotes !== undefined && petNotes !== null) {
    if (!isString(petNotes) || petNotes.length > 1000) {
      errors.push({ field: 'petNotes', message: 'Pet notes must be 1000 characters or less' });
    }
  }

  if (petEmoji !== undefined && petEmoji !== null) {
    if (!isString(petEmoji) || petEmoji.length > 10) {
      errors.push({ field: 'petEmoji', message: 'Pet emoji must be 10 characters or less' });
    }
  }

  if (timezone !== undefined && timezone !== null) {
    if (!isTimezone(timezone)) {
      errors.push({ field: 'timezone', message: 'Invalid timezone' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  // Sanitize inputs
  if (req.body.name) req.body.name = sanitizeString(req.body.name, 100);
  if (req.body.contactName) req.body.contactName = sanitizeString(req.body.contactName, 100);
  if (req.body.contactEmail) req.body.contactEmail = sanitizeString(req.body.contactEmail, 254);
  if (req.body.petName) req.body.petName = sanitizeString(req.body.petName, 100);
  if (req.body.petNotes) req.body.petNotes = sanitizeString(req.body.petNotes, 1000);
  if (req.body.petEmoji) req.body.petEmoji = sanitizeString(req.body.petEmoji, 10);

  next();
};

/**
 * Validate check-in request
 */
export const validateCheckIn = (req, res, next) => {
  const errors = [];
  const { userId, mood, note, latitude, longitude } = req.body;

  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!isUUID(userId)) {
    errors.push({ field: 'userId', message: 'User ID must be a valid UUID' });
  }

  if (mood !== undefined && mood !== null) {
    const validMoods = ['great', 'good', 'okay', 'meh', 'rough'];
    if (!validMoods.includes(mood)) {
      errors.push({ field: 'mood', message: 'Invalid mood value' });
    }
  }

  if (note !== undefined && note !== null) {
    if (!isString(note) || note.length > 500) {
      errors.push({ field: 'note', message: 'Note must be 500 characters or less' });
    }
  }

  if (latitude !== undefined && latitude !== null) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      errors.push({ field: 'latitude', message: 'Latitude must be between -90 and 90' });
    }
  }

  if (longitude !== undefined && longitude !== null) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      errors.push({ field: 'longitude', message: 'Longitude must be between -180 and 180' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  // Sanitize
  if (req.body.note) req.body.note = sanitizeString(req.body.note, 500);

  next();
};

/**
 * Validate vacation request
 */
export const validateVacation = (req, res, next) => {
  const errors = [];
  const { userId, vacationUntil } = req.body;

  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!isUUID(userId)) {
    errors.push({ field: 'userId', message: 'User ID must be a valid UUID' });
  }

  if (vacationUntil !== undefined && vacationUntil !== null) {
    if (!isISO8601(vacationUntil)) {
      errors.push({ field: 'vacationUntil', message: 'Invalid date format' });
    } else if (new Date(vacationUntil) < new Date()) {
      errors.push({ field: 'vacationUntil', message: 'Vacation end date must be in the future' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

/**
 * Validate activity request
 */
export const validateActivity = (req, res, next) => {
  const errors = [];
  const { userId, label, durationMinutes, startedAt, expectedEndAt, details } = req.body;

  if (!userId) {
    errors.push({ field: 'userId', message: 'User ID is required' });
  } else if (!isUUID(userId)) {
    errors.push({ field: 'userId', message: 'User ID must be a valid UUID' });
  }

  if (label !== undefined && label !== null) {
    if (!isString(label) || label.length > 100) {
      errors.push({ field: 'label', message: 'Label must be 100 characters or less' });
    }
  }

  if (durationMinutes !== undefined && durationMinutes !== null) {
    if (typeof durationMinutes !== 'number' || durationMinutes < 1 || durationMinutes > 1440) {
      errors.push({ field: 'durationMinutes', message: 'Duration must be between 1 and 1440 minutes' });
    }
  }

  if (startedAt !== undefined && !isISO8601(startedAt)) {
    errors.push({ field: 'startedAt', message: 'Invalid start date format' });
  }

  if (expectedEndAt !== undefined && !isISO8601(expectedEndAt)) {
    errors.push({ field: 'expectedEndAt', message: 'Invalid expected end date format' });
  }

  if (details !== undefined && details !== null) {
    if (!isString(details) || details.length > 1000) {
      errors.push({ field: 'details', message: 'Details must be 1000 characters or less' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  // Sanitize
  if (req.body.label) req.body.label = sanitizeString(req.body.label, 100);
  if (req.body.details) req.body.details = sanitizeString(req.body.details, 1000);

  next();
};

/**
 * Validate family share token
 */
export const validateShareToken = (req, res, next) => {
  const { token } = req.params;

  if (!token || !isHexToken(token, 64)) {
    return res.status(400).json({
      error: 'Invalid token format',
      code: 'INVALID_TOKEN_FORMAT'
    });
  }

  next();
};

/**
 * Validate UUID parameter
 */
export const validateUUIDParam = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    
    if (!value || !isUUID(value)) {
      return res.status(400).json({
        error: `Invalid ${paramName} format`,
        code: 'INVALID_UUID'
      });
    }

    next();
  };
};

/**
 * Validate emergency contact creation/update
 */
export const validateEmergencyContact = (req, res, next) => {
  const errors = [];
  const { name, email, phone, alertPreference, priority } = req.body;

  // For creation, name is required
  if (req.method === 'POST') {
    if (!name || !isString(name) || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Contact name is required' });
    }

    if (!email && !phone) {
      errors.push({ field: 'email', message: 'Either email or phone is required' });
    }
  }

  // Field validations
  if (name !== undefined && name !== null) {
    if (!isString(name) || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name must be a non-empty string' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
    }
  }

  if (email !== undefined && email !== null && email !== '') {
    if (!isEmail(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
  }

  if (phone !== undefined && phone !== null && phone !== '') {
    if (!isPhoneNumber(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }
  }

  if (alertPreference !== undefined && alertPreference !== null) {
    const validPreferences = ['email', 'sms', 'both'];
    if (!validPreferences.includes(alertPreference)) {
      errors.push({ field: 'alertPreference', message: 'Alert preference must be email, sms, or both' });
    }
  }

  if (priority !== undefined && priority !== null) {
    if (typeof priority !== 'number' || priority < 1 || priority > 5) {
      errors.push({ field: 'priority', message: 'Priority must be between 1 and 5' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  // Sanitize inputs
  if (req.body.name) req.body.name = sanitizeString(req.body.name, 100);
  if (req.body.email) req.body.email = sanitizeString(req.body.email, 254);
  if (req.body.phone) req.body.phone = sanitizeString(req.body.phone, 20);

  next();
};

/**
 * Validate snooze request
 */
export const validateSnooze = (req, res, next) => {
  const errors = [];
  const { hours } = req.body;

  if (hours !== undefined && hours !== null) {
    const h = parseInt(hours);
    if (isNaN(h) || h < 1 || h > 24) {
      errors.push({ field: 'hours', message: 'Hours must be between 1 and 24' });
    }
  }

  if (errors.length > 0) {
    return validationError(res, errors);
  }

  next();
};

export default {
  validateUser,
  validateCheckIn,
  validateVacation,
  validateActivity,
  validateShareToken,
  validateUUIDParam,
  validateEmergencyContact,
  validateSnooze
};
