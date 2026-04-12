import EmptyState from "@/components/habits/EmptyState";
import TickHabitCard from "@/components/habits/TickHabitCard";
import WeeklyHabitCard from "@/components/habits/WeeklyHabitCard";
import { Habit } from "@/types";
import React from "react";
import { Platform, ScrollView, View } from "react-native";
import { SceneRendererProps, TabView } from "react-native-tab-view";

type HabitMode = "time" | "tick" | "weekly";

type Route = { key: HabitMode; title: string };

const ROUTES: Route[] = [
  { key: "time", title: "Time" },
  { key: "tick", title: "Tick" },
  { key: "weekly", title: "Weekly" },
];

const TickCardMemo = React.memo(TickHabitCard);
const WeeklyCardMemo = React.memo(WeeklyHabitCard);

const HabitModeScene = React.memo(function HabitModeScene({
  mode,
  habits,
  bottomInset,
}: {
  mode: HabitMode;
  habits: Habit[];
  bottomInset: number;
}) {
  const contentPadding = React.useMemo(
    () => ({ paddingBottom: bottomInset + 160 }),
    [bottomInset],
  );

  return (
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
            <WeeklyCardMemo key={habit.id} habit={habit} />
          ) : (
            <TickCardMemo key={habit.id} habit={habit} />
          ),
        )
      )}
    </ScrollView>
  );
});

interface TimeTickTabsProps {
  habits: Habit[];
  bottomInset: number;
  activeMode: HabitMode;
  onModeSettled: (mode: HabitMode) => void;
}

function TimeTickTabs({
  habits,
  bottomInset,
  activeMode,
  onModeSettled,
}: TimeTickTabsProps) {
  const [index, setIndex] = React.useState(() =>
    ROUTES.findIndex((r) => r.key === activeMode),
  );

  const timeHabits = React.useMemo(
    () => habits.filter((h) => h.type === "time"),
    [habits],
  );

  const tickHabits = React.useMemo(
    () => habits.filter((h) => h.type === "check"),
    [habits],
  );

  const weeklyHabits = habits;

  React.useEffect(() => {
    const nextIndex = ROUTES.findIndex((r) => r.key === activeMode);
    if (nextIndex >= 0 && nextIndex !== index) {
      setIndex(nextIndex);
    }
  }, [activeMode, index]);

  const handleIndexChange = React.useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      const nextMode = ROUTES[nextIndex]?.key;
      if (nextMode) {
        onModeSettled(nextMode);
      }
    },
    [onModeSettled],
  );

  const renderScene = React.useCallback(
    ({ route }: { route: Route } & SceneRendererProps) => {
      if (route.key === "time") {
        return (
          <HabitModeScene
            mode="time"
            habits={timeHabits}
            bottomInset={bottomInset}
          />
        );
      }

      if (route.key === "tick") {
        return (
          <HabitModeScene
            mode="tick"
            habits={tickHabits}
            bottomInset={bottomInset}
          />
        );
      }

      return (
        <HabitModeScene
          mode="weekly"
          habits={weeklyHabits}
          bottomInset={bottomInset}
        />
      );
    },
    [bottomInset, tickHabits, timeHabits, weeklyHabits],
  );

  return (
    <View className="flex-1">
      <TabView
        navigationState={{ index, routes: ROUTES }}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={handleIndexChange}
        swipeEnabled
        animationEnabled
        lazy
        lazyPreloadDistance={1}
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

export default React.memo(TimeTickTabs);
