import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';
import { initPushNotifications } from './services/notifications';

// Initialize Sentry for error tracking
// DSN should be set via environment variable VITE_SENTRY_DSN
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    // Only send errors in production
    enabled: import.meta.env.PROD,
    // Sample rate for performance monitoring (0.1 = 10% of transactions)
    tracesSampleRate: 0.1,
    // Capture 100% of errors
    sampleRate: 1.0,
    // Don't send PII
    sendDefaultPii: false,
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /^Loading chunk .* failed/,
    ],
    // Add custom tags
    initialScope: {
      tags: {
        app: 'still-here',
        platform: Capacitor.getPlatform(),
      },
    },
  });

  // Expose Sentry globally for ErrorBoundary and other components
  window.Sentry = Sentry;
}

// Initialize native features
const initNative = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar for dark theme
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
    } catch (e) {
      // Status bar config may not be supported on all platforms
    }

    // Initialize push notifications (wrapped in try-catch for Firebase issues)
    try {
      await initPushNotifications();
    } catch (e) {
      console.log('[PushNotifications] Init failed (Firebase not configured?):', e.message);
    }

    // Hide splash screen after app is ready
    await SplashScreen.hide();
  }
};

// Run initialization
initNative();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
