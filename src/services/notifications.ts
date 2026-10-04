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
