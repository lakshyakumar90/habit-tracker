import React from "react";
import { View, ScrollView, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/layout/Header";
import ModeSwitcher from "@/components/layout/ModeSwitcher";
import CalendarStrip from "@/components/habits/CalendarStrip";
import HabitCard from "@/components/habits/HabitCard";
import EmptyState from "@/components/habits/EmptyState";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import TimelineView from "@/components/tasks/TimelineView";
import AllTasksView from "@/components/tasks/AllTasksView";
import { useHabitStore } from "@/store/useHabitStore";

export default function HomeScreen() {
  const { habits, viewMode } = useHabitStore();
  const [taskTab, setTaskTab] = React.useState<"timeline" | "all">("timeline");

  const activeHabits = habits.filter((h) => !h.archived);

  const filteredHabits = React.useMemo(() => {
    if (viewMode === "time") return activeHabits.filter((h) => h.type === "time");
    if (viewMode === "tick") return activeHabits.filter((h) => h.type === "check");
    if (viewMode === "weekly") return activeHabits;
    return [];
  }, [activeHabits, viewMode]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Header />

      {viewMode !== "tasks" && <CalendarStrip />}

      {/* Tasks Tab Switcher */}
      {viewMode === "tasks" && (
        <View className="flex-row px-4 mt-2 mb-2 border-b border-cardBorder">
          <TaskTabButton
            label="Timeline"
            active={taskTab === "timeline"}
            onPress={() => setTaskTab("timeline")}
          />
          <View className="w-px bg-cardBorder mx-4 my-2" />
          <TaskTabButton
            label="All Tasks"
            active={taskTab === "all"}
            onPress={() => setTaskTab("all")}
          />
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === "tasks" ? (
          taskTab === "timeline" ? (
            <TimelineView />
          ) : (
            <AllTasksView />
          )
        ) : filteredHabits.length === 0 ? (
          <EmptyState mode={viewMode} />
        ) : (
          filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))
        )}
      </ScrollView>

      <ModeSwitcher />
      <FloatingActionButton onPress={() => router.push("/add-habit")} />
    </SafeAreaView>
  );
}

function TaskTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      className={`text-base pb-3 ${
        active
          ? "text-primary font-bold border-b-2 border-primary"
          : "text-textMuted font-medium"
      }`}
    >
      {label}
    </Text>
  );
}