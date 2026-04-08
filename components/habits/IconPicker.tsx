import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HABIT_ICONS } from "@/constants/icons";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  color: string;
}

export default function IconPicker({
  selectedIcon,
  onSelect,
  color,
}: IconPickerProps) {
  return (
    <View className="items-center mb-6">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={selectedIcon as any} size={36} color={color} />
      </View>
      <Text className="text-textMuted text-xs mb-4">Tap to change</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 px-2">
          {HABIT_ICONS.map((icon) => {
            const isActive = selectedIcon === icon;
            return (
              <TouchableOpacity
                key={icon}
                onPress={() => onSelect(icon)}
                className={`p-2.5 rounded-xl ${
                  isActive ? "bg-surface border border-primary/30" : ""
                }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={icon as any}
                  size={22}
                  color={isActive ? color : "#6b7280"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}