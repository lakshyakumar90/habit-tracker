import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { habitsRepository, preferencesRepository, tasksRepository } from '../../database/repositories';
import type { Habit, HabitDraft, HabitEntry } from '../habits/types';
import type { Task, TaskDraft, TaskSubtask } from '../tasks/types';
import { dateKey } from '../../utils/dates';
import { setPaletteAccent, setPaletteMode } from '../../theme/tokens';
import { cancelEntityReminders, scheduleHabitReminders, scheduleTaskNotifications } from '../../services/notifications';
import type { OnboardingDraft } from '../onboarding/types';

type AppData = { ready:boolean; habits:Habit[]; entries:HabitEntry[]; tasks:Task[]; profileName:string; theme:string; resolvedTheme:'light'|'dark'; accent:string; onboardingComplete:boolean; onboardingDraft:OnboardingDraft; reload:()=>Promise<void>; saveHabit:(d:HabitDraft,id?:string)=>Promise<string|null>; setEntry:(habit:Habit,value:number,date?:string)=>Promise<void>; archiveHabit:(id:string,archived:boolean)=>Promise<void>; deleteHabit:(id:string)=>Promise<void>; addTask:(draft:TaskDraft)=>Promise<{id:string;reminderError:string|null}>; toggleTask:(task:Task)=>Promise<void>; setTaskSubtasks:(id:string,subtasks:TaskSubtask[])=>Promise<void>; deleteTask:(id:string)=>Promise<void>; setPreference:(key:string,value:string)=>Promise<void> };
const Context=createContext<AppData|null>(null);

export function AppProvider({children}:{children:React.ReactNode}) {
  const systemScheme=useColorScheme();
  const [ready,setReady]=useState(false); const [habits,setHabits]=useState<Habit[]>([]); const [entries,setEntries]=useState<HabitEntry[]>([]); const [tasks,setTasks]=useState<Task[]>([]);
  const [profileName,setProfileName]=useState('Friend'); const [theme,setTheme]=useState('system'); const [accent,setAccent]=useState('#6750C7'); const [onboardingComplete,setOnboarding]=useState(false);
  const [onboardingDraft,setOnboardingDraft]=useState<OnboardingDraft>({ageRange:'',interests:[],discoverySource:'',motivation:''});
  const reload=useCallback(async()=>{ const [h,e,t,n,th,a,o,age,interests,source,motivation]=await Promise.all([habitsRepository.all(),habitsRepository.entries(),tasksRepository.all(),preferencesRepository.get('profileName','Friend'),preferencesRepository.get('theme','system'),preferencesRepository.get('accent','#6750C7'),preferencesRepository.get('onboardingComplete','false'),preferencesRepository.get('onboardingAgeRange',''),preferencesRepository.get('onboardingInterests','[]'),preferencesRepository.get('onboardingDiscovery',''),preferencesRepository.get('onboardingMotivation','')]); let savedInterests:string[]=[];try{const parsed=JSON.parse(interests);if(Array.isArray(parsed))savedInterests=parsed.filter((item):item is string=>typeof item==='string')}catch{/* Ignore malformed optional onboarding data. */} setHabits(h);setEntries(e);setTasks(t);setProfileName(n);setTheme(th);setAccent(a);setOnboarding(o==='true');setOnboardingDraft({ageRange:age,interests:savedInterests,discoverySource:source,motivation});setReady(true); },[]);
  const resolvedTheme=theme==='dark'||(theme==='system'&&systemScheme==='dark')?'dark':'light';
  setPaletteMode(resolvedTheme);setPaletteAccent(accent);
  useEffect(()=>{const handle=setTimeout(()=>void reload(),0);return ()=>clearTimeout(handle)},[reload]);
  const value=useMemo<AppData>(()=>({ready,habits,entries,tasks,profileName,theme,resolvedTheme,accent,onboardingComplete,onboardingDraft,reload,
    saveHabit:async(d,id)=>{if(id)await cancelEntityReminders(id);const saved=await habitsRepository.save(d,id);let reminderError:string|null=null;const remindersEnabled=await preferencesRepository.get('habitRemindersEnabled','true');if(d.reminderAt&&!saved.archived&&remindersEnabled!=='false'){try{const ids=await scheduleHabitReminders(saved.id,saved.name,saved.schedule,d.reminderAt);await habitsRepository.setNotificationIds(saved.id,ids)}catch(error){await habitsRepository.setNotificationIds(saved.id,[]);reminderError=error instanceof Error?error.message:'The reminder could not be scheduled.'}}else await habitsRepository.setNotificationIds(saved.id,[]);await reload();return reminderError},
    setEntry:async(h,v,date=dateKey())=>{const done=h.type==='boolean'?!entries.some(e=>e.habitId===h.id&&e.date===date&&e.completed):v>=h.target;await habitsRepository.setEntry(h.id,date,h.type==='boolean'?(done?1:0):v,done);await reload()},
    archiveHabit:async(id,archived)=>{await habitsRepository.archive(id,archived);if(archived){await cancelEntityReminders(id);await habitsRepository.setNotificationIds(id,[])}else{const habit=await habitsRepository.get(id);const remindersEnabled=await preferencesRepository.get('habitRemindersEnabled','true');if(habit?.reminderAt&&remindersEnabled!=='false')await habitsRepository.setNotificationIds(id,await scheduleHabitReminders(id,habit.name,habit.schedule,habit.reminderAt))}await reload()}, deleteHabit:async(id)=>{await cancelEntityReminders(id);await habitsRepository.remove(id);await reload()},
    addTask:async(draft)=>{const id=await tasksRepository.save(draft);let reminderError:string|null=null;try{const ids=await scheduleTaskNotifications(id,draft.title,draft);await tasksRepository.setNotificationIds(id,ids)}catch(error){await tasksRepository.setNotificationIds(id,[]);reminderError=error instanceof Error?error.message:'The reminder could not be scheduled.'}await reload();return {id,reminderError}}, toggleTask:async(task)=>{await tasksRepository.toggle(task);if(!task.completed){if(task.repeatRule==='none')await cancelEntityReminders(task.id)}else if(task.reminders.length){try{const ids=await scheduleTaskNotifications(task.id,task.title,task);await tasksRepository.setNotificationIds(task.id,ids)}catch{await tasksRepository.setNotificationIds(task.id,[])}}await reload()}, setTaskSubtasks:async(id,subtasks)=>{await tasksRepository.setSubtasks(id,subtasks);await reload()}, deleteTask:async(id)=>{await cancelEntityReminders(id);await tasksRepository.remove(id);await reload()},
    setPreference:async(key,v)=>{
      if(key==='theme')setTheme(v);
      if(key==='accent')setAccent(v);
      try { await preferencesRepository.set(key,v); }
      catch(error) {
        if(key==='theme')setTheme(theme);
        if(key==='accent')setAccent(accent);
        throw error;
      }
      if(key==='profileName')setProfileName(v);
      if(key==='onboardingComplete')setOnboarding(v==='true');
      if(key==='onboardingAgeRange')setOnboardingDraft(d=>({...d,ageRange:v}));
      if(key==='onboardingInterests'){try{const parsed=JSON.parse(v);if(Array.isArray(parsed))setOnboardingDraft(d=>({...d,interests:parsed.filter((item):item is string=>typeof item==='string')}))}catch{/* Ignore invalid optional onboarding data. */}}
      if(key==='onboardingDiscovery')setOnboardingDraft(d=>({...d,discoverySource:v}));
      if(key==='onboardingMotivation')setOnboardingDraft(d=>({...d,motivation:v}));
    },
  }),[ready,habits,entries,tasks,profileName,theme,resolvedTheme,accent,onboardingComplete,onboardingDraft,reload]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useHabitly=()=>{const value=useContext(Context);if(!value)throw new Error('useHabitly must be used within AppProvider');return value};
