import CloudSyncPrompt from "@/components/sync/CloudSyncPrompt";
import ReminderBootstrap from "@/components/sync/ReminderBootstrap";
import SyncBootstrap from "@/components/sync/SyncBootstrap";
import { getAppTheme } from "@/constants/appThemes";
import { authClient } from "@/services/auth";
import { convex } from "@/services/convex";
import {
    isReminderSupported,
    setupReminderNotificationChannel,
} from "@/services/reminderNotifications";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

type NotificationSubscription = { remove: () => void };

export default function RootLayout() {
  const router = useRouter();
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const responseSubscriptionRef = useRef<NotificationSubscription | null>(null);
  const receiveSubscriptionRef = useRef<NotificationSubscription | null>(null);
  const lastHandledResponseRef = useRef<string | null>(null);

  useEffect(() => {
    const handleReminderRoute = (data: Record<string, unknown> | undefined) => {
      const habitId =
        typeof data?.habitId === "string" ? data.habitId : undefined;
      const kind =
        typeof data?.kind === "string"
          ? data.kind
          : typeof data?.type === "string"
            ? data.type
            : undefined;
      if (habitId && kind === "habit-reminder") {
        router.push(`/habit/${habitId}`);
      }
    };

    if (!isReminderSupported()) {
      return () => {
        receiveSubscriptionRef.current?.remove();
        responseSubscriptionRef.current?.remove();
      };
    }

    void setupReminderNotificationChannel();

    void import("expo-notifications").then((Notifications) => {
      receiveSubscriptionRef.current =
        Notifications.addNotificationReceivedListener(() => {
          // Foreground notifications are allowed by the handler; no extra UI yet.
        });

      responseSubscriptionRef.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const requestId = response.notification.request.identifier;
          if (lastHandledResponseRef.current === requestId) return;
          lastHandledResponseRef.current = requestId;
          handleReminderRoute(
            response.notification.request.content.data as Record<
              string,
              unknown
            >,
          );
        });

      void Notifications.getLastNotificationResponseAsync().then((response) => {
        if (!response) return;
        const requestId = response.notification.request.identifier;
        if (lastHandledResponseRef.current === requestId) return;
        lastHandledResponseRef.current = requestId;
        setTimeout(() => {
          handleReminderRoute(
            response.notification.request.content.data as Record<
              string,
              unknown
            >,
          );
        }, 600);
      });
    });

    return () => {
      receiveSubscriptionRef.current?.remove();
      responseSubscriptionRef.current?.remove();
    };
  }, [router]);

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
                  name="edit-habit"
                  options={{
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
