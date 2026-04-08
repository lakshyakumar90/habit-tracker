import { AppSettings, SyncSnapshot } from "@/types";
import { makeFunctionReference } from "convex/server";

export const syncFunctions = {
  getSnapshot: makeFunctionReference<"query", {}, SyncSnapshot>(
    "sync:getSnapshot",
  ),
  enableSync: makeFunctionReference<
    "mutation",
    { snapshot: SyncSnapshot },
    SyncSnapshot
  >("sync:enableSync"),
  disableSync: makeFunctionReference<"query", {}, SyncSnapshot>(
    "sync:disableSync",
  ),
  upsertHabit: makeFunctionReference<"mutation", { habit: unknown }>(
    "sync:upsertHabit",
  ),
  deleteHabit: makeFunctionReference<
    "mutation",
    { habitId: string; deletedAt: string }
  >("sync:deleteHabit"),
  upsertHabitLog: makeFunctionReference<"mutation", { log: unknown }>(
    "sync:upsertHabitLog",
  ),
  deleteHabitLog: makeFunctionReference<
    "mutation",
    { habitId: string; date: string; deletedAt: string }
  >("sync:deleteHabitLog"),
  upsertTaskList: makeFunctionReference<"mutation", { taskList: unknown }>(
    "sync:upsertTaskList",
  ),
  deleteTaskList: makeFunctionReference<
    "mutation",
    { taskListId: string; deletedAt: string }
  >("sync:deleteTaskList"),
  upsertTask: makeFunctionReference<"mutation", { task: unknown }>(
    "sync:upsertTask",
  ),
  deleteTask: makeFunctionReference<
    "mutation",
    { taskId: string; deletedAt: string }
  >("sync:deleteTask"),
  upsertSettings: makeFunctionReference<
    "mutation",
    { settings: Partial<AppSettings> }
  >("sync:upsertSettings"),
  upsertViewerProfile: makeFunctionReference<"mutation", {}, { ok: true }>(
    "sync:upsertViewerProfile",
  ),
};
