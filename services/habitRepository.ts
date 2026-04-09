import { useHabitStore } from "@/store/useHabitStore";
import { Habit } from "@/types";

export const habitRepository = {
  addHabit: (
    habit: Omit<Habit, "id" | "createdAt" | "updatedAt" | "archived">,
  ) => useHabitStore.getState().addHabit(habit),
  updateHabit: (habitId: string, updates: Partial<Habit>) =>
    useHabitStore.getState().updateHabit(habitId, updates),
  toggleHabit: (habitId: string, date: string) =>
    useHabitStore.getState().toggleHabit(habitId, date),
  setTimeValue: (habitId: string, date: string, minutes: number) =>
    useHabitStore.getState().setTimeValue(habitId, date, minutes),
  deleteHabit: (habitId: string) =>
    useHabitStore.getState().deleteHabit(habitId),
  archiveHabit: (habitId: string) =>
    useHabitStore.getState().archiveHabit(habitId),
  unarchiveHabit: (habitId: string) =>
    useHabitStore.getState().unarchiveHabit(habitId),
};
