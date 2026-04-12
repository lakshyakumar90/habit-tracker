import { AppSettings } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

// Grab the store's API once at module level instead of
// calling getState() on every invocation.
const getState = () => useSettingsStore.getState();

export const settingsRepository = {
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => getState().updateSetting(key, value),

  setHasSeenSyncPrompt: (seen: boolean) =>
    getState().setHasSeenSyncPrompt(seen),

  setCloudSyncEnabled: (enabled: boolean) =>
    getState().setCloudSyncEnabled(enabled),

  setCloudSyncStatus: (
    status: AppSettings["cloudSyncStatus"],
    error?: string,
  ) => getState().setCloudSyncStatus(status, error),

  setAuthUserSummary: (user: AppSettings["authUserSummary"]) =>
    getState().setAuthUserSummary(user),

  markSyncCompleted: () => getState().markSyncCompleted(),

  applyCloudSettings: (settings: Partial<AppSettings>) =>
    getState().applyCloudSettings(settings),

  /** Read a setting value without subscribing to changes */
  getSetting: <K extends keyof AppSettings>(key: K): AppSettings[K] =>
    getState()[key],
} as const;