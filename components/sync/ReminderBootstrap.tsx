import { syncAllHabitReminderNotifications } from "@/services/reminderNotifications";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEffect } from "react";

export default function ReminderBootstrap() {
  const habits = useHabitStore((state) => state.habits);
  const habitsHydrated = useHabitStore((state) => state._hasHydrated);
  const remindersEnabled = useSettingsStore((state) => state.remindersEnabled);
  const settingsHydrated = useSettingsStore((state) => state._hasHydrated);

  useEffect(() => {
    if (!habitsHydrated || !settingsHydrated) return;
    void syncAllHabitReminderNotifications(habits, remindersEnabled);
  }, [habits, remindersEnabled, habitsHydrated, settingsHydrated]);

  return null;
}
