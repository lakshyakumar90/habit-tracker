import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user_id", ["userId"]),

  habits: defineTable({
    userId: v.string(),
    habitId: v.string(),
    name: v.string(),
    type: v.union(v.literal("check"), v.literal("time")),
    color: v.string(),
    icon: v.string(),
    category: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekly")),
    targetCount: v.number(),
    days: v.array(v.string()),
    reminders: v.array(
      v.object({
        id: v.string(),
        time: v.string(),
        enabled: v.boolean(),
      }),
    ),
    completionTargetEnabled: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    archived: v.boolean(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_habit", ["userId", "habitId"]),

  habitLogs: defineTable({
    userId: v.string(),
    habitId: v.string(),
    date: v.string(),
    value: v.number(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_habit_and_date", ["userId", "habitId", "date"]),

  taskLists: defineTable({
    userId: v.string(),
    taskListId: v.string(),
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_task_list", ["userId", "taskListId"]),

  tasks: defineTable({
    userId: v.string(),
    taskId: v.string(),
    listId: v.string(),
    title: v.string(),
    date: v.string(),
    completed: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    deletedAt: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_and_task", ["userId", "taskId"]),

  userSettings: defineTable({
    userId: v.string(),
    theme: v.union(
      v.literal("dark-green"),
      v.literal("neon-blue"),
      v.literal("ember"),
    ),
    remindersEnabled: v.boolean(),
    celebrationsEnabled: v.boolean(),
    soundEnabled: v.boolean(),
    confettiEnabled: v.boolean(),
    tickSoundEnabled: v.boolean(),
    celebrationSound: v.union(
      v.literal("sparkle"),
      v.literal("chime"),
      v.literal("pop"),
    ),
    celebrationVolume: v.number(),
    updatedAt: v.string(),
  }).index("by_user_id", ["userId"]),
});
