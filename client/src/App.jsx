import { useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Onboarding } from './components/Onboarding';
import { MainScreen } from './components/MainScreen';
import { FamilyDashboard } from './pages/FamilyDashboard';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { syncToServer } from './utils/api';
import { syncWidget } from './plugins/WidgetBridge';
import { initializeNotifications, scheduleDailyReminders, scheduleStreakWarning } from './services/notifications';

// Parse current route from URL
const parseRoute = () => {
  const path = window.location.pathname;

  // Match /family/:token route
  const familyMatch = path.match(/^\/family\/([a-f0-9]{64})$/i);
  if (familyMatch) {
    return { type: 'family', token: familyMatch[1] };
  }

  return { type: 'app' };
};

// Apply theme to document
const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

// Helper to darken a hex color
const darkenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * percent / 100));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * percent / 100));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Apply accent color to document
const applyAccentColor = (color, customColor) => {
  const root = document.documentElement;

  if (color === 'custom' && customColor) {
    // Apply custom color by setting CSS variables directly
    root.removeAttribute('data-accent');
    root.style.setProperty('--accent-primary', customColor);
    root.style.setProperty('--accent-dark', darkenColor(customColor, 15));
    root.style.setProperty('--accent-darker', darkenColor(customColor, 25));
    root.style.setProperty('--accent-glow', hexToRgba(customColor, 0.4));
  } else {
    // Use preset color via data attribute
    root.style.removeProperty('--accent-primary');
    root.style.removeProperty('--accent-dark');
    root.style.removeProperty('--accent-darker');
    root.style.removeProperty('--accent-glow');
    root.setAttribute('data-accent', color || 'green');
  }
};

function App() {
  const { data, updateData, resetData, isLoading } = useLocalStorage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Parse route on mount
  const route = useMemo(() => parseRoute(), []);

  // If this is a family dashboard route, render it directly
  if (route.type === 'family') {
    return <FamilyDashboard token={route.token} />;
  }

  // Apply theme on load and when it changes
  useEffect(() => {
    applyTheme(data.theme || 'system');
  }, [data.theme]);

  // Apply accent color on load and when it changes
  useEffect(() => {
    applyAccentColor(data.accentColor || 'green', data.customAccentColor);
  }, [data.accentColor, data.customAccentColor]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (data.theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [data.theme]);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to server when coming back online
  useEffect(() => {
    if (isOnline && data.onboardingComplete && data.userId) {
      syncToServer(data);
    }
  }, [isOnline, data]);

  // Sync widget on app launch and resume (native platforms only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !data.onboardingComplete) return;

    // Sync widget with current data
    syncWidget(data);

    // Listen for app resume to sync widget
    const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        syncWidget(data);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [data.onboardingComplete, data.streak, data.lastCheckIn, data.vacationUntil]);

  // Initialize notifications after onboarding
  useEffect(() => {
    if (!data.onboardingComplete) return;

    // Initialize push and local notifications
    initializeNotifications({
      checkInWindowEnd: data.checkInWindowEnd,
      timezone: data.timezone,
      streak: data.streak,
      lastCheckIn: data.lastCheckIn
    });
  }, [data.onboardingComplete]);

  // Update notification reminders when settings change
  useEffect(() => {
    if (!data.onboardingComplete) return;

    // Reschedule daily reminders when window changes
    if (data.checkInWindowEnd) {
      scheduleDailyReminders({
        checkInWindowEnd: data.checkInWindowEnd,
        timezone: data.timezone,
        streak: data.streak
      });
    }
  }, [data.checkInWindowEnd, data.timezone, data.streak]);

  // Schedule streak warning when streak/lastCheckIn changes
  useEffect(() => {
    if (!data.onboardingComplete || !data.streak || !data.lastCheckIn) return;

    scheduleStreakWarning({
      streak: data.streak,
      lastCheckIn: data.lastCheckIn
    });
  }, [data.streak, data.lastCheckIn]);

  // Handle completing onboarding
  const handleOnboardingComplete = () => {
    updateData({ onboardingComplete: true });
  };

  // Handle reset
  const handleReset = () => {
    resetData();
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-dark)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--gray-700)',
            borderTopColor: 'var(--green-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      </div>
    );
  }

  // Show onboarding if not complete
  if (!data.onboardingComplete) {
    return (
      <Onboarding
        data={data}
        updateData={updateData}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show main screen
  return (
    <ToastProvider>
      <MainScreen
        data={data}
        updateData={updateData}
        onReset={handleReset}
      />
      <ToastContainer />
      {!isOnline && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--yellow-warning)',
            color: 'var(--bg-dark)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            zIndex: 50
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          You're offline
        </div>
      )}
    </ToastProvider>
  );
}

export default App;
