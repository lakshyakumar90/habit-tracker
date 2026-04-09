import { getAppTheme } from "@/constants/appThemes";
import { useCelebrationStore } from "@/store/useCelebrationStore";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatDate, getWeekDates } from "@/utils/dates";
import { playAppSound, playTickSound } from "@/utils/sound";
import { Ionicons } from "@expo/vector-icons";
import { isBefore, isToday, startOfDay } from "date-fns";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface WeeklyViewProps {
  habitId: string;
  color: string;
}

export default function WeeklyView({ habitId, color }: WeeklyViewProps) {
  const { toggleHabit, isHabitCompletedOnDate, getWeekProgress } =
    useHabitStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const triggerCelebration = useCelebrationStore((state) => state.triggerBurst);
  const weekDates = getWeekDates(new Date());
  const DAY_LABELS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

  // Reorder: Mon first, Sun last
  const orderedDates = [...weekDates.slice(1), weekDates[0]];

  return (
    <View className="mt-3 pt-3 border-t border-cardBorder">
      <View className="flex-row justify-between mb-2 px-1">
        {DAY_LABELS.map((label, index) => {
          const date = orderedDates[index];
          const isTodayDate = date ? isToday(date) : false;
          return (
            <View key={label} className="flex-1 items-center">
              <Text
                className={`text-xs ${
                  isTodayDate ? "text-white font-bold" : "text-textMuted"
                }`}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between px-1">
        {orderedDates.map((date, index) => {
          const dateStr = formatDate(date);
          const isCompleted = isHabitCompletedOnDate(habitId, dateStr);
          const isTodayDate = isToday(date);
          const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
          const isFuture = !isTodayDate && !isPast;

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => {
                if (isFuture) return;

                const beforeWeek = getWeekProgress(
                  habitId,
                  dateStr,
                ).completedDays;
                const wasCompleted = isHabitCompletedOnDate(habitId, dateStr);

                toggleHabit(habitId, dateStr);

                const state = useHabitStore.getState();
                const afterWeek = state.getWeekProgress(
                  habitId,
                  dateStr,
                ).completedDays;
                const nowCompleted = state.isHabitCompletedOnDate(
                  habitId,
                  dateStr,
                );

                if (
                  !wasCompleted &&
                  nowCompleted &&
                  settings.soundEnabled &&
                  settings.tickSoundEnabled
                ) {
                  playTickSound(
                    settings.tickSound,
                    Math.max(0.1, settings.celebrationVolume * 0.7),
                  );
                }

                if (
                  settings.celebrationsEnabled &&
                  beforeWeek < 6 &&
                  afterWeek >= 6
                ) {
                  if (settings.confettiEnabled) {
                    triggerCelebration();
                  }

                  if (settings.soundEnabled) {
                    playAppSound(
                      settings.celebrationSound,
                      settings.celebrationVolume,
                    );
                  }
                }
              }}
              className="flex-1 items-center"
              activeOpacity={0.7}
              disabled={isFuture}
            >
              <View
                className={`w-10 h-10 rounded-lg items-center justify-center ${
                  !isCompleted && isTodayDate ? "border-2 border-white" : ""
                }`}
                style={{
                  ...(isCompleted
                    ? { backgroundColor: color }
                    : { backgroundColor: appTheme.surface }),
                  ...(isFuture ? { opacity: 0.3 } : {}),
                }}
              >
                {isCompleted && (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
