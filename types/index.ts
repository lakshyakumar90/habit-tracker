export type HabitType = "check" | "time";
export type FrequencyType = "daily" | "weekly";
export type ViewMode = "time" | "tick" | "weekly" | "tasks";

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  color: string;
  icon: string;
  category: string;
  frequency: FrequencyType;
  targetCount: number;
  days: string[];
  reminders: Reminder[];
  completionTargetEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface Reminder {
  id: string;
  time: string;
  enabled: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  listId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface TaskList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Category {
  name: string;
  icon: string;
}

export interface AppSettings {
  theme: "dark-green" | "neon-blue" | "ember";
  remindersEnabled: boolean;
  celebrationsEnabled: boolean;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  tickSoundEnabled: boolean;
  celebrationSound: "sparkle" | "chime" | "pop";
  celebrationVolume: number;
  cloudSyncEnabled: boolean;
  cloudSyncStatus: "local" | "migrating" | "cloud" | "error";
  hasSeenSyncPrompt: boolean;
  authUserSummary?: {
    name?: string;
    email?: string;
    image?: string | null;
  };
  lastSyncAt?: string;
  lastSyncError?: string;
}

export interface HabitLogEntry {
  habitId: string;
  date: string;
  value: number;
  updatedAt: string;
  deletedAt?: string;
}

export interface SyncSnapshot {
  habits: Habit[];
  logs: HabitLogEntry[];
  taskLists: TaskList[];
  tasks: Task[];
  settings: Partial<AppSettings>;
  syncedAt: string;
}
