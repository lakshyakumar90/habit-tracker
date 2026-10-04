import type { Href } from 'expo-router';

// Keep route literals checked here until Expo regenerates complete types for the configured src/app root.
type HabitlyRoute = '/' | '/welcome' | '/onboarding' | '/(tabs)/today' | '/(tabs)/tasks' | '/(tabs)/profile' | '/settings' | '/search' | '/achievements' | '/achievements/streak' | { pathname:'/habit/[id]'; params:{id:string} } | { pathname:'/task/[id]'; params:{id:string} } | { pathname:'/statistics/[id]'; params:{id:string} } | { pathname:'/statistics/history/[id]'; params:{id:string} };
export const appRoute = (route:HabitlyRoute) => route as Href;
