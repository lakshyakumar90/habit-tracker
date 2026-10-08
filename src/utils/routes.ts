import type { Href } from "expo-router";

// Keep route literals checked here until Expo regenerates complete types for the configured src/app root.
type HabitlyRoute =
  | "/"
  | "/welcome"
  | "/onboarding"
  | "/(tabs)/today"
  | "/(tabs)/habits"
  | "/(tabs)/tasks"
  | "/(tabs)/stats"
  | "/(tabs)/profile"
  | "/settings"
  | "/search"
  | "/achievements"
  | "/achievements/streak"
  | {
      pathname: "/habit/[id]";
      params: { id: string; from?: "today" | "habits" };
    }
  | { pathname: "/task/[id]"; params: { id: string } }
  | { pathname: "/statistics/[id]"; params: { id: string; from?: "stats" } }
  | { pathname: "/statistics/history/[id]"; params: { id: string } };
export const appRoute = (route: HabitlyRoute) => route as Href;
