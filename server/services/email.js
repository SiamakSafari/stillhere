import sgMail from '@sendgrid/mail';
import { createConfirmationToken, getConfirmationUrl } from '../routes/confirmations.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'alerts@stillhere.app';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const buildAlertEmail = (user, isTest = false, location = null, confirmationUrl = null) => {
  const petSection = user.petName
    ? `
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #4ade80; margin: 0 0 10px 0;">
          ${user.petEmoji || '🐾'} Pet Information
        </h3>
        <p style="margin: 0; color: #e5e7eb;">
          <strong>${user.petName}</strong>
        </p>
        ${user.petNotes ? `<p style="margin: 10px 0 0 0; color: #9ca3af;">${user.petNotes}</p>` : ''}
      </div>
    `
    : '';

  const locationSection = location && location.latitude && location.longitude
    ? `
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #60a5fa; margin: 0 0 10px 0;">
          📍 Last Known Location
        </h3>
        <p style="margin: 0; color: #e5e7eb;">
          <a href="https://maps.google.com/?q=${location.latitude},${location.longitude}"
             style="color: #60a5fa; text-decoration: underline;">
            View on Google Maps
          </a>
        </p>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 14px;">
          Last check-in: ${location.timestamp ? new Date(location.timestamp).toLocaleString() : 'Unknown'}
        </p>
      </div>
    `
    : '';

  const confirmationSection = confirmationUrl && !isTest
    ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmationUrl}"
           style="display: inline-block; background: #22c55e; color: #0a0a0a; padding: 14px 28px;
                  border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 16px;">
          Confirm You Received This Alert
        </a>
        <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px;">
          Click to let us know you saw this message
        </p>
      </div>
    `
    : '';

  const testBanner = isTest
    ? `
      <div style="background: #fbbf24; color: #0a0a0a; padding: 10px 20px; text-align: center; font-weight: bold;">
        TEST ALERT - This is a test email
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
      ${testBanner}
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #374151;">

          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: #ef4444; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">!</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
              ${isTest ? 'Test Alert' : 'Still Here Alert'}
            </h1>
          </div>

          <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi ${user.contactName},
          </p>

          <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            ${isTest
              ? `This is a test alert from Still Here. ${user.name} has set you as their emergency contact.`
              : `<strong>${user.name}</strong> hasn't checked in on Still Here for over 48 hours. You may want to reach out to make sure they're okay.`
            }
          </p>

          ${petSection}

          ${locationSection}

          ${confirmationSection}

          <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Still Here is a daily check-in app for peace of mind.
              ${isTest ? 'This was a test alert triggered by the user.' : ''}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendAlert = async (user, isTest = false, location = null) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  // Create confirmation token and URL for non-test alerts
  let confirmationUrl = null;
  if (!isTest) {
    try {
      const token = await createConfirmationToken(user.id, 'email');
      confirmationUrl = getConfirmationUrl(token);
    } catch (error) {
      console.error('Failed to create confirmation token:', error);
      // Continue without confirmation link
    }
  }

  const msg = {
    to: user.contactEmail,
    from: FROM_EMAIL,
    subject: isTest
      ? `Still Here Test Alert: ${user.name}`
      : `Still Here Alert: ${user.name} hasn't checked in`,
    html: buildAlertEmail(user, isTest, location, confirmationUrl)
  };

  try {
    await sgMail.send(msg);
    console.log(`Alert email sent to ${user.contactEmail} for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return { success: false, error: error.message };
  }
};

// Send alert to a specific emergency contact
export const sendAlertToContact = async (user, contact, isTest = false, location = null) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - email not sent');
    return { success: false, error: 'Email service not configured' };
  }

  if (!contact.email) {
    return { success: false, error: 'Contact has no email' };
  }

  // Create a user-like object with contact info for the email template
  const userWithContact = {
    ...user,
    contactName: contact.name,
    contactEmail: contact.email
  };

  // Create confirmation token and URL for non-test alerts
  let confirmationUrl = null;
  if (!isTest) {
    try {
      const token = await createConfirmationToken(user.id, 'email');
      confirmationUrl = getConfirmationUrl(token);
    } catch (error) {
      console.error('Failed to create confirmation token:', error);
    }
  }

  const msg = {
    to: contact.email,
    from: FROM_EMAIL,
    subject: isTest
      ? `Still Here Test Alert: ${user.name}`
      : `Still Here Alert: ${user.name} hasn't checked in`,
    html: buildAlertEmail(userWithContact, isTest, location, confirmationUrl)
  };

  try {
    await sgMail.send(msg);
    console.log(`Alert email sent to ${contact.email} (${contact.name}) for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send alert email to ${contact.email}:`, error);
    return { success: false, error: error.message };
  }
};

export const sendReminder = async (user) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - reminder not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const msg = {
    to: user.contactEmail,
    from: FROM_EMAIL,
    subject: `Still Here Reminder: ${user.name} hasn't checked in today`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #374151;">

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">⏰</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                Reminder
              </h1>
            </div>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${user.contactName},
            </p>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${user.name}</strong> hasn't checked in on Still Here today. This is just a heads up - we'll send a full alert if they don't check in within the next 24 hours.
            </p>

            <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Still Here is a daily check-in app for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Reminder email sent to ${user.contactEmail} for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send reminder to a specific emergency contact
export const sendReminderToContact = async (user, contact) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - reminder not sent');
    return { success: false, error: 'Email service not configured' };
  }

  if (!contact.email) {
    return { success: false, error: 'Contact has no email' };
  }

  const msg = {
    to: contact.email,
    from: FROM_EMAIL,
    subject: `Still Here Reminder: ${user.name} hasn't checked in today`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #374151;">

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">⏰</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                Reminder
              </h1>
            </div>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${contact.name},
            </p>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${user.name}</strong> hasn't checked in on Still Here today. This is just a heads up - we'll send a full alert if they don't check in within the next 24 hours.
            </p>

            <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Still Here is a daily check-in app for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Reminder email sent to ${contact.email} (${contact.name}) for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to send reminder email to ${contact.email}:`, error);
    return { success: false, error: error.message };
  }
};

// Send proof of life notification on successful check-in
export const sendProofOfLife = async (user) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - proof of life not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const msg = {
    to: user.contactEmail,
    from: FROM_EMAIL,
    subject: `${user.name} checked in`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #374151;">

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #4ade80; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px; color: #0a0a0a;">✓</span>
              </div>
              <h1 style="color: #4ade80; margin: 0; font-size: 24px;">
                All Good
              </h1>
            </div>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
              <strong>${user.name}</strong> checked in on Still Here at ${timeStr}.
            </p>

            ${user.streak > 1 ? `
              <p style="color: #fbbf24; font-size: 14px; text-align: center; margin: 0;">
                🔥 ${user.streak} day streak
              </p>
            ` : ''}

            <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                You're receiving this because ${user.name} enabled daily check-in notifications.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Proof of life sent to ${user.contactEmail} for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send proof of life:', error);
    return { success: false, error: error.message };
  }
};

// Send vacation notification to contact
export const sendVacationNotification = async (user, vacationUntil) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - vacation notification not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const returnDate = new Date(vacationUntil).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const msg = {
    to: user.contactEmail,
    from: FROM_EMAIL,
    subject: `${user.name} is on vacation`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #374151;">

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #60a5fa; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">✈️</span>
              </div>
              <h1 style="color: #60a5fa; margin: 0; font-size: 24px;">
                Vacation Mode
              </h1>
            </div>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
              <strong>${user.name}</strong> has enabled vacation mode on Still Here.
            </p>

            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0 0 20px 0;">
              They'll be back on <strong style="color: #60a5fa;">${returnDate}</strong>.
            </p>

            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">
              No alerts will be sent during this time.
            </p>

            <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                Still Here is a daily check-in app for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Vacation notification sent to ${user.contactEmail} for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send vacation notification:', error);
    return { success: false, error: error.message };
  }
};

// Send activity mode alert
export const sendActivityAlert = async (user, activity) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - activity alert not sent');
    return { success: false, error: 'Email service not configured' };
  }

  const startTime = new Date(activity.startedAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const expectedTime = new Date(activity.expectedEndAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const now = new Date();
  const expectedEnd = new Date(activity.expectedEndAt);
  const minutesOverdue = Math.round((now - expectedEnd) / (1000 * 60));

  const locationSection = activity.latitude && activity.longitude
    ? `
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #60a5fa; margin: 0 0 10px 0;">
          📍 Last Known Location
        </h3>
        <p style="margin: 0; color: #e5e7eb;">
          <a href="https://maps.google.com/?q=${activity.latitude},${activity.longitude}"
             style="color: #60a5fa; text-decoration: underline;">
            View on Google Maps
          </a>
        </p>
      </div>
    `
    : '';

  const detailsSection = activity.details
    ? `
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #fbbf24; margin: 0 0 10px 0;">
          📝 Activity Details
        </h3>
        <p style="margin: 0; color: #e5e7eb; white-space: pre-wrap;">${activity.details}</p>
      </div>
    `
    : '';

  const msg = {
    to: user.contactEmail,
    from: FROM_EMAIL,
    subject: `Still Here Alert: ${user.name} hasn't checked back in`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 40px; border: 1px solid #ef4444;">

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #ef4444; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 30px;">⚠️</span>
              </div>
              <h1 style="color: #ef4444; margin: 0; font-size: 24px;">
                Activity Alert
              </h1>
            </div>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Hi ${user.contactName},
            </p>

            <p style="color: #e5e7eb; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              <strong>${user.name}</strong> started an activity on Still Here and hasn't checked back in.
            </p>

            <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #fbbf24; font-size: 18px;">
                ${activity.emoji} ${activity.label}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                Started: ${startTime}<br>
                Expected back: ${expectedTime} (${minutesOverdue} minutes ago)
              </p>
            </div>

            ${locationSection}

            ${detailsSection}

            <p style="color: #fca5a5; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
              This may be nothing — but ${user.name} wanted you to know just in case.
            </p>

            <div style="border-top: 1px solid #374151; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Still Here is a daily check-in app for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`Activity alert sent to ${user.contactEmail} for user ${user.name}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send activity alert:', error);
    return { success: false, error: error.message };
  }
};
