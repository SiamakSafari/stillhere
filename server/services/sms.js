import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

if (accountSid && authToken && fromNumber) {
  client = twilio(accountSid, authToken);
  console.log('[SMS] Twilio configured');
} else {
  console.warn('[SMS] Twilio credentials not configured - SMS disabled');
}

// Send SMS message
export const sendSMS = async (to, body) => {
  if (!client) {
    console.warn('[SMS] Twilio not configured - SMS not sent');
    return { success: false, error: 'SMS service not configured' };
  }

  // Normalize phone number
  let phoneNumber = to.replace(/\D/g, '');
  if (!phoneNumber.startsWith('1') && phoneNumber.length === 10) {
    phoneNumber = '1' + phoneNumber; // Assume US number
  }
  phoneNumber = '+' + phoneNumber;

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: phoneNumber
    });

    console.log(`[SMS] Message sent to ${to}: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('[SMS] Failed to send:', error);
    return { success: false, error: error.message };
  }
};

// Send alert SMS to emergency contact
export const sendAlertSMS = async (user, options = {}) => {
  if (!user.contactPhone) {
    return { success: false, error: 'No contact phone number' };
  }

  const { isTest = false, includeLocation = false, latitude, longitude } = options;

  let message = isTest
    ? `[TEST] Still Here Alert: This is a test alert. ${user.name} has set you as their emergency contact.`
    : `Still Here Alert: ${user.name} hasn't checked in for over 48 hours. You may want to reach out to make sure they're okay.`;

  // Add pet info if available
  if (user.petName && !isTest) {
    message += `\n\nPet: ${user.petEmoji || ''} ${user.petName}`;
    if (user.petNotes) {
      message += ` - ${user.petNotes}`;
    }
  }

  // Add location if available
  if (includeLocation && latitude && longitude) {
    message += `\n\nLast known location: https://maps.google.com/?q=${latitude},${longitude}`;
  }

  return sendSMS(user.contactPhone, message);
};

// Send reminder SMS to user (optional feature)
export const sendReminderSMS = async (user) => {
  // This could be used to send reminders directly to the user
  // For now, we'll skip this as the main alerts go to contacts
  return { success: false, error: 'User SMS reminders not implemented' };
};

// Check if SMS is configured
export const isSMSConfigured = () => {
  return client !== null;
};
