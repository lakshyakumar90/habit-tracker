import { useHabitStore } from "@/store/useHabitStore";
import { Habit } from "@/types";
import { calculateStreak } from "@/utils/streak";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring
} from "react-native-reanimated";
import HabitGrid from "./HabitGrid";
import WeeklyView from "./WeeklyView";

interface HabitCardProps {
  habit: Habit;
}

export default function HabitCard({ habit }: HabitCardProps) {
  const { selectedDate, viewMode, toggleHabit, isHabitCompletedOnDate, logs } =
    useHabitStore();

  const isCompleted = isHabitCompletedOnDate(habit.id, selectedDate);
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  const streak = useMemo(() => {
    return calculateStreak(
      logs,
      habit.id,
      habit.completionTargetEnabled ? habit.targetCount : 1,
    );
  }, [logs, habit.id, habit.targetCount, habit.completionTargetEnabled]);

  const handleToggle = useCallback(() => {
    // Prevent toggle for future dates
    const targetDate = new Date(selectedDate);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) return;

    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScale.value = withSequence(withSpring(1.2), withSpring(1));
    }
    toggleHabit(habit.id, selectedDate);
  }, [habit.id, selectedDate, toggleHabit, isCompleted, checkScale]);

  const handlePress = useCallback(() => {
    router.push({ pathname: "/habit/[id]", params: { id: habit.id } });
  }, [habit.id]);

  const handleMore = useCallback(() => {
    router.push({ pathname: "/analytics", params: { habitId: habit.id } });
  }, [habit.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isCompleted ? checkScale.value : 1 }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          shadowColor: habit.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
      className="bg-card rounded-2xl mx-4 mb-3 p-4 border border-cardBorder"
    >
      {/* Top Row */}
      <Pressable
        className="flex-row items-center justify-between mb-2 pb-1"
        onPress={handlePress}
        onPressIn={() => (scale.value = withSpring(0.97))}
        onPressOut={() => (scale.value = withSpring(1))}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: `${habit.color}20` }}
          >
            <Ionicons name={habit.icon as any} size={22} color={habit.color} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white font-bold text-base">{habit.name}</Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="flame" size={13} color="#f59e0b" />
              <Text className="text-textSecondary text-xs ml-1">
                Streak: {streak.current}
              </Text>
            </View>
          </View>
        </View>

        {/* Check Button */}
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-11 h-11 rounded-xl items-center justify-center ${
            isCompleted ? "" : "bg-surface border border-cardBorder"
          }`}
          style={isCompleted ? { backgroundColor: habit.color } : {}}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Animated.View style={checkStyle}>
            <Ionicons
              name="checkmark"
              size={22}
              color={isCompleted ? "white" : "#4b5563"}
            />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMore} className="ml-3" hitSlop={12}>
          <Ionicons name="ellipsis-vertical" size={18} color="#6b7280" />
        </TouchableOpacity>
      </Pressable>

      {/* Grid or Weekly based on mode */}
      {viewMode === "tick" && (
        <HabitGrid habitId={habit.id} color={habit.color} />
      )}
      {viewMode === "weekly" && (
        <WeeklyView habitId={habit.id} color={habit.color} />
      )}
      {viewMode === "time" && habit.type === "time" && (
        <HabitGrid habitId={habit.id} color={habit.color} />
      )}
    </Animated.View>
  );
}
