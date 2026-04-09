import Constants from "expo-constants";
import { Platform } from "react-native";

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export const BUILD_NUMBER = Platform.select({
  ios: Constants.expoConfig?.ios?.buildNumber ?? "1",
  android: String(Constants.expoConfig?.android?.versionCode ?? 1),
  default: "1",
});

export const FULL_VERSION = `${APP_VERSION} (${BUILD_NUMBER})`;

export const APP_NAME = Constants.expoConfig?.name ?? "Habit Tracker";

export const IS_DEV = __DEV__;

export const APP_SCHEME = Constants.expoConfig?.scheme ?? "habittracker";
