import * as Notifications from 'expo-notifications';
import { getDatabaseOwner } from '../database/client';
import { habitsRepository, preferencesRepository, tasksRepository } from '../database/repositories';
import { cancelEntityReminders, cancelReminder, scheduleDailyNudge, scheduleHabitReminders, scheduleTaskNotifications } from './notifications';

let reconciling = false;

export async function suspendDeviceReminders() {
  for (const habit of await habitsRepository.all()) {
    if (!habit.notificationIds?.length) continue;
    await cancelEntityReminders(habit.id);
    await habitsRepository.setNotificationIds(habit.id, []);
  }
  for (const task of await tasksRepository.all()) {
    if (!task.notificationIds.length) continue;
    await cancelEntityReminders(task.id);
    await tasksRepository.setNotificationIds(task.id, []);
  }
  for (const key of ['dailySummaryNotificationId', 'motivationalQuoteNotificationId']) {
    const id = await preferencesRepository.get(key, '');
    if (id) { await cancelReminder(id); await preferencesRepository.set(key, ''); }
  }
}

export async function reconcileDeviceReminders(uid: string | null) {
  if (reconciling || getDatabaseOwner() !== uid) return;
  reconciling = true;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted || getDatabaseOwner() !== uid) return;
    const habitsEnabled = await preferencesRepository.get('habitRemindersEnabled', 'true');
    for (const habit of await habitsRepository.all()) {
      if (getDatabaseOwner() !== uid) return;
      if (habitsEnabled === 'false' || habit.archived || !habit.reminderAt || habit.notificationIds?.length) continue;
      try {
        const ids = await scheduleHabitReminders(habit.id, habit.name, habit.schedule, habit.reminderAt);
        await habitsRepository.setNotificationIds(habit.id, ids);
      } catch { /* A failed device reminder never blocks data sync. */ }
    }
    for (const task of await tasksRepository.all()) {
      if (getDatabaseOwner() !== uid) return;
      if (task.completed || !task.dueTime || !task.reminders.length || task.notificationIds.length) continue;
      try {
        const ids = await scheduleTaskNotifications(task.id, task.title, task);
        await tasksRepository.setNotificationIds(task.id, ids);
      } catch { /* Past due reminders and OS errors do not block sync. */ }
    }
    const nudges = [
      { enabled: 'dailySummaryEnabled', id: 'dailySummaryNotificationId', time: 'dailySummaryTime', defaultTime: '20:30', title: 'Your Habitly daily summary', body: 'Take a moment to review today’s habit progress.' },
      { enabled: 'motivationalQuotesEnabled', id: 'motivationalQuoteNotificationId', time: 'motivationalQuotesTime', defaultTime: '08:00', title: 'A small thought for today', body: 'Small steps, repeated often, add up.' },
    ];
    for (const nudge of nudges) {
      if (getDatabaseOwner() !== uid) return;
      if (await preferencesRepository.get(nudge.enabled, 'false') !== 'true' || await preferencesRepository.get(nudge.id, '')) continue;
      try {
        const id = await scheduleDailyNudge(nudge.title, nudge.body, await preferencesRepository.get(nudge.time, nudge.defaultTime));
        await preferencesRepository.set(nudge.id, id);
      } catch { /* An OS scheduling error never blocks account data. */ }
    }
  } finally { reconciling = false; }
}
