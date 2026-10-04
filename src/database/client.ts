import * as SQLite from 'expo-sqlite';
import { dateKey } from '../utils/dates';

let opening: Promise<SQLite.SQLiteDatabase> | undefined;

export const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function getDatabase() {
  if (!opening) opening = initialize();
  return opening;
}

async function initialize() {
  const db = await SQLite.openDatabaseAsync('habitly.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((version?.user_version ?? 0) < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE habits (
          id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, icon TEXT NOT NULL, color TEXT NOT NULL,
          type TEXT NOT NULL, target REAL NOT NULL, unit TEXT NOT NULL, schedule TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
        );
        CREATE TABLE habit_entries (
          id TEXT PRIMARY KEY NOT NULL, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
          entry_date TEXT NOT NULL, value REAL NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0,
          UNIQUE(habit_id, entry_date)
        );
        CREATE INDEX habit_entries_by_date ON habit_entries(entry_date);
        CREATE TABLE tasks (
          id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
          due_date TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'medium', completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE TABLE preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
        PRAGMA user_version = 1;
      `);
    });
  }
  const prefs = await db.getFirstAsync<{ value: string }>("SELECT value FROM preferences WHERE key = 'profileName'");
  if (!prefs) await db.runAsync("INSERT INTO preferences (key, value) VALUES ('profileName', 'Friend')");
  const seeded = await db.getFirstAsync<{ value:string }>("SELECT value FROM preferences WHERE key = 'sampleDataSeeded'");
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits');
  if (!seeded && !row?.count) {
    const seeds = [
      ['Drink water', '💧', '#8570EE', 'quantity', 8, 'glasses'],
      ['Workout', '🏃', '#F6C75A', 'duration', 30, 'min'],
      ['Read', '📖', '#F6C75A', 'duration', 20, 'min'],
      ['Meditate', '🌱', '#8570EE', 'duration', 10, 'min'],
    ] as const;
    for (const [name, icon, color, type, target, unit] of seeds) {
      await db.runAsync('INSERT INTO habits (id,name,icon,color,type,target,unit,schedule,created_at) VALUES (?,?,?,?,?,?,?,?,?)', makeId(), name, icon, color, type, target, unit, JSON.stringify([0,1,2,3,4,5,6]), dateKey());
    }
    await db.runAsync('INSERT INTO tasks (id,title,due_date,priority,created_at) VALUES (?,?,?,?,?)', makeId(), 'Finish assignment', dateKey(), 'high', dateKey());
    await db.runAsync('INSERT INTO tasks (id,title,due_date,priority,created_at) VALUES (?,?,?,?,?)', makeId(), 'Plan the week', dateKey(), 'medium', dateKey());
  }
  if (!seeded) await db.runAsync("INSERT INTO preferences (key,value) VALUES ('sampleDataSeeded','true')");
  return db;
}
