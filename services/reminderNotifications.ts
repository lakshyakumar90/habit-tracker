import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Habit } from "@/types";
import { Platform } from "react-native";

const REMINDER_KIND = "habit-reminder";
const REMINDER_CHANNEL_ID = "habit-reminders";
const REMINDER_REGISTRY_KEY = "habit-reminder-registry-v1";
const REMINDER_PERMISSION_DENIED_KEY = "notification_permission_denied";

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

type NotificationsModule = typeof import("expo-notifications");

type StoredReminderRegistration = {
  habitId: string;
  reminderId: string;
  habitName: string;
  time: string;
  weekdays: number[];
  notificationIds: string[];
  enabled: boolean;
  updatedAt: string;
};

type ReminderRegistry = Record<string, StoredReminderRegistration>;

let handlerConfigured = false;
let notificationsModulePromise: Promise<NotificationsModule | null> | null =
  null;

const isExpoGo = () => Constants.appOwnership === "expo";

export const isReminderSupported = () =>
  Platform.OS !== "web" && Device.isDevice && !isExpoGo();

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

const reminderStorageKey = (habitId: string, reminderId: string) =>
  `${habitId}:${reminderId}`;

const readReminderRegistry = async (): Promise<ReminderRegistry> => {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_REGISTRY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReminderRegistry;
  } catch {
    return {};
  }
};

const writeReminderRegistry = async (registry: ReminderRegistry) => {
  await AsyncStorage.setItem(REMINDER_REGISTRY_KEY, JSON.stringify(registry));
};

const upsertStoredReminderRegistration = async (
  registration: StoredReminderRegistration,
) => {
  const registry = await readReminderRegistry();
  registry[reminderStorageKey(registration.habitId, registration.reminderId)] =
    registration;
  await writeReminderRegistry(registry);
};

const removeStoredReminderRegistration = async (
  habitId: string,
  reminderId?: string,
) => {
  const registry = await readReminderRegistry();
  const entries = Object.entries(registry).filter(([_, value]) =>
    reminderId
      ? value.habitId === habitId && value.reminderId === reminderId
      : value.habitId === habitId,
  );

  for (const [key] of entries) {
    delete registry[key];
  }

  await writeReminderRegistry(registry);
};

export const hasDeniedReminderPermission = async () =>
  (await AsyncStorage.getItem(REMINDER_PERMISSION_DENIED_KEY)) === "true";

export const setupReminderNotifications = async () => {
  if (handlerConfigured || !isReminderSupported()) return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  handlerConfigured = true;
  return Notifications;
};

export const setupReminderNotificationChannel = async () => {
  const Notifications = await setupReminderNotifications();
  if (!Notifications || Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Habit Reminders",
    description: "Daily reminders for your habits",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    lightColor: "#22c55e",
    enableLights: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
};

export const checkReminderPermission = async () => {
  const Notifications = await setupReminderNotifications();
  if (!Notifications) {
    return {
      granted: false,
      canAskAgain: false,
      supported: isReminderSupported(),
    };
  }

  const current = await Notifications.getPermissionsAsync();
  return {
    granted:
      current.granted ||
      current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
    canAskAgain: current.canAskAgain ?? false,
    supported: true,
  };
};

export const requestReminderPermission = async (): Promise<boolean> => {
  const Notifications = await setupReminderNotifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    await AsyncStorage.removeItem(REMINDER_PERMISSION_DENIED_KEY);
    await setupReminderNotificationChannel();
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: false,
      provideAppNotificationSettings: true,
    },
  });

  const granted =
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (granted) {
    await AsyncStorage.removeItem(REMINDER_PERMISSION_DENIED_KEY);
    await setupReminderNotificationChannel();
    return true;
  }

  await AsyncStorage.setItem(REMINDER_PERMISSION_DENIED_KEY, "true");
  return false;
};

export const getScheduledReminderNotifications = async () => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return [];
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (item) =>
      item.content.data?.kind === REMINDER_KIND ||
      item.content.data?.type === REMINDER_KIND,
  );
};

const getHabitWeekdays = (habit: Habit) =>
  habit.frequency === "weekly"
    ? habit.days
        .map((day) => normalizeWeekday(day))
        .filter((day): day is number => day !== null)
    : [];

export const cancelHabitReminderNotifications = async (habitId: string) => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    await removeStoredReminderRegistration(habitId);
    return;
  }

  const reminderNotifications = await getScheduledReminderNotifications();
  const matching = reminderNotifications.filter(
    (item) => item.content.data?.habitId === habitId,
  );

  await Promise.all(
    matching.map((item) =>
      Notifications.cancelScheduledNotificationAsync(item.identifier),
    ),
  );

  await removeStoredReminderRegistration(habitId);
};

const scheduleReminderRegistration = async (
  habit: Habit,
  reminder: Habit["reminders"][number],
) => {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  const parsed = parseTime(reminder.time);
  if (!parsed) return;

  const weekdays = getHabitWeekdays(habit);
  const scheduleForEveryDay = weekdays.length === 0 || weekdays.length === 7;
  const notificationIds: string[] = [];

  const baseContent = {
    title: habit.name,
    body: "Time to keep your streak going.",
    sound: "default" as const,
    ...(Platform.OS === "android" ? { channelId: REMINDER_CHANNEL_ID } : {}),
    data: {
      kind: REMINDER_KIND,
      type: REMINDER_KIND,
      habitId: habit.id,
      reminderId: reminder.id,
    },
  };

  if (scheduleForEveryDay) {
    const id = await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsed.hour,
        minute: parsed.minute,
      },
    });
    notificationIds.push(id);
  } else {
    for (const weekday of weekdays) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          ...baseContent,
          data: {
            ...baseContent.data,
            weekday,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: parsed.hour,
          minute: parsed.minute,
        },
      });
      notificationIds.push(id);
    }
  }

  await upsertStoredReminderRegistration({
    habitId: habit.id,
    reminderId: reminder.id,
    habitName: habit.name,
    time: reminder.time,
    weekdays,
    notificationIds,
    enabled: reminder.enabled,
    updatedAt: habit.updatedAt,
  });
};

export const syncHabitReminderNotifications = async (
  habit: Habit,
  remindersEnabled: boolean,
) => {
  if (!isReminderSupported()) return;

  await cancelHabitReminderNotifications(habit.id);
  if (!remindersEnabled || habit.archived) return;

  const hasAnyEnabledReminder = habit.reminders.some((item) => item.enabled);
  if (!hasAnyEnabledReminder) return;

  const granted = await requestReminderPermission();
  if (!granted) return;

  await setupReminderNotificationChannel();

  for (const reminder of habit.reminders) {
    if (!reminder.enabled) continue;
    await scheduleReminderRegistration(habit, reminder);
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
  await writeReminderRegistry({});

  if (!remindersEnabled) return;

  const granted = await requestReminderPermission();
  if (!granted) return;

  for (const habit of habits) {
    await syncHabitReminderNotifications(habit, true);
  }
};

export const verifyReminderScheduleState = async () => {
  const registry = await readReminderRegistry();
  const scheduled = await getScheduledReminderNotifications();
  const scheduledIds = new Set(scheduled.map((item) => item.identifier));
  const missingHabitIds = new Set<string>();
  let expected = 0;

  for (const registration of Object.values(registry)) {
    if (!registration.enabled) continue;
    for (const notificationId of registration.notificationIds) {
      expected += 1;
      if (!scheduledIds.has(notificationId)) {
        missingHabitIds.add(registration.habitId);
      }
    }
  }

  return {
    scheduled: scheduled.length,
    expected,
    missingHabitIds: [...missingHabitIds],
  };
};

export const rescheduleHabitRemindersIfNeeded = async (
  habits: Habit[],
  remindersEnabled: boolean,
) => {
  if (!remindersEnabled || !isReminderSupported()) return;

  const granted = await checkReminderPermission();
  if (!granted.granted) return;

  const { missingHabitIds } = await verifyReminderScheduleState();
  if (missingHabitIds.length === 0) return;

  for (const habitId of missingHabitIds) {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) continue;
    await syncHabitReminderNotifications(habit, true);
  }
};

export const clearAllReminderSchedules = async () => {
  const Notifications = await getNotificationsModule();
  if (Notifications) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  await writeReminderRegistry({});
};
