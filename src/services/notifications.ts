import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

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
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task reminders',
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

export async function cancelTaskReminder(taskId: string) {
  if (Platform.OS === 'web') return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(pending
    .filter(notification => notification.content.data?.taskId === taskId)
    .map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier)));
}

export async function scheduleTaskReminder(taskId: string, title: string, dueDate: string, time: string) {
  await cancelTaskReminder(taskId);
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
      data: { taskId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...(Platform.OS === 'android' ? { channelId: 'task-reminders' } : {}),
    },
  });
  return notificationId;
}
