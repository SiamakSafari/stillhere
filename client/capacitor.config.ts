import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stillhere.app',
  appName: 'Still Here',
  webDir: 'dist',
  server: {
    // For development, allow loading from localhost
    // Remove this for production builds
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#4ade80'
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Still Here'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
