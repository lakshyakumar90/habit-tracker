import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { getDatabase } from '../database/client';
import { requireFirebase } from './firebase';

function withTimeout<T>(operation: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firebase did not respond in time.')), ms);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}

// Guest data is copied only for a new cloud account. Existing accounts always
// restore their own Firestore records and keep guest data in its separate file.
export async function importGuestDataForNewAccount(uid: string) {
  const { firestore } = requireFirebase();
  const owner = await getDatabase();
  const ownerCount = await owner.getFirstAsync<{ count: number }>('SELECT (SELECT COUNT(*) FROM habits) + (SELECT COUNT(*) FROM tasks) + (SELECT COUNT(*) FROM preferences) AS count');
  if (ownerCount?.count) return;
  const network = await NetInfo.fetch();
  if (!network.isConnected || network.isInternetReachable === false) return;

  for (const entity of ['habits', 'entries', 'tasks', 'preferences']) {
    const remote = await withTimeout(getDocsFromServer(collection(firestore, 'users', uid, entity)), 8_000);
    if (!remote.empty) return;
  }

  const guest = await SQLite.openDatabaseAsync('habitly.db');
  const habitRows = await guest.getAllAsync<Record<string, string | number | null>>('SELECT * FROM habits');
  const entryRows = await guest.getAllAsync<Record<string, string | number | null>>('SELECT * FROM habit_entries');
  const taskRows = await guest.getAllAsync<Record<string, string | number | null>>('SELECT * FROM tasks');
  const preferenceRows = await guest.getAllAsync<{ key: string; value: string }>("SELECT key,value FROM preferences WHERE key != 'sampleDataSeeded' AND key NOT LIKE '%NotificationId'");

  const copy = async (tx: SQLite.SQLiteDatabase, table: string, rows: Record<string, string | number | null>[], ignored: string[] = []) => {
    for (const row of rows) {
      const keys = Object.keys(row).filter(key => !ignored.includes(key));
      await tx.runAsync(`INSERT OR IGNORE INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`, ...keys.map(key => row[key]));
    }
  };
  await owner.withExclusiveTransactionAsync(async tx => {
    await copy(tx, 'habits', habitRows, ['notification_ids']);
    await copy(tx, 'habit_entries', entryRows);
    await copy(tx, 'tasks', taskRows, ['notification_id', 'notification_ids']);
    await copy(tx, 'preferences', preferenceRows);
  });
}
