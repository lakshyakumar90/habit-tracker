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
  createdAt: string;
}

export interface Category {
  name: string;
  icon: string;
}

export interface AppSettings {
  theme: string;
  remindersEnabled: boolean;
  celebrationsEnabled: boolean;
  soundEnabled: boolean;
  confettiEnabled: boolean;
}