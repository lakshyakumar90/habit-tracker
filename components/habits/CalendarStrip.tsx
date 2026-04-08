import { useHabitStore } from "@/store/useHabitStore";
import { formatDate, getDayName, getWeekDates } from "@/utils/dates";
import { format, isToday } from "date-fns";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CalendarStrip() {
  const { selectedDate, setSelectedDate, getCompletionForDate } =
    useHabitStore();
  const weekDates = getWeekDates(new Date());

  return (
    <View className="px-4 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const today = isToday(date);
            const isSelected = selectedDate === dateStr;
            const completion = getCompletionForDate(dateStr);
            const allDone =
              completion.total > 0 && completion.completed >= completion.total;

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.7}
                className={`items-center justify-center w-14 h-16 rounded-2xl border ${
                  isSelected
                    ? "bg-surface border-primary"
                    : "bg-surface border-cardBorder"
                }`}
                style={{
                  shadowColor: isSelected ? "#22c55e" : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.3 : 0,
                  shadowRadius: 8,
                }}
              >
                <Text
                  className={`text-[11px] mb-1 ${
                    today ? "text-primary font-medium" : "text-textMuted"
                  }`}
                >
                  {today ? "Today" : getDayName(date)}
                </Text>
                {allDone ? (
                  <Text className="text-primary font-bold text-sm">✓</Text>
                ) : today && completion.total > 0 ? (
                  <Text className="text-white font-bold text-sm">
                    {completion.completed}/{completion.total}
                  </Text>
                ) : (
                  <Text className="text-textSecondary font-medium text-sm">
                    {format(date, "d")}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
