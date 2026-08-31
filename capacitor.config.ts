import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'de.metours.app',
  appName: 'METROPOL TOURS',
  webDir: 'dist',
  ...(devServerUrl
    ? { server: { url: devServerUrl, cleartext: devServerUrl.startsWith('http://') } }
    : {}),
  ios: {
    contentInset: 'never',
    scrollEnabled: true,
    backgroundColor: '#FFFFFF',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0F1218',
      showSpinner: false,
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'native',
      style: 'light',
      resizeOnFullScreen: true,
    },
    SafeArea: {
      statusBarStyle: 'DARK',
      navigationBarStyle: 'LIGHT',
    },
  },
};

export default config;
