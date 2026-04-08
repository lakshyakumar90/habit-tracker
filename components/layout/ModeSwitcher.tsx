import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ViewMode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MODES: { key: ViewMode; icon: string; label: string }[] = [
  { key: "time", icon: "timer-outline", label: "Time" },
  { key: "tick", icon: "checkmark-circle-outline", label: "Tick" },
  { key: "weekly", icon: "grid-outline", label: "Weekly" },
  { key: "tasks", icon: "checkmark-done-outline", label: "Tasks" },
];

export default function ModeSwitcher() {
  const { viewMode, setViewMode } = useHabitStore();
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const insets = useSafeAreaInsets();

  return (
    <View className="absolute left-4" style={{ bottom: insets.bottom + 12 }}>
      <View
        className="flex-row items-center rounded-[30px] p-2 border shadow-xl"
        style={{
          backgroundColor: appTheme.card,
          borderColor: `${appTheme.primary}66`,
          shadowColor: appTheme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {MODES.map((mode, index) => {
          const isActive = viewMode === mode.key;
          return (
            <React.Fragment key={mode.key}>
              {index === 3 && <View className="w-px h-6 bg-cardBorder mx-1" />}
              <TouchableOpacity
                onPress={() => setViewMode(mode.key)}
                className={`flex-row items-center justify-center px-4 py-3 min-h-[44px] ${
                  isActive ? "rounded-full" : "rounded-full"
                }`}
                activeOpacity={0.7}
                style={
                  isActive
                    ? {
                        backgroundColor: appTheme.primaryLight,
                        shadowColor: appTheme.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 5,
                      }
                    : {}
                }
              >
                <Ionicons
                  name={mode.icon as any}
                  size={20}
                  color={isActive ? "black" : appTheme.textSecondary}
                />
                {isActive && (
                  <Text className="text-black font-bold text-[13px] ml-2">
                    {mode.label}
                  </Text>
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
