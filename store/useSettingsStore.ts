import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppSettings } from "@/types";

interface SettingsState extends AppSettings {
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark-green",
      remindersEnabled: false,
      celebrationsEnabled: true,
      soundEnabled: true,
      confettiEnabled: true,

      updateSetting: (key, value) => set({ [key]: value }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);