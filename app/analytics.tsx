import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useHabitStore } from "@/store/useHabitStore";
import { calculateStreak } from "@/utils/streak";
import StatCard from "@/components/analytics/StatCard";
import TrendChart from "@/components/analytics/TrendChart";
import BestDaysChart from "@/components/analytics/BestDaysChart";
import InsightsCard from "@/components/analytics/InsightsCard";
import MonthlyHistory from "@/components/analytics/MonthlyHistory";
import StreakHistory from "@/components/analytics/StreakHistory";

export default function AnalyticsScreen() {
  const params = useLocalSearchParams<{ habitId?: string }>();
  const { habits, logs } = useHabitStore();

  const activeHabits = habits.filter((h) => !h.archived);

  // Find current habit index or default to first
  const initialIndex = params.habitId
    ? activeHabits.findIndex((h) => h.id === params.habitId)
    : 0;
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
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
      habit.completionTargetEnabled ? habit.targetCount : 1
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
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Ionicons name="analytics" size={48} color="#6b7280" />
        <Text className="text-textMuted text-lg mt-4">No habits to analyze</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-bold text-base">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <Ionicons name="trending-up" size={24} color="#22c55e" />
          <Text className="text-white text-xl font-bold ml-2">Analytics</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color="white" />
        </TouchableOpacity>
      </View>

      {/* Habit Switcher */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          hitSlop={12}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentIndex === 0 ? "#374151" : "white"}
          />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <Ionicons
              name={habit.icon as any}
              size={16}
              color={habit.color}
            />
          </View>
          <Text className="text-white font-bold text-lg">{habit.name}</Text>
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
              currentIndex === activeHabits.length - 1 ? "#374151" : "white"
            }
          />
        </TouchableOpacity>
      </View>

      {/* Dots Indicator */}
      <View className="flex-row items-center justify-center gap-1 mb-4">
        <Text className="text-textMuted text-xs mr-2">
          {currentIndex + 1} of {activeHabits.length}
        </Text>
        {activeHabits.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 rounded-full ${
              i === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-textMuted"
            }`}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards */}
        <View className="flex-row gap-3 mb-6">
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
            iconColor="#22c55e"
            bgColor="#22c55e"
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