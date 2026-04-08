import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HABIT_COLORS } from "@/constants/Colors";

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export default function ColorPicker({
  selectedColor,
  onSelect,
}: ColorPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const displayColors = showAll ? HABIT_COLORS : HABIT_COLORS.slice(0, 6);

  return (
    <View>
      <View className="flex-row items-center mb-3">
        <Ionicons name="color-palette-outline" size={18} color="#9ca3af" />
        <Text className="text-white font-medium text-base ml-2">Color</Text>
      </View>
      <View className="bg-surface rounded-2xl p-4 border border-cardBorder">
        <ScrollView horizontal={!showAll} showsHorizontalScrollIndicator={false}>
          <View className={showAll ? "flex-row flex-wrap gap-3" : "flex-row gap-3"}>
            {displayColors.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => onSelect(color)}
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  selectedColor === color ? "border-2 border-white" : ""
                }`}
                style={{ backgroundColor: color }}
                activeOpacity={0.7}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={18} color="white" />
                )}
              </TouchableOpacity>
            ))}
            {!showAll && (
              <TouchableOpacity
                onPress={() => setShowAll(true)}
                className="w-11 h-11 rounded-full items-center justify-center bg-card border border-cardBorder"
                activeOpacity={0.7}
              >
                <Text className="text-primary text-[10px] font-bold">+30</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}