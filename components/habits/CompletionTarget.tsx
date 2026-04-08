import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomSwitch from "@/components/common/CustomSwitch";
import { FrequencyType } from "@/types";

interface CompletionTargetProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  frequency: FrequencyType;
  onFrequencyChange: (f: FrequencyType) => void;
  targetCount: number;
  onTargetChange: (n: number) => void;
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

export default function CompletionTarget({
  enabled,
  onToggle,
  frequency,
  onFrequencyChange,
  targetCount,
  onTargetChange,
  selectedDays,
  onDaysChange,
}: CompletionTargetProps) {
  return (
    <View>
      {/* Toggle */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-white font-semibold text-base">
            Completion Target
          </Text>
          <Text className="text-textMuted text-sm">
            Set a daily or weekly goal for this habit
          </Text>
        </View>
        <CustomSwitch value={enabled} onValueChange={onToggle} />
      </View>

      {enabled && (
        <View className="bg-surface rounded-2xl border border-cardBorder p-4">
          {/* Daily / Weekly Toggle */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => onFrequencyChange("daily")}
              className={`flex-1 p-3 rounded-xl border ${
                frequency === "daily"
                  ? "bg-primary/10 border-primary"
                  : "border-cardBorder"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="calendar"
                  size={16}
                  color={frequency === "daily" ? "#22c55e" : "#6b7280"}
                />
                <Text
                  className={`ml-2 font-bold ${
                    frequency === "daily" ? "text-primary" : "text-textMuted"
                  }`}
                >
                  Daily
                </Text>
                {frequency === "daily" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#22c55e"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </View>
              <Text className="text-textMuted text-xs">
                Complete multiple times each day
              </Text>
              <Text className="text-primary text-xs mt-1 italic">
                e.g., Drink water 8× daily
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onFrequencyChange("weekly")}
              className={`flex-1 p-3 rounded-xl border ${
                frequency === "weekly"
                  ? "bg-primary/10 border-primary"
                  : "border-cardBorder"
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={frequency === "weekly" ? "#22c55e" : "#6b7280"}
                />
                <Text
                  className={`ml-2 font-bold ${
                    frequency === "weekly" ? "text-primary" : "text-textMuted"
                  }`}
                >
                  Weekly
                </Text>
                {frequency === "weekly" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color="#22c55e"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </View>
              <Text className="text-textMuted text-xs">
                Complete certain days per week
              </Text>
              <Text className="text-primary text-xs mt-1 italic">
                e.g., Exercise 3× per week
              </Text>
            </TouchableOpacity>
          </View>

          {/* Counter */}
          <View className="bg-card rounded-xl p-3 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">
                Times per {frequency === "daily" ? "day" : "week"}
              </Text>
              <Text className="text-textMuted text-xs">
                How many times to complete {frequency === "daily" ? "daily" : "weekly"}?
              </Text>
            </View>
                        <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => onTargetChange(Math.max(1, targetCount - 1))}
                className="w-10 h-10 rounded-lg bg-surface items-center justify-center border border-cardBorder"
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color="#6b7280" />
              </TouchableOpacity>

              <Text className="text-primary text-xl font-bold w-8 text-center">
                {targetCount}
              </Text>

              <TouchableOpacity
                onPress={() => onTargetChange(targetCount + 1)}
                className="w-10 h-10 rounded-lg bg-primary/20 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}


            