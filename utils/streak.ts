import { subDays, format } from "date-fns";

export interface StreakResult {
  current: number;
  best: number;
  totalCompletions: number;
  streakHistory: { start: string; end: string; days: number }[];
}

export const calculateStreak = (
  logs: Record<string, number>,
  habitId: string,
  targetCount: number = 1
): StreakResult => {
  const today = new Date();
  let current = 0;
  let totalCompletions = 0;
  const completedDates: string[] = [];

  // Collect all completed dates for this habit
  Object.entries(logs).forEach(([key, value]) => {
    if (key.startsWith(`${habitId}_`) && value >= targetCount) {
      const date = key.replace(`${habitId}_`, "");
      completedDates.push(date);
      totalCompletions++;
    }
  });

  completedDates.sort();

  // Current streak - count backward from today
  let checkDate = today;
  while (true) {
    const dateStr = format(checkDate, "yyyy-MM-dd");
    const key = `${habitId}_${dateStr}`;
    if ((logs[key] || 0) >= targetCount) {
      current++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  // Calculate best streak and streak history
  let best = 0;
  const streakHistory: { start: string; end: string; days: number }[] = [];

  if (completedDates.length > 0) {
    let tempStreak = 1;
    let streakStart = completedDates[0];

    for (let i = 1; i < completedDates.length; i++) {
      const prev = new Date(completedDates[i - 1]);
      const curr = new Date(completedDates[i]);
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak >= 2) {
          streakHistory.push({
            start: streakStart,
            end: completedDates[i - 1],
            days: tempStreak,
          });
        }
        best = Math.max(best, tempStreak);
        tempStreak = 1;
        streakStart = completedDates[i];
      }
    }

    if (tempStreak >= 2) {
      streakHistory.push({
        start: streakStart,
        end: completedDates[completedDates.length - 1],
        days: tempStreak,
      });
    }
    best = Math.max(best, tempStreak);
  }

  streakHistory.sort((a, b) => b.days - a.days);

  return { current, best, totalCompletions, streakHistory };
};