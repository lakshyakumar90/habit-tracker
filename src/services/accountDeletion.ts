import { requireFirebase } from './firebase';

export async function deleteSyncedAccountData() {
  const { auth } = requireFirebase();
  const token = await auth.currentUser?.getIdToken(true);
  if (!token) throw new Error('Sign in before deleting your account.');
  const response = await fetch('https://www.lakshyakumar.in/api/habitly/delete-account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({})) as { deleted?: boolean; error?: string };
  if (!response.ok || !result.deleted) throw new Error(result.error || 'Account deletion was not confirmed by the server.');
}
