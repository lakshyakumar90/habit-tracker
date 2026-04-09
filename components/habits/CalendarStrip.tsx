import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatDate, getDayName, getWeekDates } from "@/utils/dates";
import { format, isToday } from "date-fns";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function CalendarStrip() {
  const { selectedDate, setSelectedDate, getCompletionForDate } =
    useHabitStore();
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);
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
                className="items-center justify-center w-14 h-16 rounded-2xl border"
                style={{
                  backgroundColor: isSelected
                    ? `${appTheme.primary}1A`
                    : appTheme.surface,
                  borderColor: isSelected
                    ? appTheme.primary
                    : appTheme.cardBorder,
                  shadowColor: isSelected ? appTheme.primary : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isSelected ? 0.3 : 0,
                  shadowRadius: 8,
                }}
              >
                <Text
                  className={`text-[11px] mb-1 ${today ? "font-medium" : ""}`}
                  style={{
                    color: today ? appTheme.primary : appTheme.textMuted,
                  }}
                >
                  {today ? "Today" : getDayName(date)}
                </Text>
                {allDone ? (
                  <Text
                    className="font-bold text-sm"
                    style={{ color: appTheme.primary }}
                  >
                    ✓
                  </Text>
                ) : today && completion.total > 0 ? (
                  <Text
                    className="font-bold text-sm"
                    style={{ color: appTheme.textPrimary }}
                  >
                    {completion.completed}/{completion.total}
                  </Text>
                ) : (
                  <Text
                    className="font-medium text-sm"
                    style={{
                      color: isSelected
                        ? appTheme.textPrimary
                        : appTheme.textSecondary,
                    }}
                  >
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
