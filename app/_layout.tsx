import CloudSyncPrompt from "@/components/sync/CloudSyncPrompt";
import ReminderBootstrap from "@/components/sync/ReminderBootstrap";
import SyncBootstrap from "@/components/sync/SyncBootstrap";
import { getAppTheme } from "@/constants/appThemes";
import { authClient } from "@/services/auth";
import { convex } from "@/services/convex";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: appTheme.primary,
      background: appTheme.background,
      card: appTheme.card,
      text: appTheme.textPrimary,
      border: appTheme.cardBorder,
      notification: appTheme.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: appTheme.background }}
      >
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          <ThemeProvider value={navigationTheme}>
            <View className={`theme-${selectedTheme} flex-1`}>
              <StatusBar style="light" />
              <SyncBootstrap />
              <ReminderBootstrap />
              <CloudSyncPrompt />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: appTheme.background },
                  animation: "fade_from_bottom",
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen
                  name="add-habit"
                  options={{
                    animation: "slide_from_bottom",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen
                  name="analytics"
                  options={{
                    animation: "slide_from_bottom",
                    presentation: "modal",
                  }}
                />
                <Stack.Screen name="settings" />
                <Stack.Screen name="habit/[id]" />
                <Stack.Screen name="archived-habits" />
                <Stack.Screen name="widgets" />
                <Stack.Screen name="roadmap" />
                <Stack.Screen name="whats-new" />
                <Stack.Screen name="app-intro" />
                <Stack.Screen name="privacy-policy" />
                <Stack.Screen name="terms" />
              </Stack>
            </View>
          </ThemeProvider>
        </ConvexBetterAuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
