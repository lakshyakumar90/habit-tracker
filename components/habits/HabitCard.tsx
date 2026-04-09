// HabitCard.tsx
import { habitRepository } from "@/services/habitRepository";
import { useCelebrationStore } from "@/store/useCelebrationStore";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Habit } from "@/types";
import { lightenHexColor, mixHexColors } from "@/utils/helpers";
import { playAppSound, playTickSound } from "@/utils/sound";
import { calculateStreak } from "@/utils/streak";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
  variant?: "tick" | "weekly";
}

// ─── Precompute all colors once per habit.color ───
function useHabitColors(color: string) {
  return useMemo(
    () => ({
      cardBg: mixHexColors(color, "#10151d", 0.86),
      cardBorder: mixHexColors(color, "#243041", 0.7),
      iconBg: mixHexColors(color, "#1a2433", 0.72),
      checkIdleBg: mixHexColors(color, "#151d29", 0.78),
      checkIdleBorder: mixHexColors(color, "#2d3c52", 0.66),
      titleText: lightenHexColor(color, 0.2),
      secondaryText: lightenHexColor(color, 0.32),
      mutedText: lightenHexColor(color, 0.45),
      monthModalBgColor: mixHexColors(color, "#121a25", 0.8),
      menuBg: mixHexColors(color, "#0f1621", 0.86),
      menuBorder: mixHexColors(color, "#2a3950", 0.7),
      menuItemBg: mixHexColors(color, "#172131", 0.76),
      menuItemBorder: mixHexColors(color, "#32445d", 0.68),
      menuItemIconBg: mixHexColors(color, "#1e2c3f", 0.66),
      menuHandle: lightenHexColor(color, 0.42),
    }),
    [color],
  );
}

// ─── Menu: only mounts when visible ───
const HabitMenu = React.memo(function HabitMenu({
  visible,
  onClose,
  habit,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  habit: Habit;
  colors: ReturnType<typeof useHabitColors>;
}) {
  const router = useRouter();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View
              className="m-4 p-4 rounded-3xl pb-8 border"
              style={{
                backgroundColor: colors.menuBg,
                borderColor: colors.menuBorder,
              }}
            >
              <View className="items-center mb-6">
                <View
                  className="w-12 h-1.5 rounded-full"
                  style={{ backgroundColor: colors.menuHandle }}
                />
              </View>

              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    router.push({
                      pathname: "/edit-habit",
                      params: { id: habit.id },
                    });
                  }}
                  className="flex-row items-center p-4 rounded-2xl border"
                  style={{
                    backgroundColor: colors.menuItemBg,
                    borderColor: colors.menuItemBorder,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.menuItemIconBg }}
                  >
                    <Ionicons name="pencil" size={20} color={habit.color} />
                  </View>
                  <Text
                    className="font-semibold text-base ml-4"
                    style={{ color: colors.titleText }}
                  >
                    Edit Habit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    habitRepository.updateHabit(habit.id, {
                      archived: !habit.archived,
                    });
                  }}
                  className="flex-row items-center p-4 rounded-2xl border"
                  style={{
                    backgroundColor: colors.menuItemBg,
                    borderColor: colors.menuItemBorder,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: colors.menuItemIconBg }}
                  >
                    <Ionicons
                      name={habit.archived ? "arrow-undo" : "archive"}
                      size={20}
                      color={habit.color}
                    />
                  </View>
                  <Text
                    className="font-semibold text-base ml-4"
                    style={{ color: colors.titleText }}
                  >
                    {habit.archived ? "Unarchive Habit" : "Archive Habit"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    onClose();
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
                  }}
                  className="flex-row items-center p-4 bg-red-500/10 rounded-2xl border border-red-500/20"
                >
                  <View className="w-10 h-10 rounded-xl bg-red-500/20 items-center justify-center">
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </View>
                  <Text className="text-red-500 font-semibold text-base ml-4">
                    Delete Habit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const MemoizedHabitGrid = React.memo(HabitGrid);
const MemoizedWeeklyView = React.memo(WeeklyView);

// ─── Create a single stable selector per habit to get a "version" number ───
// This gives us a primitive that changes when logs change, without returning objects
function useHabitVersion(habitId: string, selectedDate: string) {
  // Select a primitive that changes when this habit's data changes
  // logs[habitId] is a number (or similar primitive) — safe for Zustand
  const logValue = useHabitStore((s) => s.logs[habitId]);

  // Compute derived values from getState() — never inside a selector
  return useMemo(() => {
    const store = useHabitStore.getState();
    return {
      isCompleted: store.isHabitCompletedOnDate(habitId, selectedDate),
      weekProgress: store.getWeekProgress(habitId, selectedDate),
    };
  }, [habitId, selectedDate, logValue]);
}

function HabitCard({ habit, variant = "tick" }: HabitCardProps) {
  const selectedDate = useHabitStore((s) => s.selectedDate);
  const logs = useHabitStore((s) => s.logs);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const tickSoundEnabled = useSettingsStore((s) => s.tickSoundEnabled);
  const tickSound = useSettingsStore((s) => s.tickSound);
  const celebrationsEnabled = useSettingsStore((s) => s.celebrationsEnabled);
  const confettiEnabled = useSettingsStore((s) => s.confettiEnabled);
  const celebrationSound = useSettingsStore((s) => s.celebrationSound);
  const celebrationVolume = useSettingsStore((s) => s.celebrationVolume);

  const triggerCelebration = useCelebrationStore((s) => s.triggerBurst);
  const router = useRouter();

  // ─── Derived data: safe, no infinite loop ───
  const { isCompleted, weekProgress } = useHabitVersion(habit.id, selectedDate);

  const colors = useHabitColors(habit.color);

  const streak = useMemo(
    () =>
      calculateStreak(
        logs,
        habit.id,
        habit.completionTargetEnabled ? habit.targetCount : 1,
      ),
    [logs, habit.id, habit.targetCount, habit.completionTargetEnabled],
  );

  const [showMenu, setShowMenu] = useState(false);

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const handleToggle = useCallback(() => {
    const targetDate = new Date(selectedDate);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (targetDate > today) return;

    const store = useHabitStore.getState();
    const beforeWeek = store.getWeekProgress(
      habit.id,
      selectedDate,
    ).completedDays;
    const wasCompleted = store.isHabitCompletedOnDate(habit.id, selectedDate);

    if (!wasCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      checkScale.value = withSequence(withSpring(1.2), withSpring(1));
    }

    habitRepository.toggleHabit(habit.id, selectedDate);

    const afterStore = useHabitStore.getState();
    const afterWeek = afterStore.getWeekProgress(
      habit.id,
      selectedDate,
    ).completedDays;
    const nowCompleted = afterStore.isHabitCompletedOnDate(
      habit.id,
      selectedDate,
    );

    if (!wasCompleted && nowCompleted && soundEnabled && tickSoundEnabled) {
      playTickSound(tickSound, Math.max(0.1, celebrationVolume * 0.7));
    }

    if (celebrationsEnabled && beforeWeek < 6 && afterWeek >= 6) {
      if (confettiEnabled) triggerCelebration();
      if (soundEnabled) playAppSound(celebrationSound, celebrationVolume);
    }
  }, [
    selectedDate,
    habit.id,
    checkScale,
    soundEnabled,
    tickSoundEnabled,
    tickSound,
    celebrationsEnabled,
    confettiEnabled,
    celebrationSound,
    celebrationVolume,
    triggerCelebration,
  ]);

  const handlePress = useCallback(() => {
    router.push({ pathname: "/habit/[id]", params: { id: habit.id } });
  }, [habit.id, router]);

  const handleMore = useCallback(() => setShowMenu(true), []);
  const handleCloseMenu = useCallback(() => setShowMenu(false), []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cardContainerStyle = useMemo(
    () => ({
      backgroundColor: colors.cardBg,
      borderColor: colors.cardBorder,
      shadowColor: habit.color,
      shadowOffset: { width: 0, height: 0 } as const,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    }),
    [colors.cardBg, colors.cardBorder, habit.color],
  );

  const checkButtonStyle = useMemo(
    () => ({
      backgroundColor: isCompleted ? habit.color : colors.checkIdleBg,
      borderColor: isCompleted ? habit.color : colors.checkIdleBorder,
    }),
    [isCompleted, habit.color, colors.checkIdleBg, colors.checkIdleBorder],
  );

  const iconBgStyle = useMemo(
    () => ({ backgroundColor: colors.iconBg }),
    [colors.iconBg],
  );

  const showGrid = variant === "tick";
  const showWeekly = variant === "weekly";

  return (
    <Animated.View
      style={[animatedStyle, cardContainerStyle]}
      className="rounded-2xl mx-4 mb-3 p-4 border"
    >
      <Pressable
        className="flex-row items-center justify-between mb-2 pb-1"
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={iconBgStyle}
          >
            <Ionicons name={habit.icon as any} size={22} color={habit.color} />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="font-bold text-base"
              style={{ color: colors.titleText }}
            >
              {habit.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="flame" size={13} color={habit.color} />
              <Text
                className="text-xs ml-1"
                style={{ color: colors.secondaryText }}
              >
                Streak: {streak.current}
              </Text>
              <Text
                className="text-xs ml-2"
                style={{ color: colors.mutedText }}
              >
                •
              </Text>
              <Text
                className="text-xs ml-2"
                style={{ color: colors.secondaryText }}
              >
                {weekProgress.completedDays}/{weekProgress.totalDays} days
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleToggle}
          className="w-11 h-11 rounded-xl items-center justify-center border"
          style={checkButtonStyle}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <Animated.View style={checkStyle}>
            <Ionicons
              name="checkmark"
              size={22}
              color={isCompleted ? "#f8fafc" : colors.secondaryText}
            />
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMore} className="ml-3" hitSlop={12}>
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.secondaryText}
          />
        </TouchableOpacity>
      </Pressable>

      {showGrid && (
        <MemoizedHabitGrid
          habitId={habit.id}
          color={habit.color}
          monthModalBgColor={colors.monthModalBgColor}
        />
      )}
      {showWeekly && (
        <MemoizedWeeklyView habitId={habit.id} color={habit.color} />
      )}

      <HabitMenu
        visible={showMenu}
        onClose={handleCloseMenu}
        habit={habit}
        colors={colors}
      />
    </Animated.View>
  );
}

export default React.memo(HabitCard, (prev, next) => {
  return (
    prev.habit.id === next.habit.id &&
    prev.habit.color === next.habit.color &&
    prev.habit.name === next.habit.name &&
    prev.habit.icon === next.habit.icon &&
    prev.habit.archived === next.habit.archived &&
    prev.habit.type === next.habit.type &&
    prev.habit.targetCount === next.habit.targetCount &&
    prev.habit.completionTargetEnabled === next.habit.completionTargetEnabled &&
    prev.variant === next.variant
  );
});
