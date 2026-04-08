import { useSettingsStore } from "@/store/useSettingsStore";
import { THEME_OPTIONS, getAppTheme } from "@/constants/appThemes";
import { settingsRepository } from "@/services/settingsRepository";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Header() {
  const today = new Date();
  const { theme, cloudSyncEnabled, cloudSyncStatus } = useSettingsStore();
  const appTheme = getAppTheme(theme);

  const handleCycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex((opt) => opt.key === theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    settingsRepository.updateSetting("theme", THEME_OPTIONS[nextIndex].key);
  };

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-xl font-bold"
          style={{ color: appTheme.textPrimary }}
        >
          Today, {format(today, "do MMM")}
        </Text>
        <View className="flex-row items-center gap-1">
          <TouchableOpacity className="relative p-2" onPress={handleCycleTheme}>
            <Ionicons name="color-wand" size={24} color={appTheme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="relative p-2"
            onPress={() => router.push("/settings")}
          >
            <Ionicons
              name={cloudSyncEnabled ? "cloud-done" : "cloud-outline"}
              size={24}
              color={
                cloudSyncEnabled || cloudSyncStatus === "migrating"
                  ? appTheme.primary
                  : appTheme.textMuted
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color={appTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
