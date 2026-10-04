import type { Habit, HabitEntry } from '../habits/types';
import { isScheduledOn } from '../habits/domain';
import { addDays, dateKey } from '../../utils/dates';

/** Share of scheduled check-ins completed in the calendar week, through today for the current week. */
export function weeklyCompletion(habits:Habit[],entries:HabitEntry[],weeksAgo=0){
  const today=new Date();today.setHours(12,0,0,0);
  const weekStart=addDays(today,-((today.getDay()+6)%7)-weeksAgo*7);
  const weekEnd=addDays(weekStart,6);
  const end=weeksAgo===0&&weekEnd>today?today:weekEnd;
  let scheduled=0,done=0;
  for(let d=weekStart;d<=end;d=addDays(d,1))for(const h of habits){
    if(h.archived||!isScheduledOn(h,d))continue;
    scheduled++;
    if(entries.some(e=>e.habitId===h.id&&e.date===dateKey(d)&&e.completed))done++;
  }
  return scheduled?Math.round(done/scheduled*100):0;
}

/** Most successful weekday based on observed scheduled check-ins in the last 30 days. */
export function bestWeekday(habits:Habit[],entries:HabitEntry[]){
  const today=new Date();today.setHours(12,0,0,0);
  const counts=Array.from({length:7},()=>({scheduled:0,done:0}));
  for(let d=addDays(today,-29);d<=today;d=addDays(d,1))for(const h of habits){
    if(h.archived||!isScheduledOn(h,d))continue;
    const day=d.getDay();counts[day].scheduled++;
    if(entries.some(e=>e.habitId===h.id&&e.date===dateKey(d)&&e.completed))counts[day].done++;
  }
  const best=counts.map((c,day)=>({day,score:c.scheduled?c.done/c.scheduled:-1})).sort((a,b)=>b.score-a.score)[0];
  return best.score<0?'—':['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][best.day];
}
