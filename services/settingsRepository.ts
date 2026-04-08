import { AppSettings } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";

export const settingsRepository = {
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    useSettingsStore.getState().updateSetting(key, value),
  setHasSeenSyncPrompt: (seen: boolean) =>
    useSettingsStore.getState().setHasSeenSyncPrompt(seen),
};
