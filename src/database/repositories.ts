import { getDatabase, makeId } from './client';
import type { Habit, HabitDraft, HabitEntry } from '../features/habits/types';
import type { Task } from '../features/tasks/types';

type HabitRow = { id: string; name: string; description: string; icon: string; color: string; type: Habit['type']; difficulty: Habit['difficulty']; target: number; unit: string; schedule: string; reminder_at:string|null; notification_ids:string; archived: number; created_at: string };
type EntryRow = { id: string; habit_id: string; entry_date: string; value: number; completed: number };
type TaskRow = { id: string; title: string; notes: string; due_date: string; reminder_at: string|null; notification_id: string|null; priority: Task['priority']; completed: number; created_at: string };
const habitFromRow = (r: HabitRow): Habit => ({ id:r.id, name:r.name, description:r.description, icon:r.icon, color:r.color, type:r.type, difficulty:r.difficulty, target:r.target, unit:r.unit, schedule:JSON.parse(r.schedule), reminderAt:r.reminder_at, notificationIds:JSON.parse(r.notification_ids||'[]'), archived:!!r.archived, createdAt:r.created_at });
const entryFromRow = (r: EntryRow): HabitEntry => ({ id:r.id, habitId:r.habit_id, date:r.entry_date, value:r.value, completed:!!r.completed });
const taskFromRow = (r: TaskRow): Task => ({ id:r.id, title:r.title, notes:r.notes, dueDate:r.due_date, reminderAt:r.reminder_at, notificationId:r.notification_id, priority:r.priority, completed:!!r.completed, createdAt:r.created_at });

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
  async save(draft:{title:string;notes:string;dueDate:string;priority:Task['priority'];reminderAt:string|null;id?:string}) { const db=await getDatabase(); const taskId=draft.id??makeId(); if(draft.id) await db.runAsync('UPDATE tasks SET title=?,notes=?,due_date=?,priority=?,reminder_at=?,notification_id=NULL WHERE id=?',draft.title,draft.notes,draft.dueDate,draft.priority,draft.reminderAt,taskId); else await db.runAsync('INSERT INTO tasks (id,title,notes,due_date,priority,reminder_at,created_at) VALUES (?,?,?,?,?,?,?)',taskId,draft.title,draft.notes,draft.dueDate,draft.priority,draft.reminderAt,new Date().toISOString()); return taskId; },
  async setNotificationId(id:string,notificationId:string|null) { const db=await getDatabase(); await db.runAsync('UPDATE tasks SET notification_id=? WHERE id=?',notificationId,id); },
  async toggle(task:Task) { const db=await getDatabase(); await db.runAsync('UPDATE tasks SET completed=?,notification_id=NULL WHERE id=?',Number(!task.completed),task.id); },
  async remove(id:string) { const db=await getDatabase(); await db.runAsync('DELETE FROM tasks WHERE id=?',id); },
};

export const preferencesRepository = {
  async get(key:string,fallback:string) { const db=await getDatabase(); return (await db.getFirstAsync<{value:string}>('SELECT value FROM preferences WHERE key=?',key))?.value??fallback; },
  async set(key:string,value:string) { const db=await getDatabase(); await db.runAsync('INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,value); },
};

export async function exportLocalData() {
  return { exportedAt:new Date().toISOString(), habits:await habitsRepository.all(), habitEntries:await habitsRepository.entries(), tasks:await tasksRepository.all(), preferences:{ profileName:await preferencesRepository.get('profileName','Friend'), theme:await preferencesRepository.get('theme','system'), accent:await preferencesRepository.get('accent','#8570EE') } };
}
