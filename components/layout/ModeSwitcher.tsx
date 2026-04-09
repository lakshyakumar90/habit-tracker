// ModeSwitcher.tsx
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

interface ModeSwitcherProps {
  onSelect?: (mode: ViewMode) => void;
}

const ModeSwitcherButton = React.memo(function ModeSwitcherButton({
  modeKey,
  icon,
  label,
  isActive,
  appTheme,
  onPress,
}: {
  modeKey: ViewMode;
  icon: string;
  label: string;
  isActive: boolean;
  appTheme: ReturnType<typeof getAppTheme>;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-full min-h-[48px] flex-row items-center justify-center px-3"
      activeOpacity={0.8}
      style={
        isActive
          ? {
              backgroundColor: appTheme.primaryLight,
              shadowColor: appTheme.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 4,
              transform: [{ scale: 1.02 }],
              minWidth: 90,
            }
          : { minWidth: 48 }
      }
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={isActive ? "#000000" : appTheme.textSecondary}
      />
      {isActive && (
        <Text
          className="text-[12px] font-semibold ml-1.5"
          style={{ color: "#000000" }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
});

function ModeSwitcher({ onSelect }: ModeSwitcherProps) {
  const viewMode = useHabitStore((state) => state.viewMode);
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const insets = useSafeAreaInsets();
  const isTasksMode = viewMode === "tasks";

  const handlers = React.useRef<Record<ViewMode, () => void>>(
    {} as Record<ViewMode, () => void>,
  );

  // Update handler refs without re-creating objects
  React.useMemo(() => {
    MODES.forEach((mode) => {
      handlers.current[mode.key] = () => onSelect?.(mode.key);
    });
  }, [onSelect]);

  const containerStyle = React.useMemo(
    () =>
      isTasksMode
        ? {
            left: 0 as number,
            right: 0 as number,
            alignItems: "center" as const,
            bottom: insets.bottom + 12,
          }
        : {
            left: 16,
            bottom: insets.bottom + 12,
          },
    [isTasksMode, insets.bottom],
  );

  const pillStyle = React.useMemo(
    () => ({
      backgroundColor: appTheme.card,
      borderColor: `${appTheme.primary}66`,
      shadowColor: appTheme.primary,
      shadowOffset: { width: 0, height: 4 } as const,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    }),
    [appTheme.card, appTheme.primary],
  );

  return (
    <View className="absolute" style={containerStyle}>
      <View
        className="flex-row items-center rounded-[30px] p-2 border shadow-xl"
        style={pillStyle}
      >
        {MODES.map((mode) => (
          <ModeSwitcherButton
            key={mode.key}
            modeKey={mode.key}
            icon={mode.icon}
            label={mode.label}
            isActive={viewMode === mode.key}
            appTheme={appTheme}
            onPress={handlers.current[mode.key]}
          />
        ))}
      </View>
    </View>
  );
}

export default React.memo(ModeSwitcher);