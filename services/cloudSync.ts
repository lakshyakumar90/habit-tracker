import { AppSettings, Habit, HabitLogEntry, Task, TaskList } from "@/types";
import * as WebBrowser from "expo-web-browser";
import { convex } from "./convex";
import { syncFunctions } from "./convexFunctions";

// Complete auth session if OAuth redirect occurs
WebBrowser.maybeCompleteAuthSession();

// ─── Habits ───────────────────────────────────────────────────────────────────

export const syncUpsertHabit = (habit: Habit) =>
  convex.mutation(syncFunctions.upsertHabit, { habit });

export const syncDeletedHabit = (habitId: string, deletedAt: string) =>
  convex.mutation(syncFunctions.deleteHabit, { habitId, deletedAt });

// ─── Habit Logs ───────────────────────────────────────────────────────────────

export const syncUpsertHabitLog = (log: HabitLogEntry) =>
  convex.mutation(syncFunctions.upsertHabitLog, { log });

export const syncDeletedHabitLog = (
  habitId: string,
  date: string,
  deletedAt: string,
) =>
  convex.mutation(syncFunctions.deleteHabitLog, { habitId, date, deletedAt });

// ─── Task Lists ───────────────────────────────────────────────────────────────

export const syncUpsertTaskList = (taskList: TaskList) =>
  convex.mutation(syncFunctions.upsertTaskList, { taskList });

export const syncDeletedTaskList = (taskListId: string, deletedAt: string) =>
  convex.mutation(syncFunctions.deleteTaskList, { taskListId, deletedAt });

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const syncUpsertTask = (task: Task) =>
  convex.mutation(syncFunctions.upsertTask, { task });

export const syncDeletedTask = (taskId: string, deletedAt: string) =>
  convex.mutation(syncFunctions.deleteTask, { taskId, deletedAt });

// ─── Settings ─────────────────────────────────────────────────────────────────

export const syncUpsertSettings = (settings: Partial<AppSettings>) =>
  convex.mutation(syncFunctions.upsertSettings, { settings });