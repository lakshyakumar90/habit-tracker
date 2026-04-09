import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  value: number;
  label: string;
}

export default function StatCard({
  icon,
  iconColor,
  bgColor,
  value,
  label,
}: StatCardProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

  return (
    <View
      className="flex-1 rounded-3xl p-6 items-center"
      style={{
        backgroundColor: appTheme.card,
        borderWidth: 1,
        borderColor: appTheme.cardBorder,
      }}
    >
      <Ionicons name={icon as any} size={28} color={iconColor} />
      <Text className="text-white text-4xl font-bold mt-3">{value}</Text>
      <Text className="text-textMuted text-sm mt-1 uppercase font-bold tracking-wider">
        {label}
      </Text>
    </View>
  );
}
