import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlowCard from "@/components/common/GlowCard";
import { format } from "date-fns";

interface StreakHistoryProps {
  streakHistory: { start: string; end: string; days: number }[];
}

export default function StreakHistory({ streakHistory }: StreakHistoryProps) {
  if (streakHistory.length === 0) return null;

  const maxDays = Math.max(...streakHistory.map((s) => s.days));
  const BAR_MAX_WIDTH = 200;

  // Color gradient based on rank
  const getBarColor = (index: number): string => {
    const colors = ["#22c55e", "#4ade80", "#86efac", "#a7f3d0", "#d1fae5"];
    return colors[Math.min(index, colors.length - 1)];
  };

  const formatStreakDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  return (
    <GlowCard className="mb-6">
      <View className="flex-row items-center mb-2">
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
            className="flex-row items-center mb-3 last:mb-0"
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