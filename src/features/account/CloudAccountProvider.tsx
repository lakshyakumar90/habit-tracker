import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, reauthenticateWithPopup, signInWithCredential, signInWithPopup, signOut, type User } from 'firebase/auth';
import { getDatabase, setDatabaseOwner } from '../../database/client';
import { firebaseConfigured, googleWebClientId, requireFirebase } from '../../services/firebase';
import { importGuestDataForNewAccount } from '../../services/accountBootstrap';
import { startCloudSync } from '../../services/cloudSync';
import { deleteSyncedAccountData } from '../../services/accountDeletion';
import { cancelAllReminders } from '../../services/notifications';
import { reconcileDeviceReminders, suspendDeviceReminders } from '../../services/deviceReminders';
import { useHabitlyActions, useHabitlyStatus } from '../app/AppProvider';
import { palette } from '../../theme/tokens';

type SyncStatus = 'guest' | 'checking' | 'offline' | 'syncing' | 'synced' | 'error';
type AccountContextValue = {
  user: User | null;
  accountKey: string;
  configured: boolean;
  syncStatus: SyncStatus;
  signInWithGoogle: () => Promise<void>;
  signOutAccount: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncNow: () => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  setSyncNow: (callback: (() => Promise<void>) | null) => void;
  setSyncStop: (callback: (() => void) | null) => void;
  syncEpoch: number;
};
const AccountContext = createContext<AccountContextValue | null>(null);

export function CloudAccountProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!firebaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('guest');
  const syncCallback = useRef<(() => Promise<void>) | null>(null);
  const setSyncNow = useCallback((callback: (() => Promise<void>) | null) => { syncCallback.current = callback; }, []);
  const syncNow = useCallback(() => syncCallback.current?.() ?? Promise.resolve(), []);
  const activated = useRef<string | null>(null);
  const booted = useRef(false);
  const activation = useRef<Promise<void> | null>(null);
  const syncStop = useRef<(() => void) | null>(null);
  const deleting = useRef(false);
  const [syncEpoch, setSyncEpoch] = useState(0);
  const setSyncStop = useCallback((callback: (() => void) | null) => { syncStop.current = callback; }, []);

  const activate = useCallback(async (nextUser: User | null): Promise<void> => {
    if (deleting.current && !nextUser) return;
    const nextKey = nextUser?.uid ?? null;
    if (activation.current) await activation.current;
    if (activated.current === nextKey && booted.current) return Promise.resolve();
    const work = (async () => {
      setReady(false);
      if (booted.current || nextKey) {
        try { await suspendDeviceReminders(); } catch { /* Continue switching accounts if OS cleanup fails. */ }
      }
      setDatabaseOwner(nextKey);
      if (nextKey) {
        try { await importGuestDataForNewAccount(nextKey); } catch { /* Offline sign-in still opens the account's local database. */ }
      }
      activated.current = nextKey;
      booted.current = true;
      setUser(nextUser);
      setSyncStatus(nextKey ? 'checking' : 'guest');
      setReady(true);
      if (!nextKey) void reconcileDeviceReminders(null);
    })();
    activation.current = work;
    try { await work; }
    finally { activation.current = null; setReady(true); }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const { auth } = requireFirebase();
    return onAuthStateChanged(auth, nextUser => { void activate(nextUser); }, () => { void activate(null); });
  }, [activate]);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = requireFirebase();
    if (Platform.OS === 'web') {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await activate(result.user);
      return;
    }
    if (!googleWebClientId) throw new Error('Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID before using Google sign-in.');
    let google: typeof import('@react-native-google-signin/google-signin');
    try { google = await import('@react-native-google-signin/google-signin'); }
    catch { throw new Error('Google sign-in needs a new development or production build. Expo Go cannot run this native module.'); }
    google.GoogleSignin.configure({ webClientId: googleWebClientId });
    await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await google.GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) throw new Error('Google did not return an ID token. Check the OAuth client and signing fingerprints.');
    const signedIn = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    await activate(signedIn.user);
  }, [activate]);

  const signOutAccount = useCallback(async () => {
    if (!firebaseConfigured) return;
    await signOut(requireFirebase().auth);
    await activate(null);
    if (Platform.OS !== 'web') {
      try { const { GoogleSignin } = await import('@react-native-google-signin/google-signin'); await GoogleSignin.signOut(); } catch { /* Firebase session is already closed. */ }
    }
  }, [activate]);

  const deleteAccount = useCallback(async () => {
    const current = requireFirebase().auth.currentUser;
    if (!current) throw new Error('Sign in before deleting your account.');
    const token = await current.getIdTokenResult();
    const signedInAt = new Date(token.authTime).getTime();
    if (!Number.isFinite(signedInAt) || Date.now() - signedInAt > 4 * 60_000) {
      if (Platform.OS === 'web') {
        await reauthenticateWithPopup(current, new GoogleAuthProvider());
      } else {
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        GoogleSignin.configure({ webClientId: googleWebClientId });
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result = await GoogleSignin.signIn();
        const idToken = result.data?.idToken;
        if (!idToken) throw new Error('Google did not return a fresh sign-in token.');
        await reauthenticateWithCredential(current, GoogleAuthProvider.credential(idToken));
      }
    }
    deleting.current = true;
    syncStop.current?.();
    syncStop.current = null;
    try {
      const local = await getDatabase();
      await deleteSyncedAccountData();
      try { await cancelAllReminders(); } catch { /* Account deletion has already succeeded. */ }
      let localCleared = false;
      try {
        await local.execAsync('DELETE FROM habit_entries; DELETE FROM habits; DELETE FROM tasks; DELETE FROM preferences; DELETE FROM sync_outbox;');
        localCleared = true;
        await local.closeAsync();
        await SQLite.deleteDatabaseAsync(`habitly-${current.uid}.db`);
      } catch { /* Cleared rows are sufficient if Android still holds the SQLite file. */ }
      await signOut(requireFirebase().auth);
      deleting.current = false;
      await activate(null);
      if (Platform.OS !== 'web') {
        try { const { GoogleSignin } = await import('@react-native-google-signin/google-signin'); await GoogleSignin.signOut(); } catch { /* Firebase account is deleted. */ }
      }
      if (!localCleared) throw new Error('Your cloud account was deleted, but local data could not be cleared. Clear Habitly app storage on this device.');
    } catch (error) {
      deleting.current = false;
      setSyncEpoch(value => value + 1);
      throw error;
    }
  }, [activate]);

  const value = useMemo<AccountContextValue>(() => ({
    user, accountKey: user?.uid ?? 'guest', configured: firebaseConfigured, syncStatus,
    signInWithGoogle, signOutAccount, deleteAccount, syncNow,
    setSyncStatus, setSyncNow, setSyncStop, syncEpoch,
  }), [user, syncStatus, signInWithGoogle, signOutAccount, deleteAccount, syncNow, setSyncNow, setSyncStop, syncEpoch]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }}><ActivityIndicator color={palette.purple} /></View>;
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function CloudSyncBridge() {
  const { user, setSyncNow, setSyncStop, setSyncStatus, syncEpoch } = useCloudAccount();
  const { reload } = useHabitlyActions();
  const { ready } = useHabitlyStatus();
  useEffect(() => {
    if (!user || !ready) return;
    const session = startCloudSync(user.uid, reload, setSyncStatus);
    setSyncNow(session.sync);
    setSyncStop(session.stop);
    return () => { setSyncNow(null); setSyncStop(null); session.stop(); };
  }, [user, ready, setSyncNow, setSyncStop, setSyncStatus, reload, syncEpoch]);
  return null;
}

export function useCloudAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error('Cloud account provider is missing.');
  return value;
}
