import { Habit, ViewMode } from "@/types";
import { getTodayString } from "@/utils/dates";
import { generateId } from "@/utils/helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface HabitState {
  habits: Habit[];
  logs: Record<string, number>;
  selectedDate: string;
  viewMode: ViewMode;
  _hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "archived">) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  setTimeValue: (habitId: string, date: string, minutes: number) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  getHabitLog: (habitId: string, date: string) => number;
  getCompletionForDate: (date: string) => { completed: number; total: number };
  isHabitCompletedOnDate: (habitId: string, date: string) => boolean;
}

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
        const habit: Habit = {
          ...habitData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          archived: false,
        };
        set((state) => ({ habits: [...state.habits, habit] }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h,
          ),
        }));
      },

      deleteHabit: (id) => {
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
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, archived: true } : h,
          ),
        }));
      },

      toggleHabit: (habitId, date) => {
        // Prevent completing habits for future dates
        const targetDate = new Date(date);
        const today = new Date();
        targetDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (targetDate > today) return;

        const key = `${habitId}_${date}`;
        set((state) => {
          const current = state.logs[key] || 0;
          const habit = state.habits.find((h) => h.id === habitId);
          const target = habit?.completionTargetEnabled ? habit.targetCount : 1;
          return {
            logs: {
              ...state.logs,
              [key]: current >= target ? 0 : current + 1,
            },
          };
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
        set((state) => ({
          logs: { ...state.logs, [key]: minutes },
        }));
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
