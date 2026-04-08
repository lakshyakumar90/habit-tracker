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

const syncIfEnabled = async (operation: () => Promise<void>) => {
  const { cloudSyncEnabled } = useSettingsStore.getState();
  if (!cloudSyncEnabled) return;
  try {
    await operation();
  } catch (error) {
    console.error("Cloud habit sync failed", error);
    useSettingsStore
      .getState()
      .setCloudSyncStatus("error", "Habit data failed to sync.");
  }
};

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
        void syncIfEnabled(() => syncUpsertHabit(habit));
        void syncHabitReminderNotifications(
          habit,
          useSettingsStore.getState().remindersEnabled,
        );
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
          void syncIfEnabled(() => syncUpsertHabit(updatedHabit!));
          void syncHabitReminderNotifications(
            updatedHabit,
            useSettingsStore.getState().remindersEnabled,
          );
        }
      },

      deleteHabit: (id) => {
        const deletedAt = getNowIso();
        set((state) => {
          const newLogs = { ...state.logs };
          Object.keys(newLogs).forEach((key) => {
            if (key.startsWith(`${id}_`)) delete newLogs[key];
          });
          return {
            habits: state.habits.filter((h) => h.id !== id),
            logs: newLogs,
          };
        });
        void syncIfEnabled(async () => {
          await syncDeletedHabit(id, deletedAt);
        });
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
          void syncIfEnabled(() => syncUpsertHabit(archivedHabit!));
          void syncHabitReminderNotifications(
            archivedHabit,
            useSettingsStore.getState().remindersEnabled,
          );
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
          void syncIfEnabled(() => syncUpsertHabit(restoredHabit!));
          void syncHabitReminderNotifications(
            restoredHabit,
            useSettingsStore.getState().remindersEnabled,
          );
        }
      },

      toggleHabit: (habitId, date) => {
        // Prevent completing habits for future dates
        const targetDate = new Date(date);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (targetDate > today) return;

        const key = `${habitId}_${date}`;
        const updatedAt = getNowIso();
        set((state) => {
          const current = state.logs[key] || 0;
          const habit = state.habits.find((h) => h.id === habitId);
          const target = habit?.completionTargetEnabled ? habit.targetCount : 1;
          const nextValue = current >= target ? 0 : current + 1;
          return {
            logs: {
              ...state.logs,
              [key]: nextValue,
            },
          };
        });
        const nextValue = get().logs[key] || 0;
        void syncIfEnabled(async () => {
          if (nextValue === 0) {
            await syncDeletedHabitLog(habitId, date, updatedAt);
            return;
          }
          await syncUpsertHabitLog({
            habitId,
            date,
            value: nextValue,
            updatedAt,
          });
        });
      },

      setTimeValue: (habitId, date, minutes) => {
        // Prevent completing habits for future dates
        const targetDate = new Date(date);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (targetDate > today) return;

        const key = `${habitId}_${date}`;
        const updatedAt = getNowIso();
        set((state) => ({
          logs: { ...state.logs, [key]: minutes },
        }));
        void syncIfEnabled(async () => {
          if (minutes <= 0) {
            await syncDeletedHabitLog(habitId, date, updatedAt);
            return;
          }
          await syncUpsertHabitLog({
            habitId,
            date,
            value: minutes,
            updatedAt,
          });
        });
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
      setViewMode: (mode) => set({ viewMode: mode }),

      getHabitLog: (habitId, date) => {
        return get().logs[`${habitId}_${date}`] || 0;
      },

      getCompletionForDate: (date) => {
        const state = get();
        const activeHabits = state.habits.filter((h) => !h.archived);
        let completed = 0;
        const total = activeHabits.length;

        activeHabits.forEach((habit) => {
          const key = `${habit.id}_${date}`;
          const value = state.logs[key] || 0;
          const target = habit.completionTargetEnabled ? habit.targetCount : 1;
          if (value >= target) completed++;
        });

        return { completed, total };
      },

      isHabitCompletedOnDate: (habitId, date) => {
        const state = get();
        const key = `${habitId}_${date}`;
        const habit = state.habits.find((h) => h.id === habitId);
        const target = habit?.completionTargetEnabled ? habit.targetCount : 1;
        return (state.logs[key] || 0) >= target;
      },

      getWeekProgress: (habitId, referenceDate) => {
        const state = get();
        const habit = state.habits.find((h) => h.id === habitId);
        if (!habit) return { completedDays: 0, totalDays: 7 };

        const baseDate = referenceDate ? new Date(referenceDate) : new Date();
        const weekDates = getWeekDates(baseDate);
        const target = habit.completionTargetEnabled ? habit.targetCount : 1;

        const completedDays = weekDates.reduce((count, date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const key = `${habitId}_${dateStr}`;
          return (state.logs[key] || 0) >= target ? count + 1 : count;
        }, 0);

        return { completedDays, totalDays: 7 };
      },

      exportLogs: () => {
        return Object.entries(get().logs).map(([key, value]) => {
          const [habitId, date] = key.split("_");
          return {
            habitId,
            date,
            value,
            updatedAt: getNowIso(),
          };
        });
      },

      applySnapshot: (snapshot) => {
        const logs = snapshot.logs.reduce<Record<string, number>>(
          (acc, log) => {
            if (!log.deletedAt) {
              acc[`${log.habitId}_${log.date}`] = log.value;
            }
            return acc;
          },
          {},
        );
        set({
          habits: snapshot.habits,
          logs,
        });
        void syncAllHabitReminderNotifications(
          snapshot.habits,
          useSettingsStore.getState().remindersEnabled,
        );
      },
    }),
    {
      name: "habit-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state) => {
          state?.setHasHydrated(true);
        };
      },
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
      }),
    },
  ),
);
