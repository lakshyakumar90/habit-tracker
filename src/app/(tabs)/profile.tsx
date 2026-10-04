import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Header, IconButton, Screen } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { calculateStreak, scheduledCompletionRate } from '../../features/habits/domain';
import { palette } from '../../theme/tokens';
import { appRoute } from '../../utils/routes';

export default function Profile() {
  const { profileName, habits, entries } = useHabitly();
  const [expanded, setExpanded] = useState(false);
  const active = habits.filter(habit => !habit.archived);
  const streak = Math.max(0, ...active.map(habit => calculateStreak(habit, entries)));
  const completion = active.length ? Math.round(active.reduce((sum, habit) => sum + scheduledCompletionRate(habit, entries), 0) / active.length) : 0;
  const rows = [
    { icon: 'trophy-outline', title: 'Achievements', subtitle: 'Celebrate your progress', action: () => router.push('/achievements') },
    { icon: 'target', title: 'My goals', subtitle: 'Review your consistency', action: () => router.push('/(tabs)/stats') },
    { icon: 'shape-outline', title: 'Your habits', subtitle: 'Review and edit your routines', action: () => router.push('/(tabs)/habits') },
    { icon: 'bell-outline', title: 'Reminders', subtitle: 'Manage your notifications', action: () => router.push('/settings') },
    { icon: 'database-outline', title: 'Data & backup', subtitle: 'Keep your data safe', action: () => router.push('/settings') },
    { icon: 'theme-light-dark', title: 'Appearance', subtitle: 'Light and dark mode', action: () => router.push('/settings') },
    { icon: 'information-outline', title: 'About Habitly', subtitle: 'Support and app information', action: () => setExpanded(value => !value) },
  ];
  return <Screen safeBottom={false} style={{ paddingBottom: 112 }}>
    <Header title="Profile" subtitle="Your journey, your growth." right={<IconButton icon="cog-outline" accessibilityLabel="Open settings" onPress={() => router.push(appRoute('/settings'))} />} />
    <Pressable accessibilityRole="button" onPress={() => router.push(appRoute('/settings'))} style={{ borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, minHeight: 112, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="account" size={43} color={palette.purple} /></View>
      <View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 21, fontWeight: '800' }}>{profileName}</Text><Text style={{ color: palette.muted, fontSize: 13, marginTop: 4 }}>Stay consistent, stay stronger 💪</Text></View>
      <View style={{ width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceSoft }}><MaterialCommunityIcons name="pencil-outline" size={17} color={palette.ink} /></View>
    </Pressable>
    <Card style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 17, gap: 4 }}><ProfileMetric icon="fire" value={String(streak)} label="Day streak" color={palette.yellow} /><View style={{ width: 1, height: 45, backgroundColor: palette.line }} /><ProfileMetric icon="trophy-outline" value={String(active.length)} label="Total habits" color={palette.yellow} /><View style={{ width: 1, height: 45, backgroundColor: palette.line }} /><ProfileMetric icon="chart-bar" value={`${completion}%`} label="Completion" color={palette.purple} /></Card>
    <View style={{ borderRadius: 19, backgroundColor: palette.purpleSoft, padding: 19, flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}><MaterialCommunityIcons name="format-quote-open" size={24} color={palette.purple} /><Text style={{ flex: 1, color: palette.ink, fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' }}>Small steps every day lead to big results.</Text></View>
    <Card style={{ paddingVertical: 4, gap: 0 }}>{rows.map((row, index) => <Pressable key={row.title} accessibilityRole="button" onPress={row.action} style={{ minHeight: 63, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: index === rows.length - 1 ? 0 : 1, borderColor: palette.line }}><View style={{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name={row.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={palette.purple} /></View><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 14, fontWeight: '600' }}>{row.title}</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>{row.subtitle}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} /></Pressable>)}</Card>
    {expanded && <Card><Text style={{ color: palette.ink, fontWeight: '700' }}>Habitly · Version 1.0.0</Text><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>Your habits are stored locally on this device. Account sync is not connected yet.</Text></Card>}
  </Screen>;
}

function ProfileMetric({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return <View style={{ flex: 1, alignItems: 'center', gap: 4 }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={color} /><Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800' }}>{value}</Text><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 10 }}>{label}</Text></View>;
}
