import CelebrationOverlay from "@/components/common/CelebrationOverlay";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import CalendarStrip from "@/components/habits/CalendarStrip";
import EmptyState from "@/components/habits/EmptyState";
import HabitCard from "@/components/habits/HabitCard";
import Header from "@/components/layout/Header";
import ModeSwitcher from "@/components/layout/ModeSwitcher";
import AllTasksView from "@/components/tasks/AllTasksView";
import TimelineView from "@/components/tasks/TimelineView";
import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { router } from "expo-router";
import React from "react";
import { PanResponder, ScrollView, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function HomeScreen() {
  const { habits, viewMode, setViewMode, _hasHydrated } = useHabitStore();
  const settingsHydrated = useSettingsStore((state) => state._hasHydrated);
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const insets = useSafeAreaInsets();
  const [taskTab, setTaskTab] = React.useState<"timeline" | "all">("timeline");
  const swipeTranslateX = useSharedValue(0);
  const modeOpacity = useSharedValue(1);

  const activeHabits = habits.filter((h) => !h.archived);

  const filteredHabits = React.useMemo(() => {
    if (viewMode === "time")
      return activeHabits.filter((h) => h.type === "time");
    if (viewMode === "tick")
      return activeHabits.filter((h) => h.type === "check");
    if (viewMode === "weekly") return activeHabits;
    return [];
  }, [activeHabits, viewMode]);

  React.useEffect(() => {
    modeOpacity.value = 0.65;
    modeOpacity.value = withTiming(1, { duration: 240 });
  }, [modeOpacity, viewMode]);

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeTranslateX.value }],
    opacity: modeOpacity.value,
  }));

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 16 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < 48) return;

          // Add ViewMode type inline or import if preferred
          const MODES: ("time" | "tick" | "weekly" | "tasks")[] = [
            "time",
            "tick",
            "weekly",
            "tasks",
          ];
          const currentIndex = MODES.indexOf(viewMode);

          // Swipe Left
          if (gestureState.dx < 0 && currentIndex < MODES.length - 1) {
            setViewMode(MODES[currentIndex + 1]);
            swipeTranslateX.value = withSequence(
              withTiming(-18, { duration: 80 }),
              withTiming(0, { duration: 190 }),
            );
          }

          // Swipe Right
          if (gestureState.dx > 0 && currentIndex > 0) {
            setViewMode(MODES[currentIndex - 1]);
            swipeTranslateX.value = withSequence(
              withTiming(18, { duration: 80 }),
              withTiming(0, { duration: 190 }),
            );
          }
        },
      }),
    [setViewMode, swipeTranslateX, viewMode],
  );

  if (!_hasHydrated || !settingsHydrated) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: appTheme.background }}
      >
        <Text style={{ color: appTheme.textMuted }}>
          Loading your habits...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right"]}
      style={{ backgroundColor: appTheme.background }}
    >
      <CelebrationOverlay />
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

      <Animated.View
        className="flex-1"
        style={swipeStyle}
        {...panResponder.panHandlers}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
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
      </Animated.View>

      <ModeSwitcher />
      <FloatingActionButton
        onPress={() => router.push("/add-habit")}
        visible={viewMode !== "tasks"}
      />
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
