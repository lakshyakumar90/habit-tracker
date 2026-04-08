import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

const requireViewer = async (ctx: any) => {
  return await authComponent.getAuthUser(ctx);
};

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
    return await getSnapshotForUser(ctx, viewer._id);
  },
});

export const upsertViewerProfile = mutationGeneric({
  args: {},
  handler: async (ctx: any) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("userId", viewer._id))
      .unique();
    const payload = {
      userId: viewer._id,
      email: viewer.email,
      name: viewer.name,
      image: viewer.image ?? undefined,
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
    const userId = viewer._id;

    for (const habit of args.snapshot.habits ?? []) {
      const existing = await ctx.db
        .query("habits")
        .withIndex("by_user_and_habit", (q: any) =>
          q.eq("userId", userId).eq("habitId", habit.id),
        )
        .unique();
      const payload = {
        userId,
        habitId: habit.id,
        ...habit,
        deletedAt: undefined,
      };
      if (existing) {
        if (existing.updatedAt <= habit.updatedAt) {
          await ctx.db.patch(existing._id, payload);
        }
      } else {
        await ctx.db.insert("habits", payload);
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

    for (const taskList of args.snapshot.taskLists ?? []) {
      const existing = await ctx.db
        .query("taskLists")
        .withIndex("by_user_and_task_list", (q: any) =>
          q.eq("userId", userId).eq("taskListId", taskList.id),
        )
        .unique();
      const payload = {
        userId,
        taskListId: taskList.id,
        ...taskList,
      };
      if (existing) {
        if (existing.updatedAt <= taskList.updatedAt) {
          await ctx.db.patch(existing._id, payload);
        }
      } else {
        await ctx.db.insert("taskLists", payload);
      }
    }

    for (const task of args.snapshot.tasks ?? []) {
      const existing = await ctx.db
        .query("tasks")
        .withIndex("by_user_and_task", (q: any) =>
          q.eq("userId", userId).eq("taskId", task.id),
        )
        .unique();
      const payload = {
        userId,
        taskId: task.id,
        ...task,
      };
      if (existing) {
        if (existing.updatedAt <= task.updatedAt) {
          await ctx.db.patch(existing._id, payload);
        }
      } else {
        await ctx.db.insert("tasks", payload);
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
    const existing = await ctx.db
      .query("habits")
      .withIndex("by_user_and_habit", (q: any) =>
        q.eq("userId", viewer._id).eq("habitId", args.habit.id),
      )
      .unique();
    const payload = {
      userId: viewer._id,
      habitId: args.habit.id,
      ...args.habit,
      deletedAt: undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("habits", payload);
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
        q.eq("userId", viewer._id).eq("habitId", args.habitId),
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
          .eq("userId", viewer._id)
          .eq("habitId", args.log.habitId)
          .eq("date", args.log.date),
      )
      .unique();
    const payload = {
      userId: viewer._id,
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
          .eq("userId", viewer._id)
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
    const existing = await ctx.db
      .query("taskLists")
      .withIndex("by_user_and_task_list", (q: any) =>
        q.eq("userId", viewer._id).eq("taskListId", args.taskList.id),
      )
      .unique();
    const payload = {
      userId: viewer._id,
      taskListId: args.taskList.id,
      ...args.taskList,
      deletedAt: undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("taskLists", payload);
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
        q.eq("userId", viewer._id).eq("taskListId", args.taskListId),
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
    const existing = await ctx.db
      .query("tasks")
      .withIndex("by_user_and_task", (q: any) =>
        q.eq("userId", viewer._id).eq("taskId", args.task.id),
      )
      .unique();
    const payload = {
      userId: viewer._id,
      taskId: args.task.id,
      ...args.task,
      deletedAt: undefined,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("tasks", payload);
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
        q.eq("userId", viewer._id).eq("taskId", args.taskId),
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
      .withIndex("by_user_id", (q: any) => q.eq("userId", viewer._id))
      .unique();
    const payload = {
      userId: viewer._id,
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
    return await getSnapshotForUser(ctx, viewer._id);
  },
});
