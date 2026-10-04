export type HabitType = 'boolean' | 'quantity' | 'duration' | 'counter';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  target: number;
  unit: string;
  schedule: number[];
  archived: boolean;
  createdAt: string;
};

export type HabitEntry = { id: string; habitId: string; date: string; value: number; completed: boolean };
export type HabitDraft = Omit<Habit, 'id' | 'createdAt' | 'archived'>;
