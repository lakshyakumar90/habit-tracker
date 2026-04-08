import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlowCard from "@/components/common/GlowCard";
import { StreakResult } from "@/utils/streak";
import { useHabitStore } from "@/store/useHabitStore";

interface InsightsCardProps {
  streak: StreakResult;
  habitId: string;
}

export default function InsightsCard({ streak, habitId }: InsightsCardProps) {
  const { logs } = useHabitStore();

  const insights = useMemo(() => {
    const items: { icon: string; color: string; title: string; subtitle: string }[] = [];

    // Streak insight
    if (streak.current > 0) {
      const toGo = streak.best - streak.current;
      items.push({
        icon: "flame",
        color: "#f59e0b",
        title: `${streak.current} day streak`,
        subtitle:
          toGo > 0
            ? `Great consistency! ${toGo} more days to beat your record.`
            : `You're at your best streak! Keep going!`,
      });
    }

    // Best day insight
    const dayCounts: number[] = Array(7).fill(0);
    const dayTotals: number[] = Array(7).fill(0);
    const fullDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    Object.entries(logs).forEach(([key, value]) => {
      if (!key.startsWith(`${habitId}_`)) return;
      const dateStr = key.replace(`${habitId}_`, "");
      const date = new Date(dateStr);
      const dow = date.getDay();
      const idx = dow === 0 ? 6 : dow - 1;
      dayTotals[idx]++;
      if (value > 0) dayCounts[idx]++;
    });

    let bestDayIdx = 0;
    let bestPct = 0;
    dayCounts.forEach((count, i) => {
      const pct = dayTotals[i] > 0 ? (count / dayTotals[i]) * 100 : 0;
      if (pct > bestPct) {
        bestPct = pct;
        bestDayIdx = i;
      }
    });

    if (bestPct > 0) {
      items.push({
        icon: "calendar",
        color: "#22c55e",
        title: `${fullDays[bestDayIdx]}s are your day`,
        subtitle: `${Math.round(bestPct)}% completion rate on ${fullDays[bestDayIdx]}s.`,
      });
    }

    // Overall progress
    const totalDays = Object.keys(logs).filter(
      (k) => k.startsWith(`${habitId}_`)
    ).length;
    const completedDays = Object.entries(logs).filter(
      ([k, v]) => k.startsWith(`${habitId}_`) && v > 0
    ).length;
    const overallPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    if (totalDays > 0) {
      items.push({
        icon: "thumbs-up",
        color: "#3b82f6",
        title: overallPct >= 70 ? "Good progress" : "Keep pushing",
        subtitle: `${overallPct}% completion rate. ${
          overallPct >= 70 ? "Keep pushing!" : "You can do better!"
        }`,
      });
    }

    return items;
  }, [streak, habitId, logs]);

  if (insights.length === 0) return null;

  return (
    <GlowCard className="mb-6">
      <View className="flex-row items-center mb-4">
        <Text className="text-lg mr-2">💡</Text>
        <Text className="text-white font-bold text-base">INSIGHTS</Text>
      </View>

      <View className="h-px bg-cardBorder mb-4" />

      {insights.map((insight, i) => (
        <View key={i} className="flex-row items-start mb-4 last:mb-0">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${insight.color}20` }}
          >
            <Ionicons
              name={insight.icon as any}
              size={18}
              color={insight.color}
            />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">{insight.title}</Text>
            <Text className="text-textMuted text-sm mt-0.5">
              {insight.subtitle}
            </Text>
          </View>
        </View>
      ))}
    </GlowCard>
  );
}