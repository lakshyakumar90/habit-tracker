import ReminderBootstrap from "@/components/sync/ReminderBootstrap";
import SyncBootstrap from "@/components/sync/SyncBootstrap";
import { getAppTheme } from "@/constants/appThemes";
import { ConvexClerkProvider } from "@/providers/ConvexClerkProvider";
import { tokenCache } from "@/services/clerkTokenCache";
import {
  isReminderSupported,
  requestReminderPermission,
  setupReminderNotificationChannel,
} from "@/services/reminderNotifications";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ClerkLoaded, ClerkProvider } from "@clerk/clerk-expo";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { enableFreeze } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

type NotificationSubscription = { remove: () => void };
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY");
}

enableFreeze(true);

function AppShell() {
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);
  const router = useRouter();
  const responseSubscriptionRef = useRef<NotificationSubscription | null>(null);
  const receiveSubscriptionRef = useRef<NotificationSubscription | null>(null);
  const lastHandledResponseRef = useRef<string | null>(null);
  const previousThemeRef = useRef(selectedTheme);
  const previousBackgroundRef = useRef(appTheme.background);
  const [themeOverlayColor, setThemeOverlayColor] = useState(
    appTheme.background,
  );
  const themeOverlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (!__DEV__) return;

    const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
    console.log("[Debug] EXPO_PUBLIC_CONVEX_URL:", convexUrl ?? "UNDEFINED");
    Alert.alert("Convex URL", convexUrl || "⚠️ UNDEFINED!");
  }, []);

  useEffect(() => {
    if (!__DEV__) return;

    async function debugPermissions() {
      try {
        console.log("[Debug] isDevice:", Device.isDevice);
        console.log("[Debug] platform:", Platform.OS);

        const { status: existing } = await Notifications.getPermissionsAsync();
        console.log("[Debug] Existing permission status:", existing);

        if (existing !== "granted") {
          const { status: newStatus } =
            await Notifications.requestPermissionsAsync();
          console.log("[Debug] New permission status:", newStatus);
          Alert.alert("Notification Permission", `Status: ${newStatus}`);
        } else {
          Alert.alert("Notification Permission", "Already granted!");
        }

        if (Platform.OS === "android") {
          const channel =
            await Notifications.getNotificationChannelAsync("habit-reminders");
          console.log("[Debug] Android channel:", channel);

          if (!channel) {
            const newChannel = await Notifications.setNotificationChannelAsync(
              "habit-reminders",
              {
                name: "Habit Reminders",
                importance: Notifications.AndroidImportance.HIGH,
              },
            );
            console.log("[Debug] Created channel:", newChannel);
          }
        }
      } catch (error) {
        console.error("[Debug] Permission/channel diagnostics failed:", error);
      }
    }

    void debugPermissions();
  }, []);

  useEffect(() => {
    if (previousThemeRef.current === selectedTheme) {
      previousBackgroundRef.current = appTheme.background;
      return;
    }

    setThemeOverlayColor(previousBackgroundRef.current);
    themeOverlayOpacity.value = 1;
    themeOverlayOpacity.value = withTiming(0, { duration: 180 });
    previousThemeRef.current = selectedTheme;
    previousBackgroundRef.current = appTheme.background;
  }, [appTheme.background, selectedTheme, themeOverlayOpacity]);

  useEffect(() => {
    requestReminderPermission().then((granted) => {
      if (__DEV__) {
        console.log("[Notifications] Permission granted:", granted);
      }
    });

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

  const rootContainerStyle = useMemo(
    () => ({ flex: 1, backgroundColor: appTheme.background }),
    [appTheme.background],
  );

  const stackContentStyle = useMemo(
    () => ({ backgroundColor: appTheme.background }),
    [appTheme.background],
  );

  const navigationTheme = useMemo(
    () => ({
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
    }),
    [
      appTheme.background,
      appTheme.card,
      appTheme.cardBorder,
      appTheme.primary,
      appTheme.textPrimary,
    ],
  );

  const themeOverlayStyle = useAnimatedStyle(() => ({
    opacity: themeOverlayOpacity.value,
  }));

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={rootContainerStyle}>
        <ThemeProvider value={navigationTheme}>
          <View className={`theme-${selectedTheme} flex-1`}>
            <StatusBar style="light" />
            <SyncBootstrap />
            <ReminderBootstrap />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: stackContentStyle,
                animation: "fade_from_bottom",
              }}
            >
              <Stack.Screen name="(auth)" />
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
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundColor: themeOverlayColor,
                },
                themeOverlayStyle,
              ]}
            />
          </View>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexClerkProvider>
          <AppShell />
        </ConvexClerkProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
