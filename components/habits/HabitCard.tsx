import { habitRepository } from "@/services/habitRepository";
import { useCelebrationStore } from "@/store/useCelebrationStore";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Habit } from "@/types";
import { playAppSound } from "@/utils/sound";
import { calculateStreak } from "@/utils/streak";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
    ActionSheetIOS,
    Alert,
    Platform,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from "react-native-reanimated";
import HabitGrid from "./HabitGrid";
import WeeklyView from "./WeeklyView";

interface HabitCardProps {
  habit: Habit;
}

export default function HabitCard({ habit }: HabitCardProps) {
  const {
    selectedDate,
    viewMode,
    isHabitCompletedOnDate,
    logs,
    getWeekProgress,
  } = useHabitStore();
  const settings = useSettingsStore();
  const triggerCelebration = useCelebrationStore((state) => state.triggerBurst);

  const isCompleted = isHabitCompletedOnDate(habit.id, selectedDate);
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const weekProgress = getWeekProgress(habit.id, selectedDate);

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

    const beforeWeek = getWeekProgress(habit.id, selectedDate).completedDays;
    const wasCompleted = isHabitCompletedOnDate(habit.id, selectedDate);

    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScale.value = withSequence(withSpring(1.2), withSpring(1));
    }

    habitRepository.toggleHabit(habit.id, selectedDate);

    const habitState = useHabitStore.getState();
    const afterWeek = habitState.getWeekProgress(
      habit.id,
      selectedDate,
    ).completedDays;
    const nowCompleted = habitState.isHabitCompletedOnDate(
      habit.id,
      selectedDate,
    );

    if (
      !wasCompleted &&
      nowCompleted &&
      settings.soundEnabled &&
      settings.tickSoundEnabled
    ) {
      playAppSound("pop", Math.max(0.1, settings.celebrationVolume * 0.7));
    }

    if (settings.celebrationsEnabled && beforeWeek < 6 && afterWeek >= 6) {
      if (settings.confettiEnabled) {
        triggerCelebration();
      }

      if (settings.soundEnabled) {
        playAppSound(settings.celebrationSound, settings.celebrationVolume);
      }
    }
  }, [
    checkScale,
    getWeekProgress,
    habit.id,
    isCompleted,
    isHabitCompletedOnDate,
    selectedDate,
    settings.celebrationSound,
    settings.celebrationVolume,
    settings.celebrationsEnabled,
    settings.confettiEnabled,
    settings.soundEnabled,
    settings.tickSoundEnabled,
    triggerCelebration,
  ]);

  const handlePress = useCallback(() => {
    router.push({ pathname: "/habit/[id]", params: { id: habit.id } });
  }, [habit.id]);

  const handleMore = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Cancel",
            "View Analytics",
            "Edit",
            habit.archived ? "Unarchive" : "Archive",
            "Delete",
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 4,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            router.push({
              pathname: "/analytics",
              params: { habitId: habit.id },
            });
          } else if (buttonIndex === 2) {
            router.push({ pathname: "/add-habit", params: { id: habit.id } });
          } else if (buttonIndex === 3) {
            habitRepository.updateHabit(habit.id, {
              archived: !habit.archived,
            });
          } else if (buttonIndex === 4) {
            Alert.alert(
              "Delete Habit",
              "Are you sure you want to delete this habit?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  onPress: () => habitRepository.deleteHabit(habit.id),
                  style: "destructive",
                },
              ],
            );
          }
        },
      );
    } else {
      Alert.alert(
        "Manage Habit",
        "Choose an action",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Analytics",
            onPress: () =>
              router.push({
                pathname: "/analytics",
                params: { habitId: habit.id },
              }),
          },
          {
            text: "Edit",
            onPress: () =>
              router.push({ pathname: "/add-habit", params: { id: habit.id } }),
          },
          {
            text: habit.archived ? "Unarchive" : "Archive",
            onPress: () =>
              habitRepository.updateHabit(habit.id, {
                archived: !habit.archived,
              }),
          },
          {
            text: "Delete",
            onPress: () => habitRepository.deleteHabit(habit.id),
            style: "destructive",
          },
        ],
        { cancelable: true },
      );
    }
  }, [habit.id, habit.archived]);

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
              <Text className="text-textMuted text-xs ml-2">•</Text>
              <Text className="text-textSecondary text-xs ml-2">
                {weekProgress.completedDays}/{weekProgress.totalDays} days
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
