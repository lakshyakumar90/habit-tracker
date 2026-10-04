export type HabitType = 'boolean' | 'quantity' | 'duration' | 'counter';
export type HabitDifficulty = 'easy' | 'medium' | 'hard';

export type Habit = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  type: HabitType;
  difficulty?: HabitDifficulty;
  target: number;
  unit: string;
  schedule: number[];
  reminderAt?: string | null;
  notificationIds?: string[];
  archived: boolean;
  createdAt: string;
};

export type HabitEntry = { id: string; habitId: string; date: string; value: number; completed: boolean };
export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'archived'>;
