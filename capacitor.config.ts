import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9ef9f016bd2c406ca384b239fe6ec4e2',
  appName: 'visual-doc-assist',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://9ef9f016-bd2c-406c-a384-b239fe6ec4e2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;