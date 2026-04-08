import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getWeekDates, formatDate } from "@/utils/dates";
import { useHabitStore } from "@/store/useHabitStore";
import { isToday, isBefore, startOfDay } from "date-fns";

interface WeeklyViewProps {
  habitId: string;
  color: string;
}

export default function WeeklyView({ habitId, color }: WeeklyViewProps) {
  const { toggleHabit, isHabitCompletedOnDate } = useHabitStore();
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
              onPress={() => !isFuture && toggleHabit(habitId, dateStr)}
              className="flex-1 items-center"
              activeOpacity={0.7}
              disabled={isFuture}
            >
              <View
                className={`w-10 h-10 rounded-lg items-center justify-center ${
                  isCompleted
                    ? ""
                    : isTodayDate
                    ? "border-2 border-white"
                    : "bg-surface"
                }`}
                style={{
                  ...(isCompleted ? { backgroundColor: color } : {}),
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