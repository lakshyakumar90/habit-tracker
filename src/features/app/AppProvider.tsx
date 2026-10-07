import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { habitsRepository, preferencesRepository, tasksRepository } from '../../database/repositories';
import type { Habit, HabitDraft, HabitEntry } from '../habits/types';
import type { Task, TaskDraft, TaskSubtask } from '../tasks/types';
import { dateKey } from '../../utils/dates';
import { setPaletteAccent, setPaletteMode } from '../../theme/tokens';
import { cancelEntityReminders, scheduleHabitReminders, scheduleTaskNotifications } from '../../services/notifications';
import type { OnboardingDraft } from '../onboarding/types';

type AppData = {
  ready: boolean;
  habits: Habit[];
  entries: HabitEntry[];
  tasks: Task[];
  profileName: string;
  theme: string;
  resolvedTheme: 'light' | 'dark';
  accent: string;
  onboardingComplete: boolean;
  onboardingDraft: OnboardingDraft;
  reload: () => Promise<void>;
  saveHabit: (draft: HabitDraft, id?: string) => Promise<string | null>;
  setEntry: (habit: Habit, value: number, date?: string, completed?: boolean) => Promise<void>;
  archiveHabit: (id: string, archived: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addTask: (draft: TaskDraft) => Promise<{ id: string; reminderError: string | null }>;
  toggleTask: (task: Task) => Promise<void>;
  setTaskSubtasks: (id: string, subtasks: TaskSubtask[]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setPreference: (key: string, value: string) => Promise<void>;
};

type AppActions = Pick<AppData, 'reload' | 'saveHabit' | 'setEntry' | 'archiveHabit' | 'deleteHabit' | 'addTask' | 'toggleTask' | 'setTaskSubtasks' | 'deleteTask' | 'setPreference'>;
type ThemeData = Pick<AppData, 'theme' | 'resolvedTheme' | 'accent'>;
type ProfileData = Pick<AppData, 'profileName' | 'onboardingComplete' | 'onboardingDraft'>;
type AppStatus = Pick<AppData, 'ready'>;
const ActionsContext = createContext<AppActions | null>(null);
const HabitsContext = createContext<Habit[] | null>(null);
const EntriesContext = createContext<HabitEntry[] | null>(null);
const TasksContext = createContext<Task[] | null>(null);
const ThemeContext = createContext<ThemeData | null>(null);
const ProfileContext = createContext<ProfileData | null>(null);
const StatusContext = createContext<AppStatus | null>(null);
const orderTasks = (items: Task[]) => items.slice().sort((left, right) => left.dueDate.localeCompare(right.dueDate)
  || Number(left.completed) - Number(right.completed)
  || left.createdAt.localeCompare(right.createdAt));

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profileName, setProfileName] = useState('Friend');
  const [theme, setTheme] = useState('system');
  const [accent, setAccent] = useState('#6750C7');
  const [onboardingComplete, setOnboarding] = useState(false);
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingDraft>({ ageRange: '', interests: [], discoverySource: '', motivation: '' });
  const preferenceWriteVersion = useRef<Record<string, number>>({});

  const reload = useCallback(async () => {
    const [loadedHabits, loadedEntries, loadedTasks, name, savedTheme, savedAccent, complete, age, interests, source, motivation] = await Promise.all([
      habitsRepository.all(),
      habitsRepository.entries(),
      tasksRepository.all(),
      preferencesRepository.get('profileName', 'Friend'),
      preferencesRepository.get('theme', 'system'),
      preferencesRepository.get('accent', '#6750C7'),
      preferencesRepository.get('onboardingComplete', 'false'),
      preferencesRepository.get('onboardingAgeRange', ''),
      preferencesRepository.get('onboardingInterests', '[]'),
      preferencesRepository.get('onboardingDiscovery', ''),
      preferencesRepository.get('onboardingMotivation', ''),
    ]);
    let savedInterests: string[] = [];
    try {
      const parsed: unknown = JSON.parse(interests);
      if (Array.isArray(parsed)) savedInterests = parsed.filter((item): item is string => typeof item === 'string');
    } catch { /* Ignore malformed optional onboarding data. */ }

    setHabits(loadedHabits);
    setEntries(loadedEntries);
    setTasks(loadedTasks);
    setProfileName(name);
    setTheme(savedTheme);
    setAccent(savedAccent);
    setOnboarding(complete === 'true');
    setOnboardingDraft({ ageRange: age, interests: savedInterests, discoverySource: source, motivation });
    setReady(true);
  }, []);

  const resolvedTheme = theme === 'dark' || (theme === 'system' && systemScheme === 'dark') ? 'dark' : 'light';
  // These tokens are a shared theme source for existing screens. Set them before
  // descendants render so a theme selection updates the whole visible stack at once.
  setPaletteMode(resolvedTheme);
  setPaletteAccent(accent);

  useEffect(() => {
    const handle = setTimeout(() => void reload(), 0);
    return () => clearTimeout(handle);
  }, [reload]);

  const saveHabit = useCallback(async (draft: HabitDraft, id?: string) => {
    if (id) await cancelEntityReminders(id);
    const saved = await habitsRepository.save(draft, id);
    let reminderError: string | null = null;
    const remindersEnabled = await preferencesRepository.get('habitRemindersEnabled', 'true');
    let notificationIds: string[] = [];
    if (draft.reminderAt && !saved.archived && remindersEnabled !== 'false') {
      try {
        notificationIds = await scheduleHabitReminders(saved.id, saved.name, saved.schedule, draft.reminderAt);
      } catch (error) {
        reminderError = error instanceof Error ? error.message : 'The reminder could not be scheduled.';
      }
    }
    await habitsRepository.setNotificationIds(saved.id, notificationIds);
    const nextHabit = { ...saved, notificationIds };
    setHabits(current => current.filter(habit => habit.id !== saved.id).concat(nextHabit)
      .sort((left, right) => Number(left.archived) - Number(right.archived) || left.createdAt.localeCompare(right.createdAt)));
    return reminderError;
  }, []);

  const setEntry = useCallback(async (habit: Habit, value: number, date = dateKey(), completed?: boolean) => {
    const isCompleted = completed ?? value >= habit.target;
    const saved = await habitsRepository.setEntry(habit.id, date, habit.type === 'boolean' ? (isCompleted ? 1 : 0) : value, isCompleted);
    setEntries(current => current.filter(entry => entry.habitId !== habit.id || entry.date !== date).concat(saved));
  }, []);

  const archiveHabit = useCallback(async (id: string, archived: boolean) => {
    const habit = habits.find(item => item.id === id);
    await habitsRepository.archive(id, archived);
    setHabits(current => current.map(item => item.id === id ? { ...item, archived, notificationIds: archived ? [] : item.notificationIds } : item));
    let notificationIds: string[] = [];
    if (archived) {
      try { await cancelEntityReminders(id); } catch { /* The archived habit stays saved if OS cleanup fails. */ }
    } else if (habit?.reminderAt && await preferencesRepository.get('habitRemindersEnabled', 'true') !== 'false') {
      try { notificationIds = await scheduleHabitReminders(id, habit.name, habit.schedule, habit.reminderAt); } catch { /* Keep the restored habit usable when reminders are unavailable. */ }
    }
    await habitsRepository.setNotificationIds(id, notificationIds);
    setHabits(current => current.map(item => item.id === id ? { ...item, archived, notificationIds } : item));
  }, [habits]);

  const deleteHabit = useCallback(async (id: string) => {
    await habitsRepository.remove(id);
    setHabits(current => current.filter(habit => habit.id !== id));
    setEntries(current => current.filter(entry => entry.habitId !== id));
    try { await cancelEntityReminders(id); } catch { /* Deletion should not wait on operating system notification cleanup. */ }
  }, []);

  const addTask = useCallback(async (draft: TaskDraft) => {
    const id = await tasksRepository.save(draft);
    let reminderError: string | null = null;
    try {
      const notificationIds = await scheduleTaskNotifications(id, draft.title, draft);
      await tasksRepository.setNotificationIds(id, notificationIds);
    } catch (error) {
      await tasksRepository.setNotificationIds(id, []);
      reminderError = error instanceof Error ? error.message : 'The reminder could not be scheduled.';
    }
    const saved = await tasksRepository.get(id);
    if (saved) setTasks(current => orderTasks(current.filter(task => task.id !== id).concat(saved)));
    return { id, reminderError };
  }, []);

  const toggleTask = useCallback(async (task: Task) => {
    await tasksRepository.toggle(task);
    const updated = await tasksRepository.get(task.id);
    if (updated) setTasks(current => orderTasks(current.map(item => item.id === task.id ? updated : item)));

    if (!task.completed) {
      if (task.repeatRule === 'none') {
        try { await cancelEntityReminders(task.id); } catch { /* Completion is already saved; ignore OS cleanup errors. */ }
      }
    } else if (task.reminders.length) {
      try {
        const notificationIds = await scheduleTaskNotifications(task.id, task.title, task);
        await tasksRepository.setNotificationIds(task.id, notificationIds);
      } catch {
        await tasksRepository.setNotificationIds(task.id, []);
      }
    }
  }, []);

  const setTaskSubtasks = useCallback(async (id: string, subtasks: TaskSubtask[]) => {
    await tasksRepository.setSubtasks(id, subtasks);
    setTasks(current => current.map(task => task.id === id ? { ...task, subtasks } : task));
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await tasksRepository.remove(id);
    setTasks(current => current.filter(task => task.id !== id));
    try { await cancelEntityReminders(id); } catch { /* Deletion should not wait on operating system notification cleanup. */ }
  }, []);

  const setPreference = useCallback(async (key: string, value: string) => {
    const version = (preferenceWriteVersion.current[key] ?? 0) + 1;
    preferenceWriteVersion.current[key] = version;
    if (key === 'theme') setTheme(value);
    if (key === 'accent') setAccent(value);
    if (key === 'profileName') setProfileName(value);
    if (key === 'onboardingComplete') setOnboarding(value === 'true');
    if (key === 'onboardingAgeRange') setOnboardingDraft(current => ({ ...current, ageRange: value }));
    if (key === 'onboardingInterests') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) setOnboardingDraft(current => ({ ...current, interests: parsed.filter((item): item is string => typeof item === 'string') }));
      } catch { /* Ignore malformed optional onboarding data. */ }
    }
    if (key === 'onboardingDiscovery') setOnboardingDraft(current => ({ ...current, discoverySource: value }));
    if (key === 'onboardingMotivation') setOnboardingDraft(current => ({ ...current, motivation: value }));

    try {
      await preferencesRepository.set(key, value);
    } catch (error) {
      if (preferenceWriteVersion.current[key] === version) {
        if (key === 'theme') setTheme(theme);
        if (key === 'accent') setAccent(accent);
        if (key === 'profileName') setProfileName(profileName);
        if (key === 'onboardingComplete') setOnboarding(onboardingComplete);
        if (key === 'onboardingAgeRange') setOnboardingDraft(current => ({ ...current, ageRange: onboardingDraft.ageRange }));
        if (key === 'onboardingDiscovery') setOnboardingDraft(current => ({ ...current, discoverySource: onboardingDraft.discoverySource }));
        if (key === 'onboardingMotivation') setOnboardingDraft(current => ({ ...current, motivation: onboardingDraft.motivation }));
        if (key === 'onboardingInterests') setOnboardingDraft(current => ({ ...current, interests: onboardingDraft.interests }));
      }
      throw error;
    }
  }, [accent, onboardingComplete, onboardingDraft, profileName, theme]);

  const actions = useMemo<AppActions>(() => ({ reload, saveHabit, setEntry, archiveHabit, deleteHabit, addTask, toggleTask, setTaskSubtasks, deleteTask, setPreference }), [reload, saveHabit, setEntry, archiveHabit, deleteHabit, addTask, toggleTask, setTaskSubtasks, deleteTask, setPreference]);
  const themeData = useMemo<ThemeData>(() => ({ theme, resolvedTheme, accent }), [theme, resolvedTheme, accent]);
  const profileData = useMemo<ProfileData>(() => ({ profileName, onboardingComplete, onboardingDraft }), [profileName, onboardingComplete, onboardingDraft]);
  const appStatus = useMemo<AppStatus>(() => ({ ready }), [ready]);

  return <ActionsContext.Provider value={actions}>
      <HabitsContext.Provider value={habits}>
        <EntriesContext.Provider value={entries}>
          <TasksContext.Provider value={tasks}>
            <ThemeContext.Provider value={themeData}>
              <ProfileContext.Provider value={profileData}>
                <StatusContext.Provider value={appStatus}>{children}</StatusContext.Provider>
              </ProfileContext.Provider>
            </ThemeContext.Provider>
          </TasksContext.Provider>
        </EntriesContext.Provider>
      </HabitsContext.Provider>
  </ActionsContext.Provider>;
}

function useRequiredContext<T>(context: React.Context<T | null>, name: string): T {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used within AppProvider`);
  return value;
}

export const useHabitlyActions = () => useRequiredContext(ActionsContext, 'useHabitlyActions');
export const useHabitlyHabits = () => useRequiredContext(HabitsContext, 'useHabitlyHabits');
export const useHabitlyEntries = () => useRequiredContext(EntriesContext, 'useHabitlyEntries');
export const useHabitlyTasks = () => useRequiredContext(TasksContext, 'useHabitlyTasks');
export const useHabitlyTheme = () => useRequiredContext(ThemeContext, 'useHabitlyTheme');
export const useHabitlyProfile = () => useRequiredContext(ProfileContext, 'useHabitlyProfile');
export const useHabitlyStatus = () => useRequiredContext(StatusContext, 'useHabitlyStatus');
