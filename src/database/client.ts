import * as SQLite from 'expo-sqlite';
import { dateKey } from '../utils/dates';

let opening: Promise<SQLite.SQLiteDatabase> | undefined;
let databaseOwner: string | null = null;

export function setDatabaseOwner(uid: string | null) {
  if (uid && !/^[A-Za-z0-9_-]+$/.test(uid)) throw new Error('Invalid account identifier.');
  if (databaseOwner === uid) return;
  databaseOwner = uid;
  opening = undefined;
}
export function getDatabaseOwner() { return databaseOwner; }

export const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function getDatabase() {
  if (!opening) opening = initialize();
  return opening;
}

async function initialize() {
  const owner = databaseOwner;
  const db = await SQLite.openDatabaseAsync(owner ? `habitly-${owner}.db` : 'habitly.db');
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
  if ((version?.user_version ?? 0) < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync('ALTER TABLE tasks ADD COLUMN reminder_at TEXT; ALTER TABLE tasks ADD COLUMN notification_id TEXT; PRAGMA user_version = 2;');
    });
  }
  if ((version?.user_version ?? 0) < 3) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN reminder_at TEXT; ALTER TABLE habits ADD COLUMN notification_ids TEXT NOT NULL DEFAULT '[]'; PRAGMA user_version = 3;`);
    });
  }
  if ((version?.user_version ?? 0) < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE habits ADD COLUMN description TEXT NOT NULL DEFAULT ''; ALTER TABLE habits ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'easy'; PRAGMA user_version = 4;`);
    });
  }
  if ((version?.user_version ?? 0) < 5) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE tasks ADD COLUMN list_name TEXT NOT NULL DEFAULT 'Personal'; ALTER TABLE tasks ADD COLUMN subtasks TEXT NOT NULL DEFAULT '[]'; PRAGMA user_version = 5;`);
    });
  }
  if ((version?.user_version ?? 0) < 6) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE tasks ADD COLUMN icon TEXT NOT NULL DEFAULT 'clipboard-text'; ALTER TABLE tasks ADD COLUMN color TEXT NOT NULL DEFAULT '#6750C7'; ALTER TABLE tasks ADD COLUMN due_time TEXT; ALTER TABLE tasks ADD COLUMN repeat_rule TEXT NOT NULL DEFAULT 'none'; ALTER TABLE tasks ADD COLUMN repeat_days TEXT NOT NULL DEFAULT '[]'; ALTER TABLE tasks ADD COLUMN reminders TEXT NOT NULL DEFAULT '[]'; ALTER TABLE tasks ADD COLUMN notification_ids TEXT NOT NULL DEFAULT '[]'; UPDATE tasks SET due_time=reminder_at, reminders=CASE WHEN reminder_at IS NULL THEN '[]' ELSE '[0]' END; PRAGMA user_version = 6;`);
    });
  }
  if ((version?.user_version ?? 0) < 7) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`ALTER TABLE tasks ADD COLUMN completed_date TEXT; PRAGMA user_version = 7;`);
    });
  }
  if ((version?.user_version ?? 0) < 8) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_outbox (
        entity TEXT NOT NULL, id TEXT NOT NULL, operation TEXT NOT NULL,
        revision INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(entity, id)
      );
      CREATE TABLE IF NOT EXISTS sync_runtime (id INTEGER PRIMARY KEY CHECK(id=1), importing INTEGER NOT NULL DEFAULT 0);
      INSERT OR IGNORE INTO sync_runtime(id, importing) VALUES (1, 0);
      CREATE TRIGGER habits_sync_insert AFTER INSERT ON habits WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('habits',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER habits_sync_update AFTER UPDATE ON habits WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0
        AND (old.name IS NOT new.name OR old.description IS NOT new.description OR old.icon IS NOT new.icon OR old.color IS NOT new.color OR old.type IS NOT new.type OR old.difficulty IS NOT new.difficulty OR old.target IS NOT new.target OR old.unit IS NOT new.unit OR old.schedule IS NOT new.schedule OR old.reminder_at IS NOT new.reminder_at OR old.archived IS NOT new.archived) BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('habits',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER habits_sync_delete AFTER DELETE ON habits WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('habits',old.id,'delete') ON CONFLICT(entity,id) DO UPDATE SET operation='delete',revision=revision+1;
      END;
      CREATE TRIGGER entries_sync_insert AFTER INSERT ON habit_entries WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('entries',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER entries_sync_update AFTER UPDATE ON habit_entries WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('entries',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER entries_sync_delete AFTER DELETE ON habit_entries WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('entries',old.id,'delete') ON CONFLICT(entity,id) DO UPDATE SET operation='delete',revision=revision+1;
      END;
      CREATE TRIGGER tasks_sync_insert AFTER INSERT ON tasks WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('tasks',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER tasks_sync_update AFTER UPDATE ON tasks WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0
        AND (old.title IS NOT new.title OR old.notes IS NOT new.notes OR old.due_date IS NOT new.due_date OR old.due_time IS NOT new.due_time OR old.priority IS NOT new.priority OR old.completed IS NOT new.completed OR old.completed_date IS NOT new.completed_date OR old.list_name IS NOT new.list_name OR old.subtasks IS NOT new.subtasks OR old.icon IS NOT new.icon OR old.color IS NOT new.color OR old.repeat_rule IS NOT new.repeat_rule OR old.repeat_days IS NOT new.repeat_days OR old.reminders IS NOT new.reminders) BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('tasks',new.id,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER tasks_sync_delete AFTER DELETE ON tasks WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('tasks',old.id,'delete') ON CONFLICT(entity,id) DO UPDATE SET operation='delete',revision=revision+1;
      END;
      CREATE TRIGGER preferences_sync_insert AFTER INSERT ON preferences WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 AND new.key NOT IN ('sampleDataSeeded') AND new.key NOT LIKE '%NotificationId' BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('preferences',new.key,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER preferences_sync_update AFTER UPDATE ON preferences WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 AND new.key NOT IN ('sampleDataSeeded') AND new.key NOT LIKE '%NotificationId' BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('preferences',new.key,'upsert') ON CONFLICT(entity,id) DO UPDATE SET operation='upsert',revision=revision+1;
      END;
      CREATE TRIGGER preferences_sync_delete AFTER DELETE ON preferences WHEN (SELECT importing FROM sync_runtime WHERE id=1)=0 AND old.key NOT IN ('sampleDataSeeded') AND old.key NOT LIKE '%NotificationId' BEGIN
        INSERT INTO sync_outbox(entity,id,operation) VALUES('preferences',old.key,'delete') ON CONFLICT(entity,id) DO UPDATE SET operation='delete',revision=revision+1;
      END;
      PRAGMA user_version = 8;
    `);
  }
  const prefs = await db.getFirstAsync<{ value: string }>("SELECT value FROM preferences WHERE key = 'profileName'");
  if (!prefs && !owner) await db.runAsync("INSERT INTO preferences (key, value) VALUES ('profileName', 'Friend')");
  const seeded = await db.getFirstAsync<{ value:string }>("SELECT value FROM preferences WHERE key = 'sampleDataSeeded'");
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM habits');
  if (!owner && !seeded && !row?.count) {
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
  if (!seeded && !owner) await db.runAsync("INSERT INTO preferences (key,value) VALUES ('sampleDataSeeded','true')");
  return db;
}
