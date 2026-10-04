import type { Habit, HabitEntry } from './types';
import { addDays, dateKey } from '../../utils/dates';

export const isScheduledOn=(habit:Habit,date:Date)=>habit.schedule.includes(date.getDay());
export function calculateStreak(habit:Habit,entries:HabitEntry[],today=new Date()){
  const own=entries.filter(e=>e.habitId===habit.id); if(!own.length)return 0;
  const completed=new Set(own.filter(e=>e.completed).map(e=>e.date));
  const todayKey=dateKey(today);let cursor=new Date(`${todayKey}T12:00:00`);let streak=0;
  if(todayKey===dateKey()&&isScheduledOn(habit,cursor)&&!completed.has(todayKey))cursor=addDays(cursor,-1);
  const earliest=new Date(`${own.map(e=>e.date).sort()[0]}T12:00:00`);
  while(dateKey(cursor)>=dateKey(earliest)){if(isScheduledOn(habit,cursor)){if(completed.has(dateKey(cursor)))streak++;else break;}cursor=addDays(cursor,-1);}
  return streak;
}
export function calculateLongestStreak(habit:Habit,entries:HabitEntry[]){
  const own=entries.filter(e=>e.habitId===habit.id); if(!own.length)return 0;
  const completed=new Set(own.filter(e=>e.completed).map(e=>e.date)); const start=new Date(`${own.map(e=>e.date).sort()[0]}T12:00:00`); const end=new Date(`${own.map(e=>e.date).sort().at(-1)}T12:00:00`);let current=0,longest=0;
  for(let cursor=start;dateKey(cursor)<=dateKey(end);cursor=addDays(cursor,1)){if(!isScheduledOn(habit,cursor))continue;if(completed.has(dateKey(cursor))){current++;longest=Math.max(longest,current);}else current=0;}return longest;
}
export const completionRate=(entries:HabitEntry[],habitId?:string)=>{const relevant=habitId?entries.filter(e=>e.habitId===habitId):entries;return relevant.length?Math.round(relevant.filter(e=>e.completed).length/relevant.length*100):0;};
export function scheduledCompletionRate(habit:Habit,entries:HabitEntry[],today=new Date()){const start=new Date(`${habit.createdAt.slice(0,10)}T12:00:00`);const end=new Date(today);end.setHours(12,0,0,0);const completed=new Set(entries.filter(e=>e.habitId===habit.id&&e.completed).map(e=>e.date));let due=0,done=0;for(let d=start;d<=end;d=addDays(d,1)){if(!isScheduledOn(habit,d))continue;due++;if(completed.has(dateKey(d)))done++;}return due?Math.round(done/due*100):0;}
export const heatmapLevel=(entry:HabitEntry|undefined,habit:Habit)=>{if(!entry)return 0;if(habit.type==='boolean')return entry.completed?4:0;return Math.max(0,Math.min(4,Math.ceil(entry.value/habit.target*4)));};
