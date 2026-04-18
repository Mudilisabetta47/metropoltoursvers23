import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a97d4e9208ce43758235171e4e8e16a2',
  appName: 'METROPOL TOURS',
  webDir: 'dist',
  server: {
    url: 'https://a97d4e92-08ce-4375-8235-171e4e8e16a2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    backgroundColor: '#0f1218',
  },
};

export default config;
