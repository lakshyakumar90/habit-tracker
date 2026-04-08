import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isSameDay,
  subDays,
  subMonths,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  isBefore,
  startOfDay,
} from "date-fns";

export const formatDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const formatDisplay = (date: Date): string => format(date, "do MMM");

export const getDayName = (date: Date): string => format(date, "EEE");

export const getWeekDates = (date: Date): Date[] => {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

export const getTodayString = (): string => formatDate(new Date());

export const getLast30Days = (): Date[] => {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
};

export const getLast5Months = (): { month: string; date: Date }[] => {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (4 - i), 1);
    return { month: format(d, "MMM"), date: d };
  });
};

export const getMonthDatesForHeatmap = (months: number) => {
  const today = new Date();
  const start = subMonths(today, months - 1);
  start.setDate(1);
  return eachDayOfInterval({ start, end: today });
};

export const isDateBefore = (d1: Date, d2: Date): boolean =>
  isBefore(startOfDay(d1), startOfDay(d2));

export const isDateToday = (date: Date): boolean => isToday(date);

export { format, isToday, getDay, isSameDay };