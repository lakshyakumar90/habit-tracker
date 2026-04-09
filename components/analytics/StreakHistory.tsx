import GlowCard from "@/components/common/GlowCard";
import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import React from "react";
import { Text, View } from "react-native";

interface StreakHistoryProps {
  streakHistory: { start: string; end: string; days: number }[];
}

export default function StreakHistory({ streakHistory }: StreakHistoryProps) {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  if (streakHistory.length === 0) return null;

  const maxDays = Math.max(...streakHistory.map((s) => s.days));
  const BAR_MAX_WIDTH = 200;

  const formatStreakDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  const getBarColor = (index: number): string => {
    const colors = [appTheme.primary, appTheme.primaryLight, `${appTheme.primaryLight}cc`, `${appTheme.primaryLight}99`, `${appTheme.primaryLight}66`];
    return colors[Math.min(index, colors.length - 1)];
  };

  return (
    <GlowCard className="mb-8">
      <View className="flex-row items-center mb-6">
        <Ionicons name="trophy" size={20} color="#eab308" />
        <Text className="text-white font-bold text-base ml-2">
          STREAK HISTORY
        </Text>
      </View>
      <Text className="text-textMuted text-sm mb-4">
        Your consecutive day runs (most recent first)
      </Text>

      <View className="h-px bg-cardBorder mb-4" />

      {streakHistory.slice(0, 5).map((streak, i) => {
        const barWidth = (streak.days / maxDays) * BAR_MAX_WIDTH;

        return (
          <View 
            key={i} 
            className="flex-row items-center mb-4 last:mb-0"
            style={i < Math.min(streakHistory.length, 5) - 1 ? { marginBottom: 16 } : {}}
          >
            <Text className="text-textMuted text-xs w-14 text-right mr-3">
              {formatStreakDate(streak.start)}
            </Text>

            <View
              style={{
                width: Math.max(barWidth, 40),
                backgroundColor: getBarColor(i),
                borderRadius: 6,
                paddingVertical: 6,
                paddingHorizontal: 12,
                alignItems: "center",
              }}
            >
              <Text className="text-black text-xs font-bold">
                {streak.days} days
              </Text>
            </View>

            <Text className="text-textMuted text-xs ml-3">
              {formatStreakDate(streak.end)}
            </Text>
          </View>
        );
      })}
    </GlowCard>
  );
}
