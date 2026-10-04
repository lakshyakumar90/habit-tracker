import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { habitsRepository, preferencesRepository, tasksRepository } from '../../database/repositories';
import type { Habit, HabitDraft, HabitEntry } from '../habits/types';
import type { Task } from '../tasks/types';
import { dateKey } from '../../utils/dates';
import { setPaletteAccent, setPaletteMode } from '../../theme/tokens';

type AppData = { ready:boolean; habits:Habit[]; entries:HabitEntry[]; tasks:Task[]; profileName:string; theme:string; accent:string; onboardingComplete:boolean; reload:()=>Promise<void>; saveHabit:(d:HabitDraft,id?:string)=>Promise<void>; setEntry:(habit:Habit,value:number)=>Promise<void>; archiveHabit:(id:string,archived:boolean)=>Promise<void>; deleteHabit:(id:string)=>Promise<void>; addTask:(title:string,dueDate:string,priority:Task['priority'])=>Promise<void>; toggleTask:(task:Task)=>Promise<void>; deleteTask:(id:string)=>Promise<void>; setPreference:(key:string,value:string)=>Promise<void> };
const Context=createContext<AppData|null>(null);

export function AppProvider({children}:{children:React.ReactNode}) {
  const systemScheme=useColorScheme();
  const [ready,setReady]=useState(false); const [habits,setHabits]=useState<Habit[]>([]); const [entries,setEntries]=useState<HabitEntry[]>([]); const [tasks,setTasks]=useState<Task[]>([]);
  const [profileName,setProfileName]=useState('Friend'); const [theme,setTheme]=useState('system'); const [accent,setAccent]=useState('#8068EA'); const [onboardingComplete,setOnboarding]=useState(false);
  const reload=useCallback(async()=>{ const [h,e,t,n,th,a,o]=await Promise.all([habitsRepository.all(),habitsRepository.entries(),tasksRepository.all(),preferencesRepository.get('profileName','Friend'),preferencesRepository.get('theme','system'),preferencesRepository.get('accent','#8068EA'),preferencesRepository.get('onboardingComplete','false')]); setHabits(h);setEntries(e);setTasks(t);setProfileName(n);setTheme(th);setAccent(a);setOnboarding(o==='true');setReady(true); },[]);
  useEffect(()=>{setPaletteMode(theme==='dark'||(theme==='system'&&systemScheme==='dark')?'dark':'light');setPaletteAccent(accent)},[theme,systemScheme,accent]);
  useEffect(()=>{const handle=setTimeout(()=>void reload(),0);return ()=>clearTimeout(handle)},[reload]);
  const value=useMemo<AppData>(()=>({ready,habits,entries,tasks,profileName,theme,accent,onboardingComplete,reload,
    saveHabit:async(d,id)=>{await habitsRepository.save(d,id);await reload()},
    setEntry:async(h,v)=>{const done=h.type==='boolean'?!entries.some(e=>e.habitId===h.id&&e.date===dateKey()&&e.completed):v>=h.target;await habitsRepository.setEntry(h.id,dateKey(),h.type==='boolean'?(done?1:0):v,done);await reload()},
    archiveHabit:async(id,archived)=>{await habitsRepository.archive(id,archived);await reload()}, deleteHabit:async(id)=>{await habitsRepository.remove(id);await reload()},
    addTask:async(title,dueDate,priority)=>{await tasksRepository.save(title,dueDate,priority);await reload()}, toggleTask:async(task)=>{await tasksRepository.toggle(task);await reload()}, deleteTask:async(id)=>{await tasksRepository.remove(id);await reload()},
    setPreference:async(key,v)=>{await preferencesRepository.set(key,v);await reload()},
  }),[ready,habits,entries,tasks,profileName,theme,accent,onboardingComplete,reload]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useHabitly=()=>{const value=useContext(Context);if(!value)throw new Error('useHabitly must be used within AppProvider');return value};
