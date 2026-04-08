import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  return (
    <View
      className="flex-1 rounded-2xl p-4 items-center"
      style={{
        backgroundColor: `${bgColor}15`,
        borderWidth: 1,
        borderColor: `${bgColor}25`,
      }}
    >
      <Ionicons name={icon as any} size={22} color={iconColor} />
      <Text className="text-white text-3xl font-bold mt-2">{value}</Text>
      <Text className="text-textMuted text-xs mt-1">{label}</Text>
    </View>
  );
}