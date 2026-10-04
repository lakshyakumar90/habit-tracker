import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { habitsRepository, preferencesRepository, tasksRepository } from '../../database/repositories';
import type { Habit, HabitDraft, HabitEntry } from '../habits/types';
import type { Task, TaskDraft } from '../tasks/types';
import { dateKey } from '../../utils/dates';
import { setPaletteAccent, setPaletteMode } from '../../theme/tokens';
import { cancelEntityReminders, scheduleHabitReminders, scheduleTaskReminder } from '../../services/notifications';

type AppData = { ready:boolean; habits:Habit[]; entries:HabitEntry[]; tasks:Task[]; profileName:string; theme:string; accent:string; onboardingComplete:boolean; reload:()=>Promise<void>; saveHabit:(d:HabitDraft,id?:string)=>Promise<string|null>; setEntry:(habit:Habit,value:number,date?:string)=>Promise<void>; archiveHabit:(id:string,archived:boolean)=>Promise<void>; deleteHabit:(id:string)=>Promise<void>; addTask:(draft:TaskDraft)=>Promise<string|null>; toggleTask:(task:Task)=>Promise<void>; deleteTask:(id:string)=>Promise<void>; setPreference:(key:string,value:string)=>Promise<void> };
const Context=createContext<AppData|null>(null);

export function AppProvider({children}:{children:React.ReactNode}) {
  const systemScheme=useColorScheme();
  const [ready,setReady]=useState(false); const [habits,setHabits]=useState<Habit[]>([]); const [entries,setEntries]=useState<HabitEntry[]>([]); const [tasks,setTasks]=useState<Task[]>([]);
  const [profileName,setProfileName]=useState('Friend'); const [theme,setTheme]=useState('system'); const [accent,setAccent]=useState('#6750C7'); const [onboardingComplete,setOnboarding]=useState(false);
  const reload=useCallback(async()=>{ const [h,e,t,n,th,a,o]=await Promise.all([habitsRepository.all(),habitsRepository.entries(),tasksRepository.all(),preferencesRepository.get('profileName','Friend'),preferencesRepository.get('theme','system'),preferencesRepository.get('accent','#6750C7'),preferencesRepository.get('onboardingComplete','false')]); setHabits(h);setEntries(e);setTasks(t);setProfileName(n);setTheme(th);setAccent(a);setOnboarding(o==='true');setReady(true); },[]);
  setPaletteMode(theme==='dark'||(theme==='system'&&systemScheme==='dark')?'dark':'light');setPaletteAccent(accent);
  useEffect(()=>{const handle=setTimeout(()=>void reload(),0);return ()=>clearTimeout(handle)},[reload]);
  const value=useMemo<AppData>(()=>({ready,habits,entries,tasks,profileName,theme,accent,onboardingComplete,reload,
    saveHabit:async(d,id)=>{if(id)await cancelEntityReminders(id);const saved=await habitsRepository.save(d,id);let reminderError:string|null=null;if(d.reminderAt&&!saved.archived){try{const ids=await scheduleHabitReminders(saved.id,saved.name,saved.schedule,d.reminderAt);await habitsRepository.setNotificationIds(saved.id,ids)}catch(error){await habitsRepository.setNotificationIds(saved.id,[]);reminderError=error instanceof Error?error.message:'The reminder could not be scheduled.'}}await reload();return reminderError},
    setEntry:async(h,v,date=dateKey())=>{const done=h.type==='boolean'?!entries.some(e=>e.habitId===h.id&&e.date===date&&e.completed):v>=h.target;await habitsRepository.setEntry(h.id,date,h.type==='boolean'?(done?1:0):v,done);await reload()},
    archiveHabit:async(id,archived)=>{await habitsRepository.archive(id,archived);if(archived)await cancelEntityReminders(id);else{const habit=await habitsRepository.get(id);if(habit?.reminderAt)await habitsRepository.setNotificationIds(id,await scheduleHabitReminders(id,habit.name,habit.schedule,habit.reminderAt))}await reload()}, deleteHabit:async(id)=>{await cancelEntityReminders(id);await habitsRepository.remove(id);await reload()},
    addTask:async(draft)=>{if(draft.id)await cancelEntityReminders(draft.id);const id=await tasksRepository.save(draft);let reminderError:string|null=null;if(draft.reminderAt){try{const notificationId=await scheduleTaskReminder(id,draft.title,draft.dueDate,draft.reminderAt);if(notificationId)await tasksRepository.setNotificationId(id,notificationId)}catch(error){await tasksRepository.setNotificationId(id,null);reminderError=error instanceof Error?error.message:'The reminder could not be scheduled.'}}await reload();return reminderError}, toggleTask:async(task)=>{await tasksRepository.toggle(task);if(!task.completed)await cancelEntityReminders(task.id);else if(task.reminderAt){try{const id=await scheduleTaskReminder(task.id,task.title,task.dueDate,task.reminderAt);await tasksRepository.setNotificationId(task.id,id)}catch{await tasksRepository.setNotificationId(task.id,null)}}await reload()}, deleteTask:async(id)=>{await cancelEntityReminders(id);await tasksRepository.remove(id);await reload()},
    setPreference:async(key,v)=>{if(key==='theme')setTheme(v);if(key==='accent')setAccent(v);if(key==='profileName')setProfileName(v);if(key==='onboardingComplete')setOnboarding(v==='true');await preferencesRepository.set(key,v);await reload()},
  }),[ready,habits,entries,tasks,profileName,theme,accent,onboardingComplete,reload]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useHabitly=()=>{const value=useContext(Context);if(!value)throw new Error('useHabitly must be used within AppProvider');return value};
