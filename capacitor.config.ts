/// <reference types="@capacitor/keyboard" />
/// <reference types="@capacitor/status-bar" />
/// <reference types="@capacitor/splash-screen" />

import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.acheteici.app',
  appName: 'AgriMarket Connect',
  webDir: 'dist',
  // Keep pinch-to-zoom available for accessibility / App Store review.
  zoomEnabled: true,
  backgroundColor: '#f9fafb',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 800,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
  },
};

export default config;
