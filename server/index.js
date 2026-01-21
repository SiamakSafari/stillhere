import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import checkinsRouter from './routes/checkins.js';
import notificationsRouter from './routes/notifications.js';
import confirmationsRouter, { initConfirmationsTable } from './routes/confirmations.js';
import activitiesRouter from './routes/activities.js';
import familyRouter from './routes/family.js';
import { startScheduler } from './services/scheduler.js';
import { initPushTable } from './services/push.js';

// Initialize Sentry for error tracking (before Express app)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',
    // Sample rate for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 100% of errors
    sampleRate: 1.0,
  });

  // Track unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    Sentry.captureException(reason);
  });

  // Track uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    Sentry.captureException(error);
    // Give Sentry time to send the error before crashing
    setTimeout(() => process.exit(1), 2000);
  });
}

const app = express();
const PORT = process.env.PORT || 3002;

// Sentry request handler must be the first middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/checkin', checkinsRouter);
app.use('/api/vacation', checkinsRouter);
app.use('/api/test-alert', checkinsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/confirmations', confirmationsRouter);
app.use('/api/activity', activitiesRouter);
app.use('/api/family', familyRouter);

// Sentry error handler must be before any other error middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Initialize tables
  await initPushTable();
  await initConfirmationsTable();

  // Start the scheduler for checking missed check-ins
  startScheduler();
});
