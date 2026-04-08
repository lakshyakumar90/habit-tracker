import { Habit } from "@/types";
import Constants from "expo-constants";
import { Platform } from "react-native";

const REMINDER_KIND = "habit-reminder";

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

let handlerConfigured = false;
let notificationsModulePromise: Promise<typeof import("expo-notifications") | null> | null =
  null;

const isExpoGo = () => Constants.appOwnership === "expo";
const isReminderSupported = () => Platform.OS !== "web" && !isExpoGo();

const getNotificationsModule = async () => {
  if (!isReminderSupported()) return null;
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").catch(() => null);
  }
  return notificationsModulePromise;
};

const normalizeWeekday = (value: string): number | null => {
  const normalized = value.trim().toLowerCase();
  return WEEKDAY_MAP[normalized] ?? null;
};

const parseTime = (value: string) => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

const ensureNotificationHandler = async () => {
  if (handlerConfigured || !isReminderSupported()) return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
  return Notifications;
};

const ensurePermissions = async (): Promise<boolean> => {
  if (!isReminderSupported()) return false;

  const Notifications = await ensureNotificationHandler();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("habit-reminders", {
      name: "Habit Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

const getScheduledReminderNotifications = async () => {
  if (!isReminderSupported()) return [];
  const Notifications = await getNotificationsModule();
  if (!Notifications) return [];
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter((item) => item.content.data?.kind === REMINDER_KIND);
};

export const cancelHabitReminderNotifications = async (habitId: string) => {
  if (!isReminderSupported()) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const reminderNotifications = await getScheduledReminderNotifications();
  await Promise.all(
    reminderNotifications
      .filter((item) => item.content.data?.habitId === habitId)
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
};

export const syncHabitReminderNotifications = async (
  habit: Habit,
  remindersEnabled: boolean,
) => {
  if (!isReminderSupported()) return;

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  await cancelHabitReminderNotifications(habit.id);
  if (!remindersEnabled || habit.archived) return;

  const hasAnyEnabledReminder = habit.reminders.some((r) => r.enabled);
  if (!hasAnyEnabledReminder) return;

  const granted = await ensurePermissions();
  if (!granted) return;

  for (const reminder of habit.reminders) {
    if (!reminder.enabled) continue;
    const parsed = parseTime(reminder.time);
    if (!parsed) continue;

    const baseContent = {
      title: habit.name,
      body: "Time to keep your streak going.",
      sound: "default" as const,
      data: {
        kind: REMINDER_KIND,
        habitId: habit.id,
        reminderId: reminder.id,
      },
    };

    const weekdays =
      habit.frequency === "weekly"
        ? habit.days
            .map((day) => normalizeWeekday(day))
            .filter((day): day is number => day !== null)
        : [];

    if (weekdays.length > 0) {
      for (const weekday of weekdays) {
        await Notifications.scheduleNotificationAsync({
          content: baseContent,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: parsed.hour,
            minute: parsed.minute,
          },
        });
      }
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });
  }
};

export const syncAllHabitReminderNotifications = async (
  habits: Habit[],
  remindersEnabled: boolean,
) => {
  if (!isReminderSupported()) return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const reminderNotifications = await getScheduledReminderNotifications();
  await Promise.all(
    reminderNotifications.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier),
    ),
  );

  if (!remindersEnabled) return;

  for (const habit of habits) {
    await syncHabitReminderNotifications(habit, true);
  }
};