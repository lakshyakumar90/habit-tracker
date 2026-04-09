import BestDaysChart from "@/components/analytics/BestDaysChart";
import InsightsCard from "@/components/analytics/InsightsCard";
import MonthlyHistory from "@/components/analytics/MonthlyHistory";
import StatCard from "@/components/analytics/StatCard";
import StreakHistory from "@/components/analytics/StreakHistory";
import TrendChart from "@/components/analytics/TrendChart";
import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { calculateStreak } from "@/utils/streak";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  const params = useLocalSearchParams<{ habitId?: string }>();
  const { habits, logs } = useHabitStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  const activeHabits = habits.filter((h) => !h.archived);

  // Find current habit index or default to first
  const initialIndex = params.habitId
    ? activeHabits.findIndex((h) => h.id === params.habitId)
    : 0;
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  );

  const habit = activeHabits[currentIndex];

  const streak = useMemo(() => {
    if (!habit)
      return {
        current: 0,
        best: 0,
        totalCompletions: 0,
        streakHistory: [],
      };
    return calculateStreak(
      logs,
      habit.id,
      habit.completionTargetEnabled ? habit.targetCount : 1,
    );
  }, [habit, logs]);

  const goNext = () => {
    if (currentIndex < activeHabits.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!habit || activeHabits.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: appTheme.background }}
      >
        <Ionicons name="analytics" size={48} color={appTheme.textMuted} />
        <Text className="text-lg mt-4" style={{ color: appTheme.textMuted }}>
          No habits to analyze
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text
            className="font-bold text-base"
            style={{ color: appTheme.primary }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: appTheme.background }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-8 pb-5">
        <View className="flex-row items-center">
          <Ionicons name="trending-up" size={24} color={appTheme.primary} />
          <Text
            className="text-2xl font-bold ml-2"
            style={{ color: appTheme.textPrimary }}
          >
            Analytics
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={appTheme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Habit Switcher */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={
              currentIndex === 0 ? appTheme.cardBorder : appTheme.textPrimary
            }
          />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <Ionicons name={habit.icon as any} size={16} color={habit.color} />
          </View>
          <Text
            className="font-bold text-lg"
            style={{ color: appTheme.textPrimary }}
          >
            {habit.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={goNext}
          disabled={currentIndex === activeHabits.length - 1}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={
              currentIndex === activeHabits.length - 1
                ? appTheme.cardBorder
                : appTheme.textPrimary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Dots Indicator */}
      <View className="flex-row items-center justify-center gap-1 mb-8 mt-2">
        <Text className="text-xs mr-2" style={{ color: appTheme.textMuted }}>
          {currentIndex + 1} of {activeHabits.length}
        </Text>
        {activeHabits.map((_, i) => (
          <View
            key={i}
            className={
              i === currentIndex
                ? "h-1.5 w-5 rounded-full"
                : "h-1.5 w-1.5 rounded-full"
            }
            style={{
              backgroundColor:
                i === currentIndex ? appTheme.primary : appTheme.textMuted,
            }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards */}
        <View className="flex-row gap-4 mb-8 mt-4">
          <StatCard
            icon="flame"
            iconColor="#f59e0b"
            bgColor="#f59e0b"
            value={streak.current}
            label="current streak"
          />
          <StatCard
            icon="trophy"
            iconColor="#eab308"
            bgColor="#eab308"
            value={streak.best}
            label="best streak"
          />
          <StatCard
            icon="checkmark-circle"
            iconColor={appTheme.primary}
            bgColor={appTheme.primary}
            value={streak.totalCompletions}
            label="completions"
          />
        </View>

        {/* Trend Chart */}
        <TrendChart habitId={habit.id} color={habit.color} />

        {/* Best Days */}
        <BestDaysChart habitId={habit.id} />

        {/* Insights */}
        <InsightsCard streak={streak} habitId={habit.id} />

        {/* Monthly History */}
        <MonthlyHistory habitId={habit.id} />

        {/* Streak History */}
        <StreakHistory streakHistory={streak.streakHistory} />
      </ScrollView>
    </SafeAreaView>
  );
}
