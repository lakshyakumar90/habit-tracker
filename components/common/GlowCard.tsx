import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import React from "react";
import { View, ViewStyle } from "react-native";

interface GlowCardProps {
  glowColor?: string;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export default function GlowCard({
  glowColor,
  children,
  className = "",
  style,
}: GlowCardProps) {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const color = glowColor ?? appTheme.primary;
  return (
    <View
      className={`rounded-3xl border p-6 ${className}`}
      style={[
        {
          backgroundColor: appTheme.card,
          borderColor: appTheme.cardBorder,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
