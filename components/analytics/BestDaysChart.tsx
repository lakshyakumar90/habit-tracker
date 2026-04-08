import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHabitStore } from "@/store/useHabitStore";
import GlowCard from "@/components/common/GlowCard";

interface BestDaysChartProps {
  habitId: string;
}

export default function BestDaysChart({ habitId }: BestDaysChartProps) {
  const { logs } = useHabitStore();

  const dayStats = useMemo(() => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    const fullDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayCounts: number[] = Array(7).fill(0);
    const dayTotals: number[] = Array(7).fill(0);

    Object.entries(logs).forEach(([key, value]) => {
      if (!key.startsWith(`${habitId}_`)) return;
      const dateStr = key.replace(`${habitId}_`, "");
      const date = new Date(dateStr);
      const dow = date.getDay(); // 0=Sun
      const idx = dow === 0 ? 6 : dow - 1; // Mon=0, Sun=6
      dayTotals[idx]++;
      if (value > 0) dayCounts[idx]++;
    });

    const result = days.map((d, i) => {
      const pct = dayTotals[i] > 0 ? Math.round((dayCounts[i] / dayTotals[i]) * 100) : 0;
      return { label: d, fullLabel: fullDays[i], percentage: pct };
    });

    return result;
  }, [habitId, logs]);

  const bestDay = dayStats.reduce(
    (best, day) => (day.percentage > best.percentage ? day : best),
    dayStats[0]
  );

  const maxPct = Math.max(...dayStats.map((d) => d.percentage), 1);
  const BAR_MAX_HEIGHT = 80;

  return (
    <GlowCard className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-white mr-2">📊</Text>
          <Text className="text-white font-bold text-base">BEST DAYS</Text>
        </View>
        <View className="flex-row items-center bg-surface px-3 py-1 rounded-full border border-cardBorder">
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text className="text-primary text-xs font-medium ml-1">
            {bestDay.fullLabel}
          </Text>
        </View>
      </View>

      {/* Bars */}
      <View className="flex-row items-end justify-between px-2">
        {dayStats.map((day, i) => {
          const height =
            day.percentage > 0
              ? (day.percentage / maxPct) * BAR_MAX_HEIGHT
              : 4;
          const isBest = day.percentage === bestDay.percentage && day.percentage > 0;

          return (
            <View key={i} className="items-center flex-1">
              {/* Percentage Label */}
              <Text
                className={`text-[10px] mb-1 font-medium ${
                  isBest ? "text-primary" : "text-textMuted"
                }`}
              >
                {day.percentage}%
              </Text>

              {/* Bar */}
              <View
                style={{
                  height,
                  width: "70%",
                  backgroundColor: isBest ? "#22c55e" : "#2a3a30",
                  borderRadius: 4,
                  minHeight: 4,
                }}
              />

              {/* Day Label */}
              <Text
                className={`text-xs mt-2 font-medium ${
                  isBest ? "text-primary" : "text-textMuted"
                }`}
              >
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </GlowCard>
  );
}