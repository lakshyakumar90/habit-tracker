import { AppSettings, Habit, HabitLogEntry, Task, TaskList } from "@/types";
import { convex } from "./convex";
import { syncFunctions } from "./convexFunctions";

export const syncUpsertHabit = async (habit: Habit) => {
  await convex.mutation(syncFunctions.upsertHabit, { habit });
};

export const syncDeletedHabit = async (habitId: string, deletedAt: string) => {
  await convex.mutation(syncFunctions.deleteHabit, { habitId, deletedAt });
};

export const syncUpsertHabitLog = async (log: HabitLogEntry) => {
  await convex.mutation(syncFunctions.upsertHabitLog, { log });
};

export const syncDeletedHabitLog = async (
  habitId: string,
  date: string,
  deletedAt: string,
) => {
  await convex.mutation(syncFunctions.deleteHabitLog, {
    habitId,
    date,
    deletedAt,
  });
};

export const syncUpsertTaskList = async (taskList: TaskList) => {
  await convex.mutation(syncFunctions.upsertTaskList, { taskList });
};

export const syncDeletedTaskList = async (
  taskListId: string,
  deletedAt: string,
) => {
  await convex.mutation(syncFunctions.deleteTaskList, { taskListId, deletedAt });
};

export const syncUpsertTask = async (task: Task) => {
  await convex.mutation(syncFunctions.upsertTask, { task });
};

export const syncDeletedTask = async (taskId: string, deletedAt: string) => {
  await convex.mutation(syncFunctions.deleteTask, { taskId, deletedAt });
};

export const syncUpsertSettings = async (settings: Partial<AppSettings>) => {
  await convex.mutation(syncFunctions.upsertSettings, { settings });
};
