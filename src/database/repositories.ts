import { getDatabase, makeId } from './client';
import { dateKey } from '../utils/dates';
import type { Habit, HabitDraft, HabitEntry } from '../features/habits/types';
import type { Task, TaskRepeatRule, TaskSubtask } from '../features/tasks/types';

type HabitRow = { id: string; name: string; description: string; icon: string; color: string; type: Habit['type']; difficulty: Habit['difficulty']; target: number; unit: string; schedule: string; reminder_at:string|null; notification_ids:string; archived: number; created_at: string };
type EntryRow = { id: string; habit_id: string; entry_date: string; value: number; completed: number };
type TaskRow = { id: string; title: string; notes: string; due_date: string; due_time: string|null; reminder_at: string|null; notification_id: string|null; notification_ids: string; priority: Task['priority']; completed: number; completed_date: string|null; created_at: string; list_name: string; subtasks: string; icon: string; color: string; repeat_rule: TaskRepeatRule; repeat_days: string; reminders: string };
const habitFromRow = (r: HabitRow): Habit => ({ id:r.id, name:r.name, description:r.description, icon:r.icon, color:r.color, type:r.type, difficulty:r.difficulty, target:r.target, unit:r.unit, schedule:JSON.parse(r.schedule), reminderAt:r.reminder_at, notificationIds:JSON.parse(r.notification_ids||'[]'), archived:!!r.archived, createdAt:r.created_at });
const entryFromRow = (r: EntryRow): HabitEntry => ({ id:r.id, habitId:r.habit_id, date:r.entry_date, value:r.value, completed:!!r.completed });
const taskFromRow = (r: TaskRow): Task => {
  const repeatRule = r.repeat_rule ?? 'none';
  const today = dateKey();
  const completedThisCycle = repeatRule === 'daily' ? r.completed_date === today : repeatRule === 'none' ? Boolean(r.completed) : repeatRule === 'weekly' ? Boolean(r.completed_date && weekKey(r.completed_date) === weekKey(today)) : Boolean(r.completed_date && latestOccurrence(today, JSON.parse(r.repeat_days||'[]')) === r.completed_date);
  const repeatDays:number[] = JSON.parse(r.repeat_days||'[]');
  const completed = Boolean(r.completed) && completedThisCycle;
  const dueDate = repeatRule === 'none' ? r.due_date : recurringDueDate(r.due_date, repeatRule, repeatDays, today, completed);
  return { id:r.id, title:r.title, notes:r.notes, dueDate, dueTime:r.due_time, reminderAt:r.reminder_at, notificationId:r.notification_id, notificationIds:JSON.parse(r.notification_ids||'[]'), priority:r.priority, completed, completedDate:r.completed_date, createdAt:r.created_at, listName:r.list_name??'Personal', subtasks:JSON.parse(r.subtasks||'[]'), icon:r.icon??'clipboard-text', color:r.color??'#6750C7', repeatRule, repeatDays, reminders:JSON.parse(r.reminders||'[]') };
};
const weekKey = (key:string) => { const date=new Date(`${key}T12:00:00`); date.setDate(date.getDate()-((date.getDay()+6)%7)); return dateKey(date); };
const latestOccurrence = (today:string,days:number[]) => { const end=new Date(`${today}T12:00:00`); for(let back=0;back<7;back++){const date=new Date(end);date.setDate(end.getDate()-back);if(days.includes(date.getDay()))return dateKey(date);}return ''; };
const recurringDueDate = (stored:string,rule:TaskRepeatRule,days:number[],today:string,completed:boolean) => {
  const date=new Date(`${today}T12:00:00`);
  const eligible=rule==='daily'?[0,1,2,3,4,5,6]:rule==='weekly'?[new Date(`${stored}T12:00:00`).getDay()]:days;
  if(!eligible.length)return stored;
  for(let step=completed?1:0;step<=7;step++){
    const candidate=new Date(date);candidate.setDate(date.getDate()+step);
    if(eligible.includes(candidate.getDay()))return dateKey(candidate);
  }
  return stored;
};

export const habitsRepository = {
  async all() { const db=await getDatabase(); return (await db.getAllAsync<HabitRow>('SELECT * FROM habits ORDER BY archived, created_at')).map(habitFromRow); },
  async get(id:string) { const db=await getDatabase(); const r=await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id=?',id); return r?habitFromRow(r):null; },
  async save(draft:HabitDraft,id?:string) { const db=await getDatabase(); const key=id??makeId(); const reminderAt=draft.reminderAt??null;const description=draft.description??'';const difficulty=draft.difficulty??'easy';if(id) await db.runAsync('UPDATE habits SET name=?,description=?,icon=?,color=?,type=?,difficulty=?,target=?,unit=?,schedule=?,reminder_at=?,notification_ids="[]" WHERE id=?',draft.name,description,draft.icon,draft.color,draft.type,difficulty,draft.target,draft.unit,JSON.stringify(draft.schedule),reminderAt,key); else await db.runAsync('INSERT INTO habits (id,name,description,icon,color,type,difficulty,target,unit,schedule,reminder_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',key,draft.name,description,draft.icon,draft.color,draft.type,difficulty,draft.target,draft.unit,JSON.stringify(draft.schedule),reminderAt,new Date().toISOString()); return (await this.get(key))!; },
  async setNotificationIds(id:string,ids:string[]) { const db=await getDatabase(); await db.runAsync('UPDATE habits SET notification_ids=? WHERE id=?',JSON.stringify(ids),id); },
  async archive(id:string,archived:boolean) { const db=await getDatabase(); await db.runAsync('UPDATE habits SET archived=? WHERE id=?',Number(archived),id); },
  async remove(id:string) { const db=await getDatabase(); await db.runAsync('DELETE FROM habits WHERE id=?',id); },
  async entries(habitId?:string) { const db=await getDatabase(); const rows=habitId?await db.getAllAsync<EntryRow>('SELECT * FROM habit_entries WHERE habit_id=? ORDER BY entry_date',habitId):await db.getAllAsync<EntryRow>('SELECT * FROM habit_entries ORDER BY entry_date'); return rows.map(entryFromRow); },
  async setEntry(habitId:string,date:string,value:number,completed:boolean) { const db=await getDatabase(); const existing=await db.getFirstAsync<{id:string}>('SELECT id FROM habit_entries WHERE habit_id=? AND entry_date=?',habitId,date); if(existing) await db.runAsync('UPDATE habit_entries SET value=?,completed=? WHERE id=?',value,Number(completed),existing.id); else await db.runAsync('INSERT INTO habit_entries (id,habit_id,entry_date,value,completed) VALUES (?,?,?,?,?)',makeId(),habitId,date,value,Number(completed)); },
};

export const tasksRepository = {
  async all() { const db=await getDatabase(); return (await db.getAllAsync<TaskRow>('SELECT * FROM tasks ORDER BY due_date, completed, created_at')).map(taskFromRow); },
  async save(draft:{title:string;notes:string;dueDate:string;dueTime:string|null;priority:Task['priority'];listName:string;subtasks:TaskSubtask[];icon:string;color:string;repeatRule:TaskRepeatRule;repeatDays:number[];reminders:number[];id?:string}) { const db=await getDatabase(); const taskId=draft.id??makeId(); const params=[draft.title,draft.notes,draft.dueDate,draft.priority,draft.dueTime,draft.listName,JSON.stringify(draft.subtasks),draft.icon,draft.color,draft.repeatRule,JSON.stringify(draft.repeatDays),JSON.stringify(draft.reminders)]; if(draft.id) await db.runAsync('UPDATE tasks SET title=?,notes=?,due_date=?,priority=?,due_time=?,reminder_at=NULL,notification_id=NULL,notification_ids="[]",list_name=?,subtasks=?,icon=?,color=?,repeat_rule=?,repeat_days=?,reminders=? WHERE id=?',...params,taskId); else await db.runAsync('INSERT INTO tasks (id,title,notes,due_date,priority,due_time,list_name,subtasks,icon,color,repeat_rule,repeat_days,reminders,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',taskId,draft.title,draft.notes,draft.dueDate,draft.priority,draft.dueTime,draft.listName,JSON.stringify(draft.subtasks),draft.icon,draft.color,draft.repeatRule,JSON.stringify(draft.repeatDays),JSON.stringify(draft.reminders),new Date().toISOString()); return taskId; },
  async setSubtasks(id:string,subtasks:TaskSubtask[]) { const db=await getDatabase(); await db.runAsync('UPDATE tasks SET subtasks=? WHERE id=?',JSON.stringify(subtasks),id); },
  async setNotificationIds(id:string,notificationIds:string[]) { const db=await getDatabase(); await db.runAsync('UPDATE tasks SET notification_ids=?,notification_id=? WHERE id=?',JSON.stringify(notificationIds),notificationIds[0]??null,id); },
  async setNotificationId(id:string,notificationId:string|null) { const db=await getDatabase(); await db.runAsync('UPDATE tasks SET notification_id=?,notification_ids=? WHERE id=?',notificationId,JSON.stringify(notificationId?[notificationId]:[]),id); },
  async toggle(task:Task) { const db=await getDatabase(); const completed=!task.completed; await db.runAsync('UPDATE tasks SET completed=?,completed_date=?,notification_id=CASE WHEN repeat_rule="none" THEN NULL ELSE notification_id END,notification_ids=CASE WHEN repeat_rule="none" THEN "[]" ELSE notification_ids END WHERE id=?',Number(completed),completed?dateKey():null,task.id); },
  async remove(id:string) { const db=await getDatabase(); await db.runAsync('DELETE FROM tasks WHERE id=?',id); },
};

export const preferencesRepository = {
  async get(key:string,fallback:string) { const db=await getDatabase(); return (await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?',key))?.value??fallback; },
  async set(key:string,value:string) { const db=await getDatabase(); await db.runAsync('INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,value); },
};

export async function clearLocalData() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM tasks');
    await db.runAsync('DELETE FROM habits');
    await db.runAsync("DELETE FROM preferences WHERE key != 'sampleDataSeeded'");
  });
}

export async function exportLocalData() {
  return { exportedAt:new Date().toISOString(), habits:await habitsRepository.all(), habitEntries:await habitsRepository.entries(), tasks:await tasksRepository.all(), preferences:{ profileName:await preferencesRepository.get('profileName','Friend'), theme:await preferencesRepository.get('theme','system'), accent:await preferencesRepository.get('accent','#8570EE') } };
}
