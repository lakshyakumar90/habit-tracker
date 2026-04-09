import CustomSwitch from "@/components/common/CustomSwitch";
import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { FrequencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

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
        <View
          className="rounded-2xl border p-4"
          style={{
            backgroundColor: appTheme.surface,
            borderColor: appTheme.cardBorder,
          }}
        >
          {/* Daily / Weekly Toggle */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={() => onFrequencyChange("daily")}
              className="flex-1 p-3 rounded-xl border"
              style={{
                backgroundColor:
                  frequency === "daily"
                    ? `${appTheme.primary}1A`
                    : "transparent",
                borderColor:
                  frequency === "daily"
                    ? appTheme.primary
                    : appTheme.cardBorder,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="calendar"
                  size={16}
                  color={frequency === "daily" ? appTheme.primary : "#6b7280"}
                />
                <Text
                  className="ml-2 font-bold"
                  style={{
                    color:
                      frequency === "daily"
                        ? appTheme.primary
                        : appTheme.textMuted,
                  }}
                >
                  Daily
                </Text>
                {frequency === "daily" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={appTheme.primary}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </View>
              <Text className="text-textMuted text-xs">
                Complete multiple times each day
              </Text>
              <Text
                className="text-xs mt-1 italic"
                style={{ color: appTheme.primary }}
              >
                e.g., Drink water 8× daily
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onFrequencyChange("weekly")}
              className="flex-1 p-3 rounded-xl border"
              style={{
                backgroundColor:
                  frequency === "weekly"
                    ? `${appTheme.primary}1A`
                    : "transparent",
                borderColor:
                  frequency === "weekly"
                    ? appTheme.primary
                    : appTheme.cardBorder,
              }}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={frequency === "weekly" ? appTheme.primary : "#6b7280"}
                />
                <Text
                  className="ml-2 font-bold"
                  style={{
                    color:
                      frequency === "weekly"
                        ? appTheme.primary
                        : appTheme.textMuted,
                  }}
                >
                  Weekly
                </Text>
                {frequency === "weekly" && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={appTheme.primary}
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </View>
              <Text className="text-textMuted text-xs">
                Complete certain days per week
              </Text>
              <Text
                className="text-xs mt-1 italic"
                style={{ color: appTheme.primary }}
              >
                e.g., Exercise 3× per week
              </Text>
            </TouchableOpacity>
          </View>

          {/* Counter */}
          <View
            className="rounded-xl p-3 flex-row items-center justify-between"
            style={{ backgroundColor: appTheme.card }}
          >
            <View>
              <Text className="text-white font-medium">
                Times per {frequency === "daily" ? "day" : "week"}
              </Text>
              <Text className="text-textMuted text-xs">
                How many times to complete{" "}
                {frequency === "daily" ? "daily" : "weekly"}?
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => onTargetChange(Math.max(1, targetCount - 1))}
                className="w-10 h-10 rounded-lg items-center justify-center border"
                style={{
                  backgroundColor: appTheme.surface,
                  borderColor: appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color="#6b7280" />
              </TouchableOpacity>

              <Text
                className="text-xl font-bold w-8 text-center"
                style={{ color: appTheme.primary }}
              >
                {targetCount}
              </Text>

              <TouchableOpacity
                onPress={() => onTargetChange(targetCount + 1)}
                className="w-10 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: `${appTheme.primary}33` }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={appTheme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
