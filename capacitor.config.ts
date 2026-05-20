import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rozgarsync.app',
  appName: 'RozgarSync',
  webDir: 'public',
  server: {
    // During hackathon presentation, it is easier to point Capacitor to the hosted PWA
    // Change this to your deployed Vercel URL
    url: 'https://rozgarsync.vercel.app',
    cleartext: true
  }
};

export default config;
