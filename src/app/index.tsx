import { Redirect } from 'expo-router';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { useHabitlyProfile, useHabitlyStatus, useHabitlyTheme } from '../features/app/AppProvider';
import { useCloudAccount } from '../features/account/CloudAccountProvider';
import { palette } from '../theme/tokens';
import { appRoute } from '../utils/routes';
function Loading({ message, retry }: { message?: string; retry?: () => void }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 28, backgroundColor: palette.canvas }}>
    <Image source={require('../../assets/images/habitly-mark.png')} accessibilityLabel="Habitly logo" style={{ width: 88, height: 88 }} resizeMode="contain" />
    {message ? <Text style={{ color: palette.ink, textAlign: 'center', fontSize: 14, lineHeight: 21 }}>{message}</Text> : <ActivityIndicator color={palette.purple} />}
    {retry && <Pressable accessibilityRole="button" onPress={retry} style={{ padding: 12 }}><Text style={{ color: palette.purple, fontWeight: '700' }}>Try syncing again</Text></Pressable>}
  </View>;
}

export default function Index() {
  useHabitlyTheme();
  const { ready } = useHabitlyStatus();
  const { onboardingComplete, onboardingDraft } = useHabitlyProfile();
  const account = useCloudAccount();
  if (!ready || (account.user && ['checking', 'syncing'].includes(account.syncStatus))) return <Loading />;
  if (account.user && !onboardingComplete && account.syncStatus !== 'synced') {
    return <Loading message="Connect to the internet to restore your account data." retry={() => void account.syncNow()} />;
  }
  const profileNeedsSetup = !onboardingDraft.ageRange || !onboardingDraft.discoverySource;
  return <Redirect href={appRoute(onboardingComplete && !profileNeedsSetup ? '/(tabs)/today' : '/welcome')} />;
}
