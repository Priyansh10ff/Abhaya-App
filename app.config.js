import 'dotenv/config'

export default {
  expo: {
    name: 'Abhaya',
    slug: 'abhaya-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'abhaya',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#080E1A',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.abhaya.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#080E1A',
      },
      package: 'com.abhaya.app',
      permissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_KEY, // ← from .env, never hardcoded
        },
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Abhaya needs your location to show nearby safety reports.',
          locationAlwaysAndWhenInUsePermission: 'Abhaya needs your location for the safety map.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#0B6860',
          sounds: [],
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Abhaya needs access to your photos to add evidence to your vault.',
          cameraPermission: 'Abhaya needs camera access to photograph evidence.',
        },
      ],
    ],
    extra: {
      claudeApiKey:  process.env.CLAUDE_API_KEY,
      supabaseUrl:   process.env.SUPABASE_URL,
      supabaseAnon:  process.env.SUPABASE_ANON_KEY,
      googleMapsKey: process.env.GOOGLE_MAPS_KEY,
    },
    experiments: {
      typedRoutes: true,
    },
  },
}