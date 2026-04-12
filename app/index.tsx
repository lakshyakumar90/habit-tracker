import CelebrationOverlay from "@/components/common/CelebrationOverlay";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import CalendarStrip from "@/components/habits/CalendarStrip";
import Header from "@/components/layout/Header";
import ModeSwitcher from "@/components/layout/ModeSwitcher";
import TimeTickTabs from "@/components/layout/TimeTickTabs";
import TasksTabs from "@/components/tasks/TasksTabs";
import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ViewMode } from "@/types";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Text } from "react-native";
import { useSharedValue, withTiming } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function isHabitMode(mode: ViewMode): mode is "time" | "tick" | "weekly" {
  return mode === "time" || mode === "tick" || mode === "weekly";
}

function modeToIndex(mode: ViewMode): number {
  if (mode === "time") return 0;
  if (mode === "tick") return 1;
  if (mode === "weekly") return 2;
  return 3;
}

const MemoizedCalendarStrip = React.memo(CalendarStrip);
const MemoizedHeader = React.memo(Header);
const MemoizedCelebrationOverlay = React.memo(CelebrationOverlay);

export default function HomeScreen() {
  const router = useRouter();
  const viewMode = useHabitStore((state) => state.viewMode);
  const setViewMode = useHabitStore((state) => state.setViewMode);
  const habits = useHabitStore((state) => state.habits);
  const habitsHydrated = useHabitStore((state) => state._hasHydrated);
  const settingsHydrated = useSettingsStore((state) => state._hasHydrated);
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const insets = useSafeAreaInsets();

  const modeProgress = useSharedValue(modeToIndex(viewMode));

  React.useEffect(() => {
    modeProgress.value = withTiming(modeToIndex(viewMode), { duration: 170 });
  }, [modeProgress, viewMode]);

  const isTasksMode = viewMode === "tasks";

  const activeHabits = React.useMemo(
    () => habits.filter((h) => !h.archived),
    [habits],
  );

  const handleBottomNavSelect = React.useCallback(
    (mode: ViewMode) => {
      if (mode === useHabitStore.getState().viewMode) {
        return;
      }

      setViewMode(mode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [setViewMode],
  );

  const handleHabitModeSettled = React.useCallback(
    (mode: "time" | "tick" | "weekly") => {
      const current = useHabitStore.getState().viewMode;
      if (current !== mode) {
        setViewMode(mode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [setViewMode],
  );

  const handleFabPress = React.useCallback(() => {
    router.push("/add-habit");
  }, [router]);

  if (!habitsHydrated || !settingsHydrated) {
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
      <MemoizedCelebrationOverlay />
      <MemoizedHeader />

      {!isTasksMode ? (
        <>
          <MemoizedCalendarStrip />
          <TimeTickTabs
            habits={activeHabits}
            bottomInset={insets.bottom}
            activeMode={isHabitMode(viewMode) ? viewMode : "tick"}
            onModeSettled={handleHabitModeSettled}
          />
        </>
      ) : (
        <TasksTabs />
      )}

      <ModeSwitcher
        onSelect={handleBottomNavSelect}
        activeMode={viewMode}
        modeProgress={modeProgress}
      />
      <FloatingActionButton onPress={handleFabPress} visible={!isTasksMode} />
    </SafeAreaView>
  );
}
