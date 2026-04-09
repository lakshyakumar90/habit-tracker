// index.tsx
import CelebrationOverlay from "@/components/common/CelebrationOverlay";
import FloatingActionButton from "@/components/common/FloatingActionButton";
import CalendarStrip from "@/components/habits/CalendarStrip";
import EmptyState from "@/components/habits/EmptyState";
import TickHabitCard from "@/components/habits/TickHabitCard";
import WeeklyHabitCard from "@/components/habits/WeeklyHabitCard";
import Header from "@/components/layout/Header";
import ModeSwitcher from "@/components/layout/ModeSwitcher";
import AllTasksView from "@/components/tasks/AllTasksView";
import TimelineView from "@/components/tasks/TimelineView";
import { getAppTheme } from "@/constants/appThemes";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ViewMode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const HABIT_MODES: Extract<ViewMode, "time" | "tick" | "weekly">[] = [
  "time",
  "tick",
  "weekly",
];
const TASK_PAGES = ["timeline", "all"] as const;
type TaskPage = (typeof TASK_PAGES)[number];

function isHabitMode(mode: ViewMode): mode is (typeof HABIT_MODES)[number] {
  return HABIT_MODES.includes(mode as (typeof HABIT_MODES)[number]);
}

const MemoizedTickHabitCard = React.memo(TickHabitCard);
const MemoizedWeeklyHabitCard = React.memo(WeeklyHabitCard);
const MemoizedCalendarStrip = React.memo(CalendarStrip);
const MemoizedHeader = React.memo(Header);
const MemoizedCelebrationOverlay = React.memo(CelebrationOverlay);
const MemoizedTimelineView = React.memo(TimelineView);
const MemoizedAllTasksView = React.memo(AllTasksView);

// ─── Memoized HabitPage ───
const HabitPage = React.memo(function HabitPage({
  width,
  mode,
  habits,
  bottomInset,
}: {
  width: number;
  mode: Extract<ViewMode, "time" | "tick" | "weekly">;
  habits: ReturnType<typeof useHabitStore.getState>["habits"];
  bottomInset: number;
}) {
  const contentPadding = React.useMemo(
    () => ({ paddingBottom: bottomInset + 160 }),
    [bottomInset],
  );

  return (
    <View style={{ width }} className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={contentPadding}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
      >
        {habits.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          habits.map((habit) =>
            mode === "weekly" ? (
              <MemoizedWeeklyHabitCard key={habit.id} habit={habit} />
            ) : (
              <MemoizedTickHabitCard key={habit.id} habit={habit} />
            ),
          )
        )}
      </ScrollView>
    </View>
  );
});

// ─── Memoized TaskTabButton ───
const TaskTabButton = React.memo(function TaskTabButton({
  label,
  icon,
  active,
  onPress,
  appTheme,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  appTheme: ReturnType<typeof getAppTheme>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 flex-row items-center justify-center rounded-xl px-4 py-3"
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? appTheme.primary : appTheme.textMuted}
      />
      <Text
        className="font-semibold ml-2"
        style={{ color: active ? appTheme.primary : appTheme.textMuted }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

// ─── Memoized TasksGroup ───
const TasksGroup = React.memo(function TasksGroup({
  appTheme,
  taskTab,
  onTaskTabPress,
  tasksPagerRef,
  tasksPagerWidth,
  onTasksPagerLayout,
  onTasksPagerMomentumEnd,
  tasksScrollX,
}: {
  appTheme: ReturnType<typeof getAppTheme>;
  taskTab: TaskPage;
  onTaskTabPress: (tab: TaskPage) => void;
  tasksPagerRef: React.RefObject<ScrollView | null>;
  tasksPagerWidth: number;
  onTasksPagerLayout: (event: LayoutChangeEvent) => void;
  onTasksPagerMomentumEnd: (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => void;
  tasksScrollX: Animated.Value;
}) {
  const [tabBarWidth, setTabBarWidth] = React.useState(0);

  const handleTabBarLayout = React.useCallback((event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width - 12);
  }, []);

  const indicatorTranslateX = React.useMemo(() => {
    if (!tasksPagerWidth || !tabBarWidth) {
      return new Animated.Value(0);
    }
    return tasksScrollX.interpolate({
      inputRange: [0, tasksPagerWidth],
      outputRange: [0, tabBarWidth / 2],
      extrapolate: "clamp",
    });
  }, [tabBarWidth, tasksPagerWidth, tasksScrollX]);

  const onScroll = React.useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: tasksScrollX } } }],
        { useNativeDriver: true },
      ),
    [tasksScrollX],
  );

  const handleTimelinePress = React.useCallback(
    () => onTaskTabPress("timeline"),
    [onTaskTabPress],
  );

  const handleAllPress = React.useCallback(
    () => onTaskTabPress("all"),
    [onTaskTabPress],
  );

  return (
    <View className="flex-1">
      <View
        className="mx-4 mt-3 mb-2 rounded-2xl border p-1.5"
        style={{
          backgroundColor: appTheme.card,
          borderColor: appTheme.cardBorder,
        }}
        onLayout={handleTabBarLayout}
      >
        {tabBarWidth > 0 && (
          <Animated.View
            className="absolute left-1.5 top-1.5 bottom-1.5 rounded-xl"
            style={{
              width: tabBarWidth / 2,
              backgroundColor: `${appTheme.primary}20`,
              transform: [{ translateX: indicatorTranslateX }],
            }}
          />
        )}
        <View className="flex-row">
          <TaskTabButton
            label="Timelines"
            icon="git-branch-outline"
            active={taskTab === "timeline"}
            onPress={handleTimelinePress}
            appTheme={appTheme}
          />
          <TaskTabButton
            label="My Tasks"
            icon="checkbox-outline"
            active={taskTab === "all"}
            onPress={handleAllPress}
            appTheme={appTheme}
          />
        </View>
      </View>

      <View className="flex-1" onLayout={onTasksPagerLayout}>
        {tasksPagerWidth > 0 && (
          <Animated.ScrollView
            ref={tasksPagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            directionalLockEnabled
            overScrollMode="never"
            scrollEventThrottle={16}
            onMomentumScrollEnd={onTasksPagerMomentumEnd}
            onScroll={onScroll}
            removeClippedSubviews
          >
            <View style={{ width: tasksPagerWidth }} className="flex-1">
              <MemoizedTimelineView />
            </View>
            <View style={{ width: tasksPagerWidth }} className="flex-1">
              <MemoizedAllTasksView />
            </View>
          </Animated.ScrollView>
        )}
      </View>
    </View>
  );
});

// ─── Main HomeScreen ───
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

  const [activeTaskTab, setActiveTaskTab] =
    React.useState<TaskPage>("timeline");
  const [habitPagerWidth, setHabitPagerWidth] = React.useState(0);
  const [tasksPagerWidth, setTasksPagerWidth] = React.useState(0);

  const habitPagerRef = React.useRef<ScrollView>(null);
  const tasksPagerRef = React.useRef<ScrollView>(null);
  const habitScrollX = React.useRef(new Animated.Value(0)).current;
  const tasksScrollX = React.useRef(new Animated.Value(0)).current;

  // Track if swipe is user-initiated vs programmatic
  const isUserSwiping = React.useRef(false);
  // Track if we're programmatically scrolling (from tab press)
  const isProgrammaticScroll = React.useRef(false);

  const isTasksMode = viewMode === "tasks";

  const activeHabits = React.useMemo(
    () => habits.filter((h) => !h.archived),
    [habits],
  );

  const timeHabits = React.useMemo(
    () => activeHabits.filter((h) => h.type === "time"),
    [activeHabits],
  );
  const tickHabits = React.useMemo(
    () => activeHabits.filter((h) => h.type === "check"),
    [activeHabits],
  );
  const weeklyHabits = activeHabits;

  // ─── Stable Animated.event for habit pager (native driver) ───
  const habitOnScroll = React.useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: habitScrollX } } }],
        { useNativeDriver: true },
      ),
    [habitScrollX],
  );

  // ─── Sync store → scroll position ONLY on programmatic tab press ───
  // Removed the useEffect that was fighting with swipes
  const scrollHabitPagerTo = React.useCallback(
    (index: number, animated: boolean) => {
      if (!habitPagerWidth) return;
      isProgrammaticScroll.current = true;
      habitPagerRef.current?.scrollTo({
        x: index * habitPagerWidth,
        animated,
      });
      // Reset flag after scroll completes
      if (!animated) {
        isProgrammaticScroll.current = false;
      }
    },
    [habitPagerWidth],
  );

  // Initial position sync (only once when width is known)
  const initialSyncDone = React.useRef(false);
  React.useEffect(() => {
    if (!habitPagerWidth || initialSyncDone.current || !isHabitMode(viewMode))
      return;
    initialSyncDone.current = true;
    const pageIndex = HABIT_MODES.indexOf(viewMode);
    habitPagerRef.current?.scrollTo({
      x: pageIndex * habitPagerWidth,
      animated: false,
    });
  }, [habitPagerWidth, viewMode]);

  // Reset initial sync flag when switching back from tasks
  React.useEffect(() => {
    if (viewMode === "tasks") {
      initialSyncDone.current = false;
    }
  }, [viewMode]);

  // Tasks tab reset
  React.useEffect(() => {
    if (viewMode === "tasks") {
      setActiveTaskTab("timeline");
    }
  }, [viewMode]);

  React.useEffect(() => {
    if (!tasksPagerWidth || viewMode !== "tasks") return;
    const pageIndex = TASK_PAGES.indexOf(activeTaskTab);
    tasksPagerRef.current?.scrollTo({
      x: pageIndex * tasksPagerWidth,
      animated: false,
    });
  }, [activeTaskTab, tasksPagerWidth, viewMode]);

  // ─── Habit pager callbacks ───
  const handleHabitScrollBeginDrag = React.useCallback(() => {
    isUserSwiping.current = true;
  }, []);

  const handleHabitMomentumEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isProgrammaticScroll.current = false;
      isUserSwiping.current = false;

      if (!habitPagerWidth) return;
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / habitPagerWidth,
      );
      const nextMode = HABIT_MODES[nextIndex];
      if (!nextMode) return;

      const current = useHabitStore.getState().viewMode;
      if (nextMode !== current) {
        useHabitStore.getState().setViewMode(nextMode);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [habitPagerWidth],
  );

  // Also handle scrollAnimationEnd for programmatic scrolls
  const handleHabitScrollAnimationEnd = React.useCallback(() => {
    isProgrammaticScroll.current = false;
  }, []);

  const handleBottomNavSelect = React.useCallback(
    (mode: ViewMode) => {
      if (mode === "tasks") {
        setViewMode("tasks");
        return;
      }

      const comingFromTasks = !isHabitMode(useHabitStore.getState().viewMode);

      setViewMode(mode);

      const nextIndex = HABIT_MODES.indexOf(mode);

      if (comingFromTasks) {
        // Coming from tasks: will mount fresh, initial sync useEffect handles it
        initialSyncDone.current = false;
      } else {
        // Already in habit mode: animate to the page
        scrollHabitPagerTo(nextIndex, true);
      }
    },
    [setViewMode, scrollHabitPagerTo],
  );

  const handleHabitPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width) setHabitPagerWidth(width);
    },
    [],
  );

  const handleTasksPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width) setTasksPagerWidth(width);
    },
    [],
  );

  const handleTaskPagerMomentumEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!tasksPagerWidth) return;
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / tasksPagerWidth,
      );
      const nextTab = TASK_PAGES[nextIndex];
      if (!nextTab) return;
      setActiveTaskTab((prev) => {
        if (prev === nextTab) return prev;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return nextTab;
      });
    },
    [tasksPagerWidth],
  );

  const handleTaskTabPress = React.useCallback(
    (tab: TaskPage) => {
      setActiveTaskTab(tab);
      if (!tasksPagerWidth) return;
      tasksPagerRef.current?.scrollTo({
        x: TASK_PAGES.indexOf(tab) * tasksPagerWidth,
        animated: true,
      });
    },
    [tasksPagerWidth],
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
          <View className="flex-1" onLayout={handleHabitPagerLayout}>
            {habitPagerWidth > 0 && (
              <Animated.ScrollView
                ref={habitPagerRef}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                directionalLockEnabled
                overScrollMode="never"
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={habitOnScroll}
                onScrollBeginDrag={handleHabitScrollBeginDrag}
                onMomentumScrollEnd={handleHabitMomentumEnd}
                onScrollEndDrag={(
                  e: NativeSyntheticEvent<NativeScrollEvent>,
                ) => {
                  // For cases where momentum doesn't fire (small swipe snaps back)
                  if (!isUserSwiping.current) return;
                }}
                removeClippedSubviews={Platform.OS === "android"}
              >
                <HabitPage
                  width={habitPagerWidth}
                  mode="time"
                  habits={timeHabits}
                  bottomInset={insets.bottom}
                />
                <HabitPage
                  width={habitPagerWidth}
                  mode="tick"
                  habits={tickHabits}
                  bottomInset={insets.bottom}
                />
                <HabitPage
                  width={habitPagerWidth}
                  mode="weekly"
                  habits={weeklyHabits}
                  bottomInset={insets.bottom}
                />
              </Animated.ScrollView>
            )}
          </View>
        </>
      ) : (
        <TasksGroup
          appTheme={appTheme}
          taskTab={activeTaskTab}
          onTaskTabPress={handleTaskTabPress}
          tasksPagerRef={tasksPagerRef}
          tasksPagerWidth={tasksPagerWidth}
          onTasksPagerLayout={handleTasksPagerLayout}
          onTasksPagerMomentumEnd={handleTaskPagerMomentumEnd}
          tasksScrollX={tasksScrollX}
        />
      )}

      <ModeSwitcher onSelect={handleBottomNavSelect} />
      <FloatingActionButton onPress={handleFabPress} visible={!isTasksMode} />
    </SafeAreaView>
  );
}
