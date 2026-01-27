import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import usersRouter from './routes/users.js';
import checkinsRouter from './routes/checkins.js';
import notificationsRouter from './routes/notifications.js';
import confirmationsRouter, { initConfirmationsTable } from './routes/confirmations.js';
import activitiesRouter from './routes/activities.js';
import familyRouter from './routes/family.js';
import contactsRouter from './routes/contacts.js';
import smsWebhookRouter from './routes/sms-webhook.js';
import externalRouter from './routes/external.js';
import exportRouter from './routes/export.js';
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

// Sentry request handler must be the first middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Trust proxy for correct client IP behind reverse proxies
app.set('trust proxy', 1);

// Security headers using Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API compatibility
}));

// CORS configuration - restrict to allowed origins
const allowedOrigins = [
  config.appUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003',
  'http://127.0.0.1:3004',
];

// Add production origins from environment
if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMITED',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/api/health',
});

app.use(limiter);

app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    authEnabled: config.authEnabled
  });
});

// API routes
app.use('/api/users', usersRouter);
app.use('/api/checkin', checkinsRouter);
app.use('/api/vacation', checkinsRouter);
// Note: /api/test-alert removed - use /api/users/:id/test-alert instead
app.use('/api/notifications', notificationsRouter);
app.use('/api/confirmations', confirmationsRouter);
app.use('/api/activity', activitiesRouter);
app.use('/api/family', familyRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/sms', smsWebhookRouter);
app.use('/api/export', exportRouter);
app.use('/api', externalRouter); // External check-in + API key management

// Sentry error handler must be before any other error middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({ 
    error: message,
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    code: 'NOT_FOUND'
  });
});

// Start server
app.listen(config.port, async () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║           Still Here Server v1.1.0            ║
╠═══════════════════════════════════════════════╣
║  Port: ${String(config.port).padEnd(38)}║
║  Auth: ${(config.authEnabled ? 'Enabled' : 'Disabled').padEnd(38)}║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(31)}║
╚═══════════════════════════════════════════════╝
  `);

  // Initialize tables
  await initPushTable();
  await initConfirmationsTable();

  // Start the scheduler for checking missed check-ins
  startScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
