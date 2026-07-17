import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Set EXPO_APPLE_TEAM_ID on your Mac (or put appleTeamId below) so
 * @bacons/apple-targets / Xcode signing can resolve your team.
 * Find it in Xcode → Settings → Accounts → Team ID (10 characters).
 */
const appleTeamId =
  process.env.EXPO_APPLE_TEAM_ID || process.env.APPLE_TEAM_ID || undefined;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dayink',
  slug: 'dayink',
  owner: 'chintuvedanth',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'dayink',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.dayink.app',
    ...(appleTeamId ? { appleTeamId } : {}),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    entitlements: {
      'com.apple.security.application-groups': ['group.com.dayink.app'],
    },
  },
  android: {
    package: 'com.dayink.app',
    adaptiveIcon: {
      backgroundColor: '#F7F3EA',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    [
      'expo-audio',
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
      },
    ],
    'expo-asset',
    '@bacons/apple-targets',
  ],
  extra: {
    splashBackground: '#F7F3EA',
    eas: {
      projectId: '7d212128-d3cb-4dc5-8e49-c2859c0a3179',
    },
  },
});
