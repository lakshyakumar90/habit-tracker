import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { FrequencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface FrequencySelectorProps {
  frequency: FrequencyType;
  onSelect: (freq: FrequencyType) => void;
}

export default function FrequencySelector({
  frequency,
  onSelect,
}: FrequencySelectorProps) {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  return (
    <View>
      <Text className="text-white font-medium text-base mb-3">Frequency</Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => onSelect("daily")}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
          style={{
            backgroundColor:
              frequency === "daily"
                ? `${appTheme.primary}1A`
                : appTheme.surface,
            borderColor:
              frequency === "daily" ? appTheme.primary : appTheme.cardBorder,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={frequency === "daily" ? appTheme.primary : "#6b7280"}
          />
          <Text
            className="ml-2 font-semibold"
            style={{
              color:
                frequency === "daily"
                  ? appTheme.textPrimary
                  : appTheme.textMuted,
            }}
          >
            Daily
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelect("weekly")}
          className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
          style={{
            backgroundColor:
              frequency === "weekly"
                ? `${appTheme.primary}1A`
                : appTheme.surface,
            borderColor:
              frequency === "weekly" ? appTheme.primary : appTheme.cardBorder,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={frequency === "weekly" ? appTheme.primary : "#6b7280"}
          />
          <Text
            className="ml-2 font-semibold"
            style={{
              color:
                frequency === "weekly"
                  ? appTheme.textPrimary
                  : appTheme.textMuted,
            }}
          >
            Weekly
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
