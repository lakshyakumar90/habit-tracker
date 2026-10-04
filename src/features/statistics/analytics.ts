import type { Habit, HabitEntry } from '../habits/types';
import { isScheduledOn } from '../habits/domain';
import { addDays, dateKey } from '../../utils/dates';

export type RangeKey = '7 Days' | '30 Days' | '3 Months' | '1 Year';
export const RANGE_OPTIONS: RangeKey[] = ['7 Days', '30 Days', '3 Months', '1 Year'];
export const rangeStart = (range: RangeKey, end = new Date()) => {
  const start = new Date(end);
  if (range === '7 Days') start.setDate(start.getDate() - 6);
  else if (range === '30 Days') start.setDate(start.getDate() - 29);
  else if (range === '3 Months') start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  start.setHours(12, 0, 0, 0);
  return start;
};

export function summarizeHabit(habit: Habit, entries: HabitEntry[], range: RangeKey) {
  const end = new Date(); end.setHours(12, 0, 0, 0);
  const start = rangeStart(range, end);
  const own = entries.filter(entry => entry.habitId === habit.id);
  const completed = new Set(own.filter(entry => entry.completed).map(entry => entry.date));
  let scheduled = 0; let done = 0;
  for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
    if (day < new Date(`${habit.createdAt.slice(0, 10)}T12:00:00`) || !isScheduledOn(habit, day)) continue;
    scheduled++;
    if (completed.has(dateKey(day))) done++;
  }
  const relevant = own.filter(entry => entry.date >= dateKey(start) && entry.date <= dateKey(end));
  const quantity = relevant.filter(entry => entry.completed).reduce((sum, entry) => sum + entry.value, 0);
  const buckets = Math.min(7, range === '7 Days' ? 7 : range === '30 Days' ? 6 : 6);
  const trend = Array.from({ length: buckets }, (_, index) => {
    const from = new Date(start); const to = new Date(start);
    const span = Math.ceil((end.getTime() - start.getTime() + 86400000) / buckets);
    from.setTime(start.getTime() + index * span); to.setTime(Math.min(end.getTime(), start.getTime() + (index + 1) * span - 86400000));
    let due = 0; let hits = 0; let duration = 0;
    for (let day = new Date(from); day <= to; day = addDays(day, 1)) {
      if (day < new Date(`${habit.createdAt.slice(0, 10)}T12:00:00`) || !isScheduledOn(habit, day)) continue;
      due++;
      if (completed.has(dateKey(day))) hits++;
      duration += own.find(entry => entry.date === dateKey(day) && entry.completed)?.value ?? 0;
    }
    return { label: from.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: due ? Math.round(hits / due * 100) : 0, duration };
  });
  return { scheduled, done, rate: scheduled ? Math.round(done / scheduled * 100) : 0, totalTime: habit.type === 'duration' ? quantity : 0, trend, entries: relevant };
}

export function summarizeOverall(habits: Habit[], entries: HabitEntry[], start: Date, end = new Date()) {
  const completedSet = new Set(entries.filter(entry => entry.completed).map(entry => `${entry.habitId}:${entry.date}`));
  let scheduled = 0; let done = 0;
  for (let day = new Date(start); day <= end; day = addDays(day, 1)) for (const habit of habits) {
    if (habit.archived || day < new Date(`${habit.createdAt.slice(0, 10)}T12:00:00`) || !isScheduledOn(habit, day)) continue;
    scheduled++; if (completedSet.has(`${habit.id}:${dateKey(day)}`)) done++;
  }
  return { scheduled, done, rate: scheduled ? Math.round(done / scheduled * 100) : 0 };
}
