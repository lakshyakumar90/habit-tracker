import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

// ✅ Helper — throws if not authenticated (for mutations that REQUIRE auth)
async function requireViewer(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

const createFallbackId = () =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeHabitForStorage = (habit: any, userId: string) => {
  const habitId = String(habit?.habitId ?? habit?.id ?? "").trim();

  return {
    userId,
    habitId,
    name: String(habit?.name ?? ""),
    type: habit?.type === "time" ? "time" : "check",
    color: String(habit?.color ?? "#22C55E"),
    icon: String(habit?.icon ?? "checkmark-circle"),
    category: String(habit?.category ?? "General"),
    frequency: habit?.frequency === "weekly" ? "weekly" : "daily",
    targetCount: typeof habit?.targetCount === "number" ? habit.targetCount : 1,
    days: Array.isArray(habit?.days)
      ? habit.days.map((day: any) => String(day))
      : [],
    reminders: Array.isArray(habit?.reminders)
      ? habit.reminders.map((reminder: any) => ({
          id: String(reminder?.id ?? createFallbackId()),
          time: String(reminder?.time ?? "09:00"),
          enabled: reminder?.enabled !== false,
        }))
      : [],
    completionTargetEnabled: Boolean(habit?.completionTargetEnabled),
    createdAt: String(habit?.createdAt ?? new Date().toISOString()),
    updatedAt: String(habit?.updatedAt ?? new Date().toISOString()),
    archived: Boolean(habit?.archived),
    ...(habit?.deletedAt ? { deletedAt: String(habit.deletedAt) } : {}),
  };
};

const normalizeTaskListForStorage = (taskList: any, userId: string) => ({
  userId,
  taskListId: String(taskList?.taskListId ?? taskList?.id ?? "").trim(),
  name: String(taskList?.name ?? ""),
  createdAt: String(taskList?.createdAt ?? new Date().toISOString()),
  updatedAt: String(taskList?.updatedAt ?? new Date().toISOString()),
  ...(taskList?.deletedAt ? { deletedAt: String(taskList.deletedAt) } : {}),
});

const normalizeTaskForStorage = (task: any, userId: string) => ({
  userId,
  taskId: String(task?.taskId ?? task?.id ?? "").trim(),
  listId: String(task?.listId ?? ""),
  title: String(task?.title ?? ""),
  date: String(task?.date ?? ""),
  completed: Boolean(task?.completed),
  createdAt: String(task?.createdAt ?? new Date().toISOString()),
  updatedAt: String(task?.updatedAt ?? new Date().toISOString()),
  ...(task?.deletedAt ? { deletedAt: String(task.deletedAt) } : {}),
});

const getSnapshotForUser = async (ctx: any, userId: string) => {
  const [habits, logs, taskLists, tasks, settings] = await Promise.all([
    ctx.db
      .query("habits")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("habitLogs")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("taskLists")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("tasks")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .unique(),
  ]);

  return {
    habits: habits
      .filter((habit: any) => !habit.deletedAt)
      .map((habit: any) => ({
        id: habit.habitId,
        name: habit.name,
        type: habit.type,
        color: habit.color,
        icon: habit.icon,
        category: habit.category,
        frequency: habit.frequency,
        targetCount: habit.targetCount,
        days: habit.days,
        reminders: habit.reminders,
        completionTargetEnabled: habit.completionTargetEnabled,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        archived: habit.archived,
      })),
    logs: logs.map((log: any) => ({
      habitId: log.habitId,
      date: log.date,
      value: log.value,
      updatedAt: log.updatedAt,
      deletedAt: log.deletedAt,
    })),
    taskLists: taskLists.map((taskList: any) => ({
      id: taskList.taskListId,
      name: taskList.name,
      createdAt: taskList.createdAt,
      updatedAt: taskList.updatedAt,
      deletedAt: taskList.deletedAt,
    })),
    tasks: tasks.map((task: any) => ({
      id: task.taskId,
      title: task.title,
      date: task.date,
      completed: task.completed,
      listId: task.listId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      deletedAt: task.deletedAt,
    })),
    settings: settings
      ? {
          theme: settings.theme,
          remindersEnabled: settings.remindersEnabled,
          celebrationsEnabled: settings.celebrationsEnabled,
          soundEnabled: settings.soundEnabled,
          confettiEnabled: settings.confettiEnabled,
          tickSoundEnabled: settings.tickSoundEnabled,
          tickSound: settings.tickSound ?? "tick",
          celebrationSound: settings.celebrationSound,
          celebrationVolume: settings.celebrationVolume,
        }
      : {},
    syncedAt: new Date().toISOString(),
  };
};

export const getSnapshot = queryGeneric({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireViewer(ctx);
    return await getSnapshotForUser(ctx, viewer.tokenIdentifier);
  },
});

export const debugAuth = queryGeneric({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { authenticated: false, reason: "getUserIdentity returned null" };
    }

    return {
      authenticated: true,
      subject: identity.subject,
      issuer: identity.issuer,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

export const testAuth = queryGeneric({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();

    console.log("=== AUTH DEBUG ===");
    console.log("identity:", identity);
    console.log("==================");

    if (!identity) {
      return {
        status: "NOT_AUTHENTICATED",
        hint: "Check auth.config.ts domain matches JWT iss claim",
      };
    }

    return {
      status: "AUTHENTICATED",
      subject: identity.subject,
      issuer: identity.issuer,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

export const upsertViewerProfile = mutationGeneric({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier),
      )
      .unique();
    const payload = {
      userId: viewer.tokenIdentifier,
      email: viewer.email,
      name: viewer.name,
      image: viewer.pictureUrl ?? undefined,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("users", {
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  },
});

export const enableSync = mutationGeneric({
  args: {
    snapshot: v.any(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const userId = viewer.tokenIdentifier;

    for (const rawHabit of args.snapshot.habits ?? []) {
      const habit = normalizeHabitForStorage(rawHabit, userId);
      if (!habit.habitId) continue;

      const existing = await ctx.db
        .query("habits")
        .withIndex("by_user_and_habit", (q: any) =>
          q.eq("userId", userId).eq("habitId", habit.habitId),
        )
        .unique();

      if (existing) {
        if (existing.updatedAt <= habit.updatedAt) {
          await ctx.db.patch(existing._id, habit);
        }
      } else {
        await ctx.db.insert("habits", habit);
      }
    }

    for (const log of args.snapshot.logs ?? []) {
      const existing = await ctx.db
        .query("habitLogs")
        .withIndex("by_user_habit_and_date", (q: any) =>
          q
            .eq("userId", userId)
            .eq("habitId", log.habitId)
            .eq("date", log.date),
        )
        .unique();
      const payload = { userId, ...log };
      if (existing) {
        if (existing.updatedAt <= log.updatedAt) {
          await ctx.db.patch(existing._id, payload);
        }
      } else {
        await ctx.db.insert("habitLogs", payload);
      }
    }

    for (const rawTaskList of args.snapshot.taskLists ?? []) {
      const taskList = normalizeTaskListForStorage(rawTaskList, userId);
      if (!taskList.taskListId) continue;

      const existing = await ctx.db
        .query("taskLists")
        .withIndex("by_user_and_task_list", (q: any) =>
          q.eq("userId", userId).eq("taskListId", taskList.taskListId),
        )
        .unique();

      if (existing) {
        if (existing.updatedAt <= taskList.updatedAt) {
          await ctx.db.patch(existing._id, taskList);
        }
      } else {
        await ctx.db.insert("taskLists", taskList);
      }
    }

    for (const rawTask of args.snapshot.tasks ?? []) {
      const task = normalizeTaskForStorage(rawTask, userId);
      if (!task.taskId) continue;

      const existing = await ctx.db
        .query("tasks")
        .withIndex("by_user_and_task", (q: any) =>
          q.eq("userId", userId).eq("taskId", task.taskId),
        )
        .unique();

      if (existing) {
        if (existing.updatedAt <= task.updatedAt) {
          await ctx.db.patch(existing._id, task);
        }
      } else {
        await ctx.db.insert("tasks", task);
      }
    }

    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
      .unique();
    const defaultSettings = {
      theme: "dark-green",
      remindersEnabled: false,
      celebrationsEnabled: true,
      soundEnabled: true,
      confettiEnabled: true,
      tickSoundEnabled: true,
      tickSound: "tick",
      celebrationSound: "sparkle",
      celebrationVolume: 0.7,
    };
    const settingsPayload = {
      userId,
      ...defaultSettings,
      ...args.snapshot.settings,
      updatedAt: args.snapshot.syncedAt ?? new Date().toISOString(),
    };
    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, settingsPayload);
    } else {
      await ctx.db.insert("userSettings", settingsPayload);
    }

    return await getSnapshotForUser(ctx, userId);
  },
});

export const upsertHabit = mutationGeneric({
  args: { habit: v.any() },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const habit = normalizeHabitForStorage(args.habit, viewer.tokenIdentifier);
    if (!habit.habitId) {
      throw new Error("Habit id is required for sync");
    }

    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_and_habit", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier).eq("habitId", habit.habitId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, habit);
      return existing._id;
    }
    return await ctx.db.insert("habits", habit);
  },
});

export const deleteHabit = mutationGeneric({
  args: {
    habitId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_and_habit", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier).eq("habitId", args.habitId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: args.deletedAt,
        updatedAt: args.deletedAt,
      });
    }
  },
});

export const upsertHabitLog = mutationGeneric({
  args: { log: v.any() },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_habit_and_date", (q: any) =>
        q
          .eq("userId", viewer.tokenIdentifier)
          .eq("habitId", args.log.habitId)
          .eq("date", args.log.date),
      )
      .unique();
    const payload = {
      userId: viewer.tokenIdentifier,
      ...args.log,
      deletedAt: undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("habitLogs", payload);
  },
});

export const deleteHabitLog = mutationGeneric({
  args: {
    habitId: v.string(),
    date: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_user_habit_and_date", (q: any) =>
        q
          .eq("userId", viewer.tokenIdentifier)
          .eq("habitId", args.habitId)
          .eq("date", args.date),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: args.deletedAt,
        updatedAt: args.deletedAt,
      });
    }
  },
});

export const upsertTaskList = mutationGeneric({
  args: { taskList: v.any() },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const taskList = normalizeTaskListForStorage(
      args.taskList,
      viewer.tokenIdentifier,
    );
    if (!taskList.taskListId) {
      throw new Error("Task list id is required for sync");
    }

    const existing = await ctx.db
      .query("taskLists")
      .withIndex("by_user_and_task_list", (q: any) =>
        q
          .eq("userId", viewer.tokenIdentifier)
          .eq("taskListId", taskList.taskListId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, taskList);
      return existing._id;
    }
    return await ctx.db.insert("taskLists", taskList);
  },
});

export const deleteTaskList = mutationGeneric({
  args: {
    taskListId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("taskLists")
      .withIndex("by_user_and_task_list", (q: any) =>
        q
          .eq("userId", viewer.tokenIdentifier)
          .eq("taskListId", args.taskListId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: args.deletedAt,
        updatedAt: args.deletedAt,
      });
    }
  },
});

export const upsertTask = mutationGeneric({
  args: { task: v.any() },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const task = normalizeTaskForStorage(args.task, viewer.tokenIdentifier);
    if (!task.taskId) {
      throw new Error("Task id is required for sync");
    }

    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_task", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier).eq("taskId", task.taskId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, task);
      return existing._id;
    }
    return await ctx.db.insert("tasks", task);
  },
});

export const deleteTask = mutationGeneric({
  args: {
    taskId: v.string(),
    deletedAt: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_task", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier).eq("taskId", args.taskId),
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: args.deletedAt,
        updatedAt: args.deletedAt,
      });
    }
  },
});

export const upsertSettings = mutationGeneric({
  args: { settings: v.any() },
  handler: async (ctx: any, args: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user_id", (q: any) =>
        q.eq("userId", viewer.tokenIdentifier),
      )
      .unique();
    const payload = {
      userId: viewer.tokenIdentifier,
      ...args.settings,
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("userSettings", payload);
  },
});

export const disableSync = queryGeneric({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireViewer(ctx);
    return await getSnapshotForUser(ctx, viewer.tokenIdentifier);
  },
});
