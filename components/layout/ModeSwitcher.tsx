// ModeSwitcher.tsx (FINAL WITH modeProgress SAFE)

import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MODES = [
  { key: "time", icon: "timer-outline", label: "Time" },
  { key: "tick", icon: "checkmark-circle-outline", label: "Tick" },
  { key: "weekly", icon: "grid-outline", label: "Weekly" },
  { key: "tasks", icon: "checkmark-done-outline", label: "Tasks" },
];

interface ModeSwitcherProps {
  onSelect?: (mode: any) => void;
  activeMode: any;
  modeProgress?: { value: number };
}

/* ================= BUTTON ================= */

const ModeSwitcherButton = React.memo(
  ({ isActive, icon, label, appTheme, onPress }: any) => {
    return (
      <Pressable onPress={onPress} style={{ flexShrink: 1 }}>
        <Animated.View
          layout={LinearTransition.springify().damping(100)}
          className="flex-row items-center justify-center rounded-full mx-0.5"
          style={{
            paddingHorizontal: isActive ? 14 : 11,
            paddingVertical: 10,
            backgroundColor: isActive ? appTheme.primary : "transparent",
            overflow: "hidden",
          }}
        >
          <Ionicons
            name={icon}
            size={22}
            color={isActive ? "#000" : appTheme.textSecondary}
            style={{ flexShrink: 0 }}
          />
          {isActive && (
            <Animated.Text
              entering={FadeIn.duration(150)}
              exiting={FadeOut.duration(150)}
              className="ml-1.5 text-[13px] font-bold"
              style={{ color: "#000", flexShrink: 1 }}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {label}
            </Animated.Text>
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

/* ================= MAIN ================= */

function ModeSwitcher({ onSelect, activeMode }: ModeSwitcherProps) {
  const selectedTheme = useSettingsStore((s) => s.theme);
  const appTheme = getAppTheme(selectedTheme);
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      className="absolute flex-row"
      style={{
        left: 16,
        right: activeMode === "tasks" ? 16 : 80, // Allow full width to center it in tasks view
        bottom: insets.bottom + 16,
        justifyContent: activeMode === "tasks" ? "center" : "flex-start",
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        layout={LinearTransition.springify().damping(24).stiffness(250)}
        className="flex-row items-center rounded-full px-1 py-2"
        style={{
          backgroundColor: `${appTheme.card}E6`, // Slight transparency
          borderWidth: 1,
          borderColor: `${appTheme.primary}40`,
          shadowColor: appTheme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 10,
          maxWidth: "100%", // Constrain to prevent overflow further
        }}
        pointerEvents="auto"
      >
        {MODES.map((mode) => (
          <ModeSwitcherButton
            key={mode.key}
            icon={mode.icon}
            label={mode.label}
            isActive={mode.key === activeMode}
            appTheme={appTheme}
            onPress={() => onSelect?.(mode.key)}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

export default React.memo(ModeSwitcher);
