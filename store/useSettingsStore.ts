import { AppSettings } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getNowIso } from "@/utils/timestamps";
import { syncUpsertSettings } from "@/services/cloudSync";

interface SettingsState extends AppSettings {
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  setCloudSyncStatus: (
    status: AppSettings["cloudSyncStatus"],
    error?: string,
  ) => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setHasSeenSyncPrompt: (seen: boolean) => void;
  setAuthUserSummary: (user: AppSettings["authUserSummary"]) => void;
  markSyncCompleted: () => void;
  applyCloudSettings: (settings: Partial<AppSettings>) => void;
}

const syncedSettingKeys: (keyof AppSettings)[] = [
  "theme",
  "remindersEnabled",
  "celebrationsEnabled",
  "soundEnabled",
  "confettiEnabled",
  "tickSoundEnabled",
  "celebrationSound",
  "celebrationVolume",
];

const syncSettingsIfEnabled = async (getState: () => SettingsState) => {
  const state = getState();
  if (!state.cloudSyncEnabled) return;
  try {
    await syncUpsertSettings(
      syncedSettingKeys.reduce<Partial<AppSettings>>((acc, key) => {
        (acc as any)[key] = state[key];
        return acc;
      }, {}),
    );
  } catch (error) {
    console.error("Cloud settings sync failed", error);
    getState().setCloudSyncStatus("error", "Settings failed to sync.");
  }
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "dark-green",
      remindersEnabled: false,
      celebrationsEnabled: true,
      soundEnabled: true,
      confettiEnabled: true,
      tickSoundEnabled: true,
      celebrationSound: "sparkle",
      celebrationVolume: 0.7,
      cloudSyncEnabled: false,
      cloudSyncStatus: "local",
      hasSeenSyncPrompt: false,
      authUserSummary: undefined,
      lastSyncAt: undefined,
      lastSyncError: undefined,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      updateSetting: (key, value) => {
        set({ [key]: value });
        if (syncedSettingKeys.includes(key)) {
          void syncSettingsIfEnabled(get);
        }
      },

      setCloudSyncStatus: (status, error) =>
        set({
          cloudSyncStatus: status,
          lastSyncError: error,
          ...(status === "cloud" ? { lastSyncAt: getNowIso() } : {}),
        }),

      setCloudSyncEnabled: (enabled) =>
        set({
          cloudSyncEnabled: enabled,
          cloudSyncStatus: enabled ? "cloud" : "local",
          ...(enabled ? { lastSyncError: undefined } : {}),
        }),

      setHasSeenSyncPrompt: (seen) => set({ hasSeenSyncPrompt: seen }),

      setAuthUserSummary: (user) => set({ authUserSummary: user }),

      markSyncCompleted: () =>
        set({
          cloudSyncEnabled: true,
          cloudSyncStatus: "cloud",
          lastSyncAt: getNowIso(),
          lastSyncError: undefined,
        }),

      applyCloudSettings: (settings) => {
        const nextState = syncedSettingKeys.reduce<Partial<SettingsState>>(
          (acc, key) => {
            if (settings[key] !== undefined) {
              (acc as any)[key] = settings[key];
            }
            return acc;
          },
          {},
        );
        set(nextState);
      },
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
    },
  ),
);
