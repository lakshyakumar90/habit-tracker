import { ICON_CATEGORIES } from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
    <View className="mb-6">
      <View className="items-center mb-6">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: `${color}20` }}
        >
          <Ionicons name={selectedIcon as any} size={36} color={color} />
        </View>
        <Text className="text-textMuted text-xs mb-2">Tap to change</Text>
      </View>

      <View className="gap-6 px-2">
        {ICON_CATEGORIES.map((category) => (
          <View key={category.title}>
            <Text className="text-textSecondary text-sm font-bold mb-3">
              {category.title}
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {category.icons.map((icon) => {
                const isActive = selectedIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => onSelect(icon)}
                    className={`h-12 w-12 items-center justify-center rounded-xl bg-surface border ${
                      isActive ? "border-primary" : "border-cardBorder"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={icon as any}
                      size={24}
                      color={isActive ? color : "#6b7280"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
