import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useHabitStore } from "@/store/useHabitStore";
import { calculateStreak } from "@/utils/streak";
import HabitGrid from "@/components/habits/HabitGrid";
import WeeklyView from "@/components/habits/WeeklyView";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, logs, deleteHabit, archiveHabit } = useHabitStore();

  const habit = habits.find((h) => h.id === id);

  const streak = useMemo(() => {
    if (!habit) return { current: 0, best: 0, totalCompletions: 0, streakHistory: [] };
    return calculateStreak(logs, habit.id, habit.completionTargetEnabled ? habit.targetCount : 1);
  }, [habit, logs]);

  if (!habit) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-white text-lg">Habit not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Habit", `Are you sure you want to delete "${habit.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  const handleArchive = () => {
    Alert.alert("Archive Habit", `Archive "${habit.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => {
          archiveHabit(habit.id);
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
          onPress={() => router.push({ pathname: "/analytics", params: { habitId: habit.id } })}
          hitSlop={12}
        >
          <Ionicons name="stats-chart" size={22} color="#22c55e" />
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
            <Ionicons
              name={habit.icon as any}
              size={36}
              color={habit.color}
            />
          </View>
          <Text className="text-white text-2xl font-bold">{habit.name}</Text>
          <Text className="text-textMuted text-sm mt-1">
            {habit.type === "check" ? "Checkmark" : "Time Tracked"} •{" "}
            {habit.frequency === "daily" ? "Daily" : "Weekly"}
          </Text>
          {habit.category ? (
            <View className="bg-surface px-3 py-1 rounded-full mt-2 border border-cardBorder">
              <Text className="text-textSecondary text-xs">{habit.category}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-card rounded-2xl border border-cardBorder p-4 items-center">
            <Ionicons name="flame" size={24} color="#f59e0b" />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.current}
            </Text>
            <Text className="text-textMuted text-xs">Current Streak</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl border border-cardBorder p-4 items-center">
            <Ionicons name="trophy" size={24} color="#eab308" />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.best}
            </Text>
            <Text className="text-textMuted text-xs">Best Streak</Text>
          </View>
          <View className="flex-1 bg-card rounded-2xl border border-cardBorder p-4 items-center">
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            <Text className="text-white text-2xl font-bold mt-1">
              {streak.totalCompletions}
            </Text>
            <Text className="text-textMuted text-xs">Completions</Text>
          </View>
        </View>

        {/* Grid */}
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-6">
          <Text className="text-white font-bold mb-3">Activity</Text>
          <HabitGrid habitId={habit.id} color={habit.color} months={5} />
        </View>

        {/* Weekly Progress */}
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-6">
          <Text className="text-white font-bold mb-1">This Week</Text>
          <WeeklyView habitId={habit.id} color={habit.color} />
        </View>

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: "/analytics", params: { habitId: habit.id } })
            }
            className="bg-card rounded-2xl border border-cardBorder p-4 flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="analytics" size={22} color="#22c55e" />
            <Text className="text-white font-medium ml-3 flex-1">
              View Analytics
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleArchive}
            className="bg-card rounded-2xl border border-cardBorder p-4 flex-row items-center"
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
            className="bg-card rounded-2xl border border-red-500/20 p-4 flex-row items-center"
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