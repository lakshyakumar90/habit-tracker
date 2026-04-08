import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useHabitStore } from "@/store/useHabitStore";
import { getLast30Days, formatDate } from "@/utils/dates";
import GlowCard from "@/components/common/GlowCard";

interface TrendChartProps {
  habitId: string;
  color: string;
}

export default function TrendChart({ habitId, color }: TrendChartProps) {
  const { logs } = useHabitStore();

  const data = useMemo(() => {
    const days = getLast30Days();
    let cumulativeCompletions = 0;
    return days.map((day) => {
      const dateStr = formatDate(day);
      const key = `${habitId}_${dateStr}`;
      const completed = (logs[key] || 0) > 0;
      if (completed) cumulativeCompletions++;
      return {
        dateStr,
        completed,
        cumulative: cumulativeCompletions,
      };
    });
  }, [habitId, logs]);

  const maxVal = Math.max(...data.map((d) => d.cumulative), 1);
  const CHART_HEIGHT = 120;
  const CHART_WIDTH = 280;

  // Build SVG-like path using View positioning
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - (d.cumulative / maxVal) * CHART_HEIGHT,
  }));

  return (
    <GlowCard glowColor={color} className="mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Text className="text-primary text-lg mr-2">📈</Text>
          <Text className="text-white font-bold text-base">TREND</Text>
        </View>
        <View className="bg-surface px-3 py-1 rounded-full border border-cardBorder">
          <Text className="text-primary text-xs font-medium">30 days</Text>
        </View>
      </View>

      {/* Simple bar chart representation */}
      <View
        style={{ height: CHART_HEIGHT }}
        className="flex-row items-end justify-between"
      >
        {data.map((d, i) => {
          // Show every other bar for cleaner look
          if (i % 2 !== 0 && data.length > 20) return null;
          const height = (d.cumulative / maxVal) * CHART_HEIGHT;
          return (
            <View
              key={i}
              style={{
                height: Math.max(height, 2),
                width: data.length > 20 ? 4 : 6,
                backgroundColor: d.completed ? color : `${color}30`,
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>

      {/* Dot at the end */}
      <View className="flex-row justify-end mt-1">
        <View
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </View>
    </GlowCard>
  );
}