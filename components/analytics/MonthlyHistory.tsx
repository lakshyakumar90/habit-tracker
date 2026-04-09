import GlowCard from "@/components/common/GlowCard";
import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatDate, getLast5Months } from "@/utils/dates";
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

interface MonthlyHistoryProps {
  habitId: string;
}

export default function MonthlyHistory({ habitId }: MonthlyHistoryProps) {
  const { logs } = useHabitStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  const months = useMemo(() => {
    const last5 = getLast5Months();
    return last5.map(({ month, date }) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const days = eachDayOfInterval({ start, end });
      let completed = 0;
      let total = days.length;

      days.forEach((day) => {
        const dateStr = formatDate(day);
        const key = `${habitId}_${dateStr}`;
        if ((logs[key] || 0) > 0) completed++;
      });

      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { month, percentage: pct };
    });
  }, [habitId, logs]);

  const maxPct = Math.max(...months.map((m) => m.percentage), 1);
  const BAR_HEIGHT = 80;

  return (
    <GlowCard className="mb-8">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">📅</Text>
          <Text className="text-white font-bold text-base">
            MONTHLY HISTORY
          </Text>
        </View>
        <Text className="text-textMuted text-xs">5 months</Text>
      </View>

      <View className="flex-row items-end justify-between px-4">
        {months.map((m, i) => {
          const height =
            m.percentage > 0 ? (m.percentage / maxPct) * BAR_HEIGHT : 4;
          const isLatest = i === months.length - 1;

          return (
            <View key={i} className="items-center flex-1">
              <Text
                className="text-[10px] mb-1 font-medium"
                style={{
                  color: isLatest ? appTheme.primary : appTheme.textMuted,
                }}
              >
                {m.percentage}%
              </Text>
              <View
                style={{
                  height,
                  width: "60%",
                  backgroundColor: isLatest
                    ? appTheme.primary
                    : appTheme.surface,
                  borderRadius: 4,
                  minHeight: 4,
                }}
              />
              <Text
                className="text-xs mt-2 font-medium"
                style={{
                  color: isLatest ? appTheme.primary : appTheme.textMuted,
                }}
              >
                {m.month}
              </Text>
            </View>
          );
        })}
      </View>
    </GlowCard>
  );
}
