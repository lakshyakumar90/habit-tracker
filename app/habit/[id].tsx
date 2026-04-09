import HabitGrid from "@/components/habits/HabitGrid";
import WeeklyView from "@/components/habits/WeeklyView";
import { getAppTheme } from "@/constants/appThemes";
import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { calculateStreak } from "@/utils/streak";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, logs } = useHabitStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  const habit = habits.find((h) => h.id === id);

  const streak = useMemo(() => {
    if (!habit)
      return { current: 0, best: 0, totalCompletions: 0, streakHistory: [] };
    return calculateStreak(
      logs,
      habit.id,
      habit.completionTargetEnabled ? habit.targetCount : 1,
    );
  }, [habit, logs]);

  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-white text-lg">Habit not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="font-bold" style={{ color: appTheme.primary }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            habitRepository.deleteHabit(habit.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleArchive = () => {
    Alert.alert("Archive Habit", `Archive "${habit.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => {
          habitRepository.archiveHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1 ml-4">
          {habit.name}
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/analytics",
              params: { habitId: habit.id },
            })
          }
          hitSlop={12}
        >
          <Ionicons name="stats-chart" size={22} color={appTheme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Icon + Info */}
        <View className="items-center my-6">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <Ionicons name={habit.icon as any} size={36} color={habit.color} />
          </View>
          <Text className="text-white text-2xl font-bold">{habit.name}</Text>
          <Text className="text-textMuted text-sm mt-1">
            {habit.type === "check" ? "Checkmark" : "Time Tracked"} •{" "}
            {habit.frequency === "daily" ? "Daily" : "Weekly"}
          </Text>
          {habit.category ? (
            <View
              className="px-3 py-1 rounded-full mt-2 border"
              style={{
                backgroundColor: appTheme.surface,
                borderColor: appTheme.cardBorder,
              }}
            >
              <Text className="text-textSecondary text-xs">
                {habit.category}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 rounded-2xl border p-4 items-center"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
          >
            <Ionicons name="flame" size={24} color="#f59e0b" />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.current}
            </Text>
            <Text className="text-textMuted text-xs">Current Streak</Text>
          </View>
          <View
            className="flex-1 rounded-2xl border p-4 items-center"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
          >
            <Ionicons name="trophy" size={24} color="#eab308" />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.best}
            </Text>
            <Text className="text-textMuted text-xs">Best Streak</Text>
          </View>
          <View
            className="flex-1 rounded-2xl border p-4 items-center"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={appTheme.primary}
            />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.totalCompletions}
            </Text>
            <Text className="text-textMuted text-xs">Completions</Text>
          </View>
        </View>

        {/* Grid */}
        <View
          className="rounded-2xl border p-4 mb-6"
          style={{
            backgroundColor: appTheme.card,
            borderColor: appTheme.cardBorder,
          }}
        >
          <Text className="text-white font-bold mb-3">Activity</Text>
          <HabitGrid habitId={habit.id} color={habit.color} months={5} />
        </View>

        {/* Weekly Progress */}
        <View
          className="rounded-2xl border p-4 mb-6"
          style={{
            backgroundColor: appTheme.card,
            borderColor: appTheme.cardBorder,
          }}
        >
          <Text className="text-white font-bold mb-1">This Week</Text>
          <WeeklyView habitId={habit.id} color={habit.color} />
        </View>

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/analytics",
                params: { habitId: habit.id },
              })
            }
            className="rounded-2xl border p-4 flex-row items-center"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics" size={22} color={appTheme.primary} />
            <Text className="text-white font-medium ml-3 flex-1">
              View Analytics
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleArchive}
            className="rounded-2xl border p-4 flex-row items-center"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="archive" size={22} color="#f59e0b" />
            <Text className="text-white font-medium ml-3 flex-1">
              Archive Habit
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="rounded-2xl border border-red-500/20 p-4 flex-row items-center"
            style={{ backgroundColor: appTheme.card }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={22} color="#ef4444" />
            <Text className="text-red-400 font-medium ml-3 flex-1">
              Delete Habit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
