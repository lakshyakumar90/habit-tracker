import { ConfigContext, ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.APP_VARIANT;
const IS_DEV = APP_VARIANT === "development";
const IS_PREVIEW = APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) return "com.lakshya.kumar.habittracker.dev";
  if (IS_PREVIEW) return "com.lakshya.kumar.habittracker.preview";
  return "com.lakshya.kumar.habittracker";
};

const getAppName = () => {
  if (IS_DEV) return "Habit Tracker (Dev)";
  if (IS_PREVIEW) return "Habit Tracker (Preview)";
  return "Habit Tracker";
};

const PROJECT_ID = "c887dab9-4209-4d58-b25d-a844e22c1b02";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "habit-tracker",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  scheme: "habittracker",
  newArchEnabled: true,

  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0F1A15",
  },

  ios: {
    bundleIdentifier: getUniqueIdentifier(),
    buildNumber: "1",
    supportsTablet: true,
    infoPlist: {
      UIBackgroundModes: ["fetch", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
      CFBundleAllowMixedLocalizations: true,
      CFBundleDevelopmentRegion: "en",
      LSApplicationQueriesSchemes: ["mailto", "itms-apps"],
    },
    config: {
      usesNonExemptEncryption: false,
    },
    associatedDomains: ["applinks:habittracker.app"],
  },

  android: {
    package: getUniqueIdentifier(),
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      backgroundColor: "#0F1A15",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    permissions: [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      "SCHEDULE_EXACT_ALARM",
      "POST_NOTIFICATIONS",
      "INTERNET",
      "ACCESS_NETWORK_STATE",
    ],
    blockedPermissions: [
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_CONTACTS",
      "android.permission.WRITE_CONTACTS",
      "android.permission.READ_CALENDAR",
      "android.permission.WRITE_CALENDAR",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ],
  },

  web: {
    bundler: "metro",
    output: "single",
    favicon: "./assets/images/favicon.png",
  },

  notification: {
    icon: "./assets/images/android-icon-monochrome.png",
    color: "#4ADE80",
    androidMode: "default",
    androidCollapsedTitle: "Habit Tracker",
    iosDisplayInForeground: true,
  },

  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#4ADE80",
        sounds: [],
        androidMode: "default",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0F1A15",
      },
    ],
    "@react-native-community/datetimepicker",
  ],

  extra: {
    eas: {
      projectId: PROJECT_ID,
    },
    router: {
      origin: false,
    },
  },
  owner: "lakshya.kumar",
  runtimeVersion: "1.0.0",
  updates: {
    url: `https://u.expo.dev/${PROJECT_ID}`,
    fallbackToCacheTimeout: 5000,
  },
  experiments: {
    typedRoutes: true,
  },
});
