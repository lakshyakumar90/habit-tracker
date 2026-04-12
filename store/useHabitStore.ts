import {
  syncDeletedHabit,
  syncDeletedHabitLog,
  syncUpsertHabit,
  syncUpsertHabitLog,
} from "@/services/cloudSync";
import {
  cancelHabitReminderNotifications,
  syncAllHabitReminderNotifications,
  syncHabitReminderNotifications,
} from "@/services/reminderNotifications";
import { Habit, HabitLogEntry, SyncSnapshot, ViewMode } from "@/types";
import { getTodayString, getWeekDates } from "@/utils/dates";
import { generateId } from "@/utils/helpers";
import { getNowIso } from "@/utils/timestamps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useSettingsStore } from "./useSettingsStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HabitState {
  habits: Habit[];
  logs: Record<string, number>;
  selectedDate: string;
  viewMode: ViewMode;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  addHabit: (
    habit: Omit<Habit, "id" | "createdAt" | "updatedAt" | "archived">,
  ) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  setTimeValue: (habitId: string, date: string, minutes: number) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  getHabitLog: (habitId: string, date: string) => number;
  getCompletionForDate: (date: string) => { completed: number; total: number };
  isHabitCompletedOnDate: (habitId: string, date: string) => boolean;
  getWeekProgress: (
    habitId: string,
    referenceDate?: string,
  ) => { completedDays: number; totalDays: number };
  exportLogs: () => HabitLogEntry[];
  applySnapshot: (snapshot: Pick<SyncSnapshot, "habits" | "logs">) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSettingsState = () => useSettingsStore.getState();

const getTarget = (habit: Habit | undefined): number =>
  habit?.completionTargetEnabled ? habit.targetCount : 1;

const makeLogKey = (habitId: string, date: string) => `${habitId}_${date}`;

const isFutureDate = (date: string): boolean => {
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return target > today;
};

const syncIfEnabled = async (operation: () => Promise<void>) => {
  const { cloudSyncEnabled } = getSettingsState();
  if (!cloudSyncEnabled) return;
  try {
    await operation();
  } catch (error) {
    console.error("Cloud habit sync failed", error);
    getSettingsState().setCloudSyncStatus("error", "Habit data failed to sync.");
  }
};

const syncHabitAndReminders = (habit: Habit) => {
  void syncIfEnabled(() => syncUpsertHabit(habit));
  void syncHabitReminderNotifications(habit, getSettingsState().remindersEnabled);
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: {},
      selectedDate: getTodayString(),
      viewMode: "tick",
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addHabit: (habitData) => {
        const now = getNowIso();
        const habit: Habit = {
          ...habitData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          archived: false,
        };
        set((state) => ({ habits: [...state.habits, habit] }));
        syncHabitAndReminders(habit);
      },

      updateHabit: (id, updates) => {
        const updatedAt = getNowIso();
        let updatedHabit: Habit | undefined;

        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            updatedHabit = { ...h, ...updates, updatedAt };
            return updatedHabit;
          }),
        }));

        if (updatedHabit) {
          syncHabitAndReminders(updatedHabit);
        }
      },

      deleteHabit: (id) => {
        const deletedAt = getNowIso();

        set((state) => {
          const prefix = `${id}_`;
          const newLogs: Record<string, number> = {};

          // Build new logs object without deleted habit's entries
          // More efficient than clone + delete for large log sets
          for (const key in state.logs) {
            if (!key.startsWith(prefix)) {
              newLogs[key] = state.logs[key];
            }
          }

          return {
            habits: state.habits.filter((h) => h.id !== id),
            logs: newLogs,
          };
        });

        void syncIfEnabled(() => syncDeletedHabit(id, deletedAt));
        void cancelHabitReminderNotifications(id);
      },

      archiveHabit: (id) => {
        const updatedAt = getNowIso();
        let archivedHabit: Habit | undefined;

        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            archivedHabit = { ...h, archived: true, updatedAt };
            return archivedHabit;
          }),
        }));

        if (archivedHabit) {
          syncHabitAndReminders(archivedHabit);
        }
      },

      unarchiveHabit: (id) => {
        const updatedAt = getNowIso();
        let restoredHabit: Habit | undefined;

        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            restoredHabit = { ...h, archived: false, updatedAt };
            return restoredHabit;
          }),
        }));

        if (restoredHabit) {
          syncHabitAndReminders(restoredHabit);
        }
      },

      toggleHabit: (habitId, date) => {
        if (isFutureDate(date)) return;

        const key = makeLogKey(habitId, date);
        const updatedAt = getNowIso();

        set((state) => {
          const current = state.logs[key] || 0;
          const habit = state.habits.find((h) => h.id === habitId);
          const target = getTarget(habit);
          const nextValue = current >= target ? 0 : current + 1;

          return { logs: { ...state.logs, [key]: nextValue } };
        });

        const nextValue = get().logs[key] || 0;

        void syncIfEnabled(() =>
          nextValue === 0
            ? syncDeletedHabitLog(habitId, date, updatedAt)
            : syncUpsertHabitLog({ habitId, date, value: nextValue, updatedAt }),
        );
      },

      setTimeValue: (habitId, date, minutes) => {
        if (isFutureDate(date)) return;

        const key = makeLogKey(habitId, date);
        const updatedAt = getNowIso();

        set((state) => ({ logs: { ...state.logs, [key]: minutes } }));

        void syncIfEnabled(() =>
          minutes <= 0
            ? syncDeletedHabitLog(habitId, date, updatedAt)
            : syncUpsertHabitLog({ habitId, date, value: minutes, updatedAt }),
        );
      },

      setSelectedDate: (date) => {
        // Bail early if unchanged
        if (get().selectedDate === date) return;
        set({ selectedDate: date });
      },

      setViewMode: (mode) => {
        if (get().viewMode === mode) return;
        set({ viewMode: mode });
      },

      getHabitLog: (habitId, date) =>
        get().logs[makeLogKey(habitId, date)] || 0,

      getCompletionForDate: (date) => {
        const state = get();
        const activeHabits = state.habits.filter((h) => !h.archived);
        let completed = 0;

        for (const habit of activeHabits) {
          const value = state.logs[makeLogKey(habit.id, date)] || 0;
          if (value >= getTarget(habit)) completed++;
        }

        return { completed, total: activeHabits.length };
      },

      isHabitCompletedOnDate: (habitId, date) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        return (state.logs[makeLogKey(habitId, date)] || 0) >= getTarget(habit);
      },

      getWeekProgress: (habitId, referenceDate) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { completedDays: 0, totalDays: 7 };

        const baseDate = referenceDate ? new Date(referenceDate) : new Date();
        const weekDates = getWeekDates(baseDate);
        const target = getTarget(habit);

        let completedDays = 0;
        for (const date of weekDates) {
          const dateStr = date.toISOString().slice(0, 10);
          if ((state.logs[makeLogKey(habitId, dateStr)] || 0) >= target) {
            completedDays++;
          }
        }

        return { completedDays, totalDays: 7 };
      },

      exportLogs: () => {
        const logs = get().logs;
        const now = getNowIso();
        const entries: HabitLogEntry[] = [];

        for (const key in logs) {
          const separatorIdx = key.indexOf("_");
          entries.push({
            habitId: key.slice(0, separatorIdx),
            date: key.slice(separatorIdx + 1),
            value: logs[key],
            updatedAt: now,
          });
        }

        return entries;
      },

      applySnapshot: (snapshot) => {
        const logs: Record<string, number> = {};

        for (const log of snapshot.logs) {
          if (!log.deletedAt) {
            logs[makeLogKey(log.habitId, log.date)] = log.value;
          }
        }

        set({ habits: snapshot.habits, logs });

        void syncAllHabitReminderNotifications(
          snapshot.habits,
          getSettingsState().remindersEnabled,
        );
      },
    }),
    {
      name: "habit-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
      }),
    },
  ),
);