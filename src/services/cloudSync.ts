import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import type * as SQLite from 'expo-sqlite';
import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, type DocumentData, type Firestore, type Unsubscribe } from 'firebase/firestore';
import { getDatabase } from '../database/client';
import { requireFirebase } from './firebase';
import { cancelEntityReminders } from './notifications';
import { reconcileDeviceReminders } from './deviceReminders';

const entities = ['habits', 'entries', 'tasks', 'preferences'] as const;
type Entity = typeof entities[number];
type OutboxRow = { entity: Entity; id: string; operation: 'upsert' | 'delete'; revision: number };
type Database = SQLite.SQLiteDatabase;
const table = { habits: 'habits', entries: 'habit_entries', tasks: 'tasks', preferences: 'preferences' } as const;
const columns: Record<Entity, string[]> = {
  habits: ['id', 'name', 'description', 'icon', 'color', 'type', 'difficulty', 'target', 'unit', 'schedule', 'reminder_at', 'archived', 'created_at'],
  entries: ['id', 'habit_id', 'entry_date', 'value', 'completed'],
  tasks: ['id', 'title', 'notes', 'due_date', 'due_time', 'priority', 'completed', 'completed_date', 'created_at', 'list_name', 'subtasks', 'icon', 'color', 'repeat_rule', 'repeat_days', 'reminders'],
  preferences: ['key', 'value'],
};

function isEntity(value: string): value is Entity { return entities.some(item => item === value); }
function cloudCollection(firestore: Firestore, uid: string, entity: Entity) {
  return collection(firestore, 'users', uid, entity);
}

export function startCloudSync(uid: string, onChange: () => Promise<void>, onStatus: (status: 'offline' | 'syncing' | 'synced' | 'error') => void) {
  const { firestore } = requireFirebase();
  let active = true;
  let online = false;
  let busy = false;
  let hydrated = false;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let listeners: Unsubscribe[] = [];
  const database = getDatabase();

  const applyRemote = async (db: Database, entity: Entity, id: string, data: DocumentData) => {
    if (!active) return;
    const pending = await db.getFirstAsync<{ revision: number }>('SELECT revision FROM sync_outbox WHERE entity=? AND id=?', entity, id);
    if (pending || !active) return;
    const current = await db.getFirstAsync<Record<string, string | number | null>>(`SELECT ${columns[entity].join(',')} FROM ${table[entity]} WHERE ${entity === 'preferences' ? 'key' : 'id'}=?`, id);
    const incoming = data.payload as Record<string, unknown> | undefined;
    if (data.deleted !== true && (!incoming || columns[entity].some(column => {
      const value = incoming[column];
      return value === undefined || (value !== null && !['string', 'number', 'boolean'].includes(typeof value));
    }))) return;
    if (data.deleted === true ? !current : current && incoming && columns[entity].every(column => current[column] === incoming[column])) return;
    if (current && (entity === 'habits' || entity === 'tasks')) {
      try { await cancelEntityReminders(id); } catch { /* Remote changes still apply if OS cleanup fails. */ }
    }
    await db.withExclusiveTransactionAsync(async tx => {
      const stillPending = await tx.getFirstAsync<{ revision: number }>('SELECT revision FROM sync_outbox WHERE entity=? AND id=?', entity, id);
      if (stillPending || !active) return;
      await tx.runAsync('UPDATE sync_runtime SET importing=1 WHERE id=1');
      try {
        if (data.deleted === true) {
          await tx.runAsync(`DELETE FROM ${table[entity]} WHERE ${entity === 'preferences' ? 'key' : 'id'}=?`, id);
        } else if (data.payload && typeof data.payload === 'object') {
          const values = columns[entity].map(column => column === (entity === 'preferences' ? 'key' : 'id') ? id : data.payload[column]);
          if (values.some(value => value === undefined || (value !== null && !['string', 'number', 'boolean'].includes(typeof value)))) return;
          const placeholders = columns[entity].map(() => '?').join(',');
          const updates = columns[entity].filter(column => column !== (entity === 'preferences' ? 'key' : 'id')).map(column => `${column}=excluded.${column}`).join(',');
          await tx.runAsync(`INSERT INTO ${table[entity]} (${columns[entity].join(',')}) VALUES (${placeholders}) ON CONFLICT(${entity === 'preferences' ? 'key' : 'id'}) DO UPDATE SET ${updates}`, ...values);
          if (entity === 'habits') await tx.runAsync('UPDATE habits SET notification_ids=? WHERE id=?', '[]', id);
          if (entity === 'tasks') await tx.runAsync('UPDATE tasks SET notification_id=NULL, notification_ids=? WHERE id=?', '[]', id);
        }
      } finally {
        await tx.runAsync('UPDATE sync_runtime SET importing=0 WHERE id=1');
      }
    });
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => { refreshTimer = null; if (active) { void onChange(); void reconcileDeviceReminders(uid); } }, 80);
  };

  const flush = async (db: Database) => {
    const rows = await db.getAllAsync<OutboxRow>('SELECT entity,id,operation,revision FROM sync_outbox ORDER BY CASE entity WHEN \'habits\' THEN 0 WHEN \'entries\' THEN 1 ELSE 2 END, revision');
    for (const row of rows) {
      if (!active || !online || !isEntity(row.entity)) return;
      const raw = row.operation === 'upsert'
        ? await db.getFirstAsync<Record<string, string | number | null>>(`SELECT ${columns[row.entity].join(',')} FROM ${table[row.entity]} WHERE ${row.entity === 'preferences' ? 'key' : 'id'}=?`, row.id)
        : null;
      // A delete after a queued update must remain a tombstone in the cloud.
      await setDoc(doc(cloudCollection(firestore, uid, row.entity), row.id), {
        deleted: !raw,
        ...(raw ? { payload: raw } : {}),
        updatedAt: serverTimestamp(),
      });
      await db.runAsync('DELETE FROM sync_outbox WHERE entity=? AND id=? AND revision=?', row.entity, row.id, row.revision);
    }
  };

  const pull = async (db: Database) => {
    for (const entity of entities) {
      if (!active || !online) return;
      const snapshot = await getDocs(cloudCollection(firestore, uid, entity));
      for (const item of snapshot.docs) await applyRemote(db, entity, item.id, item.data());
    }
  };

  const sync = async () => {
    if (!active || !online || busy) return;
    busy = true;
    onStatus('syncing');
    try {
      const db = await database;
      // Upload pending local edits first. A remote snapshot cannot overwrite them.
      await flush(db);
      if (!hydrated) { await pull(db); hydrated = true; }
      await flush(db);
      if (active) await onChange();
      if (active) void reconcileDeviceReminders(uid);
      if (!listeners.length && active) {
        listeners = entities.map(entity => onSnapshot(cloudCollection(firestore, uid, entity), snapshot => {
          void (async () => {
            for (const change of snapshot.docChanges()) await applyRemote(db, entity, change.doc.id, change.doc.data());
          })().catch(() => onStatus('error'));
        }, () => onStatus('error')));
      }
      if (active) onStatus('synced');
    } catch { if (active) onStatus('error'); }
    finally { busy = false; }
  };

  const networkSubscription = NetInfo.addEventListener(state => {
    online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online) void sync(); else onStatus('offline');
  });
  const appSubscription = AppState.addEventListener('change', state => { if (state === 'active') void sync(); });
  const timer = setInterval(() => { void sync(); }, 12_000);

  return {
    sync: () => sync(),
    stop: () => {
      active = false;
      clearInterval(timer);
      if (refreshTimer) clearTimeout(refreshTimer);
      networkSubscription();
      appSubscription.remove();
      listeners.forEach(unsubscribe => unsubscribe());
      listeners = [];
    },
  };
}
