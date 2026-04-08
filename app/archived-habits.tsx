import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ArchivedHabitsScreen() {
  const habits = useHabitStore((state) => state.habits);
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
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Archived Habits
        </Text>
      </View>

      {archivedHabits.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="archive-outline" size={36} color="#6b7280" />
          <Text className="text-textMuted text-center mt-3">
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
              className="bg-card rounded-2xl border border-cardBorder p-4 mb-3"
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
                    <Text className="text-white font-semibold">
                      {habit.name}
                    </Text>
                    <Text className="text-textMuted text-xs capitalize mt-0.5">
                      {habit.type} • {habit.frequency}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 rounded-xl py-2.5 bg-primary/20 border border-primary/40 items-center"
                  activeOpacity={0.7}
                  onPress={() => habitRepository.unarchiveHabit(habit.id)}
                >
                  <Text className="text-primary font-semibold">Restore</Text>
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
