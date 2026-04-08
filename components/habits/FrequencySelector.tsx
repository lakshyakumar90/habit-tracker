import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FrequencyType } from "@/types";

interface FrequencySelectorProps {
  frequency: FrequencyType;
  onSelect: (freq: FrequencyType) => void;
}

export default function FrequencySelector({
  frequency,
  onSelect,
}: FrequencySelectorProps) {
  return (
    <View>
      <Text className="text-white font-medium text-base mb-3">Frequency</Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => onSelect("daily")}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
            frequency === "daily"
              ? "bg-primary/10 border-primary"
              : "bg-surface border-cardBorder"
          }`}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={frequency === "daily" ? "#22c55e" : "#6b7280"}
          />
          <Text
            className={`ml-2 font-semibold ${
              frequency === "daily" ? "text-white" : "text-textMuted"
            }`}
          >
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelect("weekly")}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
            frequency === "weekly"
              ? "bg-primary/10 border-primary"
              : "bg-surface border-cardBorder"
          }`}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={frequency === "weekly" ? "#22c55e" : "#6b7280"}
          />
          <Text
            className={`ml-2 font-semibold ${
              frequency === "weekly" ? "text-white" : "text-textMuted"
            }`}
          >
            Weekly
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}