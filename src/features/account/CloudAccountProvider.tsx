import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut, type User } from 'firebase/auth';
import { setDatabaseOwner } from '../../database/client';
import { firebaseConfigured, googleWebClientId, requireFirebase } from '../../services/firebase';
import { importGuestDataForNewAccount } from '../../services/accountBootstrap';
import { startCloudSync } from '../../services/cloudSync';
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
  syncNow: () => Promise<void>;
  setSyncStatus: (status: SyncStatus) => void;
  setSyncNow: (callback: (() => Promise<void>) | null) => void;
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

  const activate = useCallback(async (nextUser: User | null): Promise<void> => {
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

  const value = useMemo<AccountContextValue>(() => ({
    user, accountKey: user?.uid ?? 'guest', configured: firebaseConfigured, syncStatus,
    signInWithGoogle, signOutAccount, syncNow,
    setSyncStatus, setSyncNow,
  }), [user, syncStatus, signInWithGoogle, signOutAccount, syncNow, setSyncNow]);

  if (!ready) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas }}><ActivityIndicator color={palette.purple} /></View>;
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function CloudSyncBridge() {
  const { user, setSyncNow, setSyncStatus } = useCloudAccount();
  const { reload } = useHabitlyActions();
  const { ready } = useHabitlyStatus();
  useEffect(() => {
    if (!user || !ready) return;
    const session = startCloudSync(user.uid, reload, setSyncStatus);
    setSyncNow(session.sync);
    return () => { setSyncNow(null); session.stop(); };
  }, [user, ready, setSyncNow, setSyncStatus, reload]);
  return null;
}

export function useCloudAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error('Cloud account provider is missing.');
  return value;
}
