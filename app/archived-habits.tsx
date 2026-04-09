import { getAppTheme } from "@/constants/appThemes";
import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArchivedHabitsScreen() {
  const habits = useHabitStore((state) => state.habits);
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);
  const archivedHabits = React.useMemo(
    () => habits.filter((habit) => habit.archived),
    [habits],
  );

  const handleDelete = (habitId: string, habitName: string) => {
    Alert.alert("Delete Habit", `Delete \"${habitName}\" permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => habitRepository.deleteHabit(habitId),
      },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right", "bottom"]}
      style={{ backgroundColor: appTheme.background }}
    >
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={appTheme.textPrimary}
          />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold ml-4"
          style={{ color: appTheme.textPrimary }}
        >
          Archived Habits
        </Text>
      </View>

      {archivedHabits.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="archive-outline"
            size={36}
            color={appTheme.textMuted}
          />
          <Text
            className="text-center mt-3"
            style={{ color: appTheme.textMuted }}
          >
            You have no archived habits.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {archivedHabits.map((habit) => (
            <View
              key={habit.id}
              className="rounded-2xl border p-4 mb-3"
              style={{
                backgroundColor: appTheme.card,
                borderColor: appTheme.cardBorder,
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 pr-3">
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    <Ionicons
                      name={habit.icon as any}
                      size={18}
                      color={habit.color}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text
                      className="font-semibold"
                      style={{ color: appTheme.textPrimary }}
                    >
                      {habit.name}
                    </Text>
                    <Text
                      className="text-xs capitalize mt-0.5"
                      style={{ color: appTheme.textMuted }}
                    >
                      {habit.type} • {habit.frequency}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 rounded-xl py-2.5 border items-center"
                  style={{
                    backgroundColor: `${appTheme.primary}33`,
                    borderColor: `${appTheme.primary}66`,
                  }}
                  activeOpacity={0.7}
                  onPress={() => habitRepository.unarchiveHabit(habit.id)}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: appTheme.primary }}
                  >
                    Restore
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-xl py-2.5 bg-red-500/10 border border-red-500/30 items-center"
                  activeOpacity={0.7}
                  onPress={() => handleDelete(habit.id, habit.name)}
                >
                  <Text className="text-red-400 font-semibold">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
