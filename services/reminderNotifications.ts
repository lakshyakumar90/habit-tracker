import { Habit } from "@/types";
import * as Device from "expo-device";
import * as IntentLauncher from "expo-intent-launcher";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_CHANNEL_ID = "habit-reminders";

const WEEKDAY_MAP: Record<string, number> = {
  sun: 1,
  sunday: 1,
  mon: 2,
  monday: 2,
  tue: 3,
  tues: 3,
  tuesday: 3,
  wed: 4,
  wednesday: 4,
  thu: 5,
  thur: 5,
  thurs: 5,
  thursday: 5,
  fri: 6,
  friday: 6,
  sat: 7,
  saturday: 7,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const isReminderSupported = () =>
  Platform.OS !== "web" && Device.isDevice;

export async function requestExactAlarmPermission() {
  if (Platform.OS !== "android" || Platform.Version < 33) return;

  try {
    await IntentLauncher.startActivityAsync(
      "android.settings.REQUEST_SCHEDULE_EXACT_ALARM",
    );
  } catch (error) {
    console.warn("[Notifications] Exact alarm permission error:", error);
  }
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!isReminderSupported()) {
    console.warn("[Notifications] Physical device required");
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Notifications] Permission denied");
    return false;
  }

  await setupReminderNotificationChannel();
  return true;
}

export async function setupReminderNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Habit Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    enableLights: true,
    lightColor: "#FF22C55E",
    showBadge: true,
    description: "Daily reminders for your habits",
    // ✅ NO sound property — uses system default automatically
  });
}

export async function cancelHabitReminders(habitId: string): Promise<void> {
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of allScheduled) {
    if (notification.content.data?.habitId === habitId) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier,
      );
      console.log(`[Notifications] Cancelled: ${notification.identifier}`);
    }
  }
}

export const cancelHabitReminderNotifications = cancelHabitReminders;

export interface ReminderConfig {
  habitId: string;
  habitName: string;
  hour: number;
  minute: number;
  days: number[];
}

const scheduleWeeklyEntries = async (
  config: ReminderConfig,
  cancelExisting: boolean,
): Promise<string[]> => {
  const { habitId, habitName, hour, minute, days } = config;

  if (cancelExisting) {
    await cancelHabitReminders(habitId);
  }

  const scheduledIds: string[] = [];

  for (const weekday of days) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Habit Reminder",
          body: `Time to: ${habitName}`,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === "android" && {
            channelId: REMINDER_CHANNEL_ID,
          }),
          data: {
            habitId,
            habitName,
            weekday,
            kind: "habit-reminder",
            type: "habit-reminder",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });

      scheduledIds.push(id);
      console.log(
        `[Notifications] Scheduled: day=${weekday} at ${hour}:${minute} -> ID: ${id}`,
      );
    } catch (error) {
      console.error(
        `[Notifications] Failed to schedule day=${weekday}:`,
        error,
      );
    }
  }

  return scheduledIds;
};

export async function scheduleHabitReminders(
  config: ReminderConfig,
): Promise<string[]> {
  const hasPermission = await requestReminderPermission();
  if (!hasPermission) {
    console.warn("[Notifications] No permission, skipping schedule");
    return [];
  }

  const scheduledIds = await scheduleWeeklyEntries(config, true);
  const all = await Notifications.getAllScheduledNotificationsAsync();
  console.log(
    "[Notifications] Total scheduled:",
    all.length,
    all.map((n) => ({
      id: n.identifier,
      trigger: n.trigger,
      data: n.content.data,
    })),
  );

  return scheduledIds;
}

export async function scheduleTestReminder(): Promise<string | null> {
  const hasPermission = await requestReminderPermission();
  if (!hasPermission) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Reminder",
      body: "This fired 10 seconds after scheduling!",
      ...(Platform.OS === "android" && {
        channelId: REMINDER_CHANNEL_ID,
      }),
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
    },
  });

  console.log("[Notifications] Test scheduled, ID:", id);
  return id;
}

export async function debugListScheduled(): Promise<void> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  console.log("[Notifications] ALL SCHEDULED:", JSON.stringify(all, null, 2));
}

const parseTime = (value: string) => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const normalizeDays = (habit: Habit): number[] => {
  if (habit.frequency !== "weekly") {
    return [1, 2, 3, 4, 5, 6, 7];
  }

  const mapped = habit.days
    .map((day) => WEEKDAY_MAP[day.trim().toLowerCase()])
    .filter((day): day is number => Boolean(day));

  return mapped.length > 0 ? mapped : [1, 2, 3, 4, 5, 6, 7];
};

export async function syncHabitReminderNotifications(
  habit: Habit,
  remindersEnabled: boolean,
): Promise<void> {
  await cancelHabitReminders(habit.id);

  if (!remindersEnabled || habit.archived) return;

  const enabledReminders = habit.reminders.filter(
    (reminder) => reminder.enabled,
  );
  if (enabledReminders.length === 0) return;

  const hasPermission = await requestReminderPermission();
  if (!hasPermission) return;

  const days = normalizeDays(habit);

  for (const reminder of enabledReminders) {
    const parsed = parseTime(reminder.time);
    if (!parsed) continue;
    await scheduleWeeklyEntries(
      {
        habitId: habit.id,
        habitName: habit.name,
        hour: parsed.hour,
        minute: parsed.minute,
        days,
      },
      false,
    );
  }
}

let syncAllInFlight: Promise<void> | null = null;

export async function syncAllHabitReminderNotifications(
  habits: Habit[],
  remindersEnabled: boolean,
): Promise<void> {
  if (syncAllInFlight) {
    return syncAllInFlight;
  }

  syncAllInFlight = (async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!remindersEnabled) return;

    for (const habit of habits) {
      await syncHabitReminderNotifications(habit, true);
    }
  })();

  try {
    await syncAllInFlight;
  } finally {
    syncAllInFlight = null;
  }
}

export async function rescheduleHabitRemindersIfNeeded(
  habits: Habit[],
  remindersEnabled: boolean,
): Promise<void> {
  if (!remindersEnabled) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  if (scheduled.length > 0) return;

  await syncAllHabitReminderNotifications(habits, remindersEnabled);
}

export async function clearAllReminderSchedules(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
