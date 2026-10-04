import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { TaskRepeatRule } from '../features/tasks/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestReminderPermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('habitly-reminders', {
      name: 'Habitly reminders',
      description: 'Reminders for tasks you scheduled in Habitly.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 160],
      lightColor: '#6750C7',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const result = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  return result.granted;
}

export async function getReminderPermissionStatus() {
  if (Platform.OS === 'web') return { granted: false, canAskAgain: false };
  const permission = await Notifications.getPermissionsAsync();
  return { granted: permission.granted, canAskAgain: permission.canAskAgain };
}

export async function sendTestReminder() {
  if (Platform.OS === 'web') throw new Error('Local reminders are available in the Android and iOS app.');
  if (!await requestReminderPermission()) {
    throw new Error('Notifications are disabled. Allow them in your device settings, then try again.');
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Habitly reminder test',
      body: 'Notifications are working on this device.',
      data: { entityType: 'test' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 5_000),
      ...(Platform.OS === 'android' ? { channelId: 'habitly-reminders' } : {}),
    },
  });
}

/** Schedule a repeating local notification and return its id for later removal. */
export async function scheduleDailyNudge(title: string, body: string, time: string) {
  if (Platform.OS === 'web') throw new Error('Scheduled reminders are available in the Android and iOS app.');
  if (!await requestReminderPermission()) throw new Error('Allow notifications in system settings to schedule this reminder.');
  const [hour, minute] = time.split(':').map(Number);
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: { entityType: 'daily-nudge' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, ...(Platform.OS === 'android' ? { channelId: 'habitly-reminders' } : {}) },
  });
}

export async function cancelReminder(id: string) {
  if (Platform.OS !== 'web') await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllReminders() {
  if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelEntityReminders(taskId: string) {
  if (Platform.OS === 'web') return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(pending
    .filter(notification => notification.content.data?.entityId === taskId)
    .map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}

export async function scheduleTaskReminder(taskId: string, title: string, dueDate: string, time: string) {
  await cancelEntityReminders(taskId);
  if (Platform.OS === 'web') return null;
  const granted = await requestReminderPermission();
  if (!granted) throw new Error('Allow notifications in system settings to schedule a reminder.');
  const [hour, minute] = time.split(':').map(Number);
  const triggerDate = new Date(`${dueDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  if (triggerDate.getTime() <= Date.now()) throw new Error('Choose a reminder time that has not passed.');
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task reminder',
      body: title,
      data: { entityId: taskId, entityType: 'task' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...(Platform.OS === 'android' ? { channelId: 'habitly-reminders' } : {}),
    },
  });
  return notificationId;
}

export async function scheduleTaskNotifications(taskId: string, title: string, config: { dueDate: string; dueTime: string | null; reminders: number[]; repeatRule: TaskRepeatRule; repeatDays: number[] }) {
  await cancelEntityReminders(taskId);
  if (!config.reminders.length || Platform.OS === 'web') return [];
  if (!config.dueTime) throw new Error('Choose a due time before adding reminders.');
  if (!await requestReminderPermission()) throw new Error('Allow notifications in system settings to schedule a reminder.');
  const [hour, minute] = config.dueTime.split(':').map(Number);
  const triggerDate = new Date(`${config.dueDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  const ids: string[] = [];
  try {
    if (config.repeatRule === 'none') {
      const triggers = config.reminders.map(offset => new Date(triggerDate.getTime() - offset * 60_000)).filter(date => date.getTime() > Date.now());
      if (!triggers.length) throw new Error('The selected reminder time has passed. Choose a future date and time.');
      for (const date of triggers) ids.push(await Notifications.scheduleNotificationAsync({
        content: { title: 'Task reminder', body: title, data: { entityId: taskId, entityType: 'task' }, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, ...(Platform.OS === 'android' ? { channelId: 'habitly-reminders' } : {}) },
      }));
    } else {
      const dueWeekday = new Date(`${config.dueDate}T12:00:00`).getDay();
      const days = config.repeatRule === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : config.repeatRule === 'weekly' ? [dueWeekday] : config.repeatDays;
      if (!days.length) throw new Error('Choose at least one repeat day.');
      const scheduledTimes = new Set<string>();
      for (const day of days) for (const offset of config.reminders) {
        const dueMinutes = hour * 60 + minute - offset;
        const dayShift = Math.floor(dueMinutes / 1440);
        const timeOfDay = (dueMinutes % 1440 + 1440) % 1440;
        const weekday = (day + dayShift + 7) % 7;
        const triggerKey = `${weekday}-${Math.floor(timeOfDay / 60)}-${timeOfDay % 60}`;
        if (scheduledTimes.has(triggerKey)) continue;
        scheduledTimes.add(triggerKey);
        ids.push(await Notifications.scheduleNotificationAsync({
          content: { title: 'Task reminder', body: title, data: { entityId: taskId, entityType: 'task' }, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: weekday + 1, hour: Math.floor(timeOfDay / 60), minute: timeOfDay % 60, ...(Platform.OS === 'android' ? { channelId: 'habitly-reminders' } : {}) },
        }));
      }
    }
    return ids;
  } catch (error) {
    await cancelEntityReminders(taskId);
    throw error;
  }
}

export async function scheduleHabitReminders(habitId:string,name:string,weekdays:number[],time:string) {
  await cancelEntityReminders(habitId);
  if(Platform.OS==='web'||!weekdays.length)return [];
  if(!await requestReminderPermission())throw new Error('Allow notifications in system settings to schedule a reminder.');
  const [hour,minute]=time.split(':').map(Number);
  const ids:string[]=[];
  for(const weekday of weekdays){
    ids.push(await Notifications.scheduleNotificationAsync({
      content:{title:'Habit reminder',body:`Time for ${name}.`,data:{entityId:habitId,entityType:'habit'},sound:true},
      trigger:{type:Notifications.SchedulableTriggerInputTypes.WEEKLY,weekday:weekday+1,hour,minute,...(Platform.OS==='android'?{channelId:'habitly-reminders'}:{})},
    }));
  }
  return ids;
}
