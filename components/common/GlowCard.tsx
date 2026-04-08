import React from "react";
import { View, ViewStyle } from "react-native";

interface GlowCardProps {
  glowColor?: string;
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export default function GlowCard({
  glowColor = "#22c55e",
  children,
  className = "",
  style,
}: GlowCardProps) {
  return (
    <View
      className={`bg-card rounded-2xl border border-cardBorder p-4 ${className}`}
      style={[
        {
          shadowColor: glowColor,
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