import { router } from 'expo-router';
import { Pressable, Share, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Screen } from '../../components/ui/Primitives';
import { useHabitlyEntries, useHabitlyHabits, useHabitlyTheme } from '../../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak } from '../../features/habits/domain';
import { BackHeader, StatTile } from '../../features/statistics/StatisticsUI';
import { palette } from '../../theme/tokens';
import { dateKey } from '../../utils/dates';

export default function StreakAchievement() {
  useHabitlyTheme();
  const habits = useHabitlyHabits();
  const entries = useHabitlyEntries();
  const ranked = habits.filter(habit => !habit.archived).map(habit => ({ habit, current: calculateStreak(habit, entries), longest: calculateLongestStreak(habit, entries) })).sort((a, b) => b.current - a.current || b.longest - a.longest);
  const best = ranked[0];
  const today = dateKey();
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); const key = dateKey(date); const done = best ? entries.some(entry => entry.habitId === best.habit.id && entry.date === key && entry.completed) : false; return { key, label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index], done }; });
  const current = best?.current ?? 0;
  const longest = Math.max(0, ...ranked.map(item => item.longest));
  return <Screen safeBottom style={{ paddingBottom: 24 }}>
    <BackHeader title="Your streak" onBack={() => router.back()} aside={<View style={{ flexDirection: 'row', gap: 7 }}><Pressable accessibilityRole="button" accessibilityLabel="Share your streak" onPress={() => void Share.share({ message: `I'm building better habits with Habitly. My current streak is ${current} days!` })} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}><MaterialCommunityIcons name="share-variant-outline" size={18} color={palette.ink} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Open achievements" onPress={() => router.push('/achievements')} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}><MaterialCommunityIcons name="trophy-outline" size={18} color={palette.ink} /></Pressable></View>} />
    <View style={{ alignItems: 'center', paddingVertical: 12, gap: 8 }}><MaterialCommunityIcons name="fire" size={90} color={palette.yellow} /><Text style={{ color: palette.ink, fontSize: 28, fontWeight: '800', textAlign: 'center' }}>{current} Day Streak!</Text><Text style={{ color: palette.muted, fontSize: 14, textAlign: 'center' }}>{current ? 'You’re showing up for yourself. Keep it going.' : 'Complete a scheduled habit today to begin your streak.'}</Text></View>
    {best && <Text style={{ color: palette.muted, fontSize: 12, textAlign: 'center' }}>Your strongest current streak is {best.habit.name}.</Text>}
    <Card style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 5 }}>{days.map((day, index) => <View key={`${day.key}-${index}`} style={{ alignItems: 'center', gap: 7 }}><View style={{ width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: day.done ? palette.purple : palette.purpleSoft }}><MaterialCommunityIcons name={day.done ? 'check' : 'circle-outline'} size={19} color={day.done ? palette.onPrimary : palette.muted} /></View><Text style={{ color: palette.muted, fontSize: 10 }}>{day.label}</Text></View>)}</Card>
    <View style={{ flexDirection: 'row', gap: 10 }}><StatTile icon="fire" value={String(current)} label="Current streak" accent={palette.yellow} /><StatTile icon="trophy-outline" value={String(longest)} label="Longest streak" accent={palette.yellow} /></View>
    {best ? <Card style={{ gap: 7 }}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{best.habit.name}</Text><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18 }}>Your current run counts scheduled days you completed in a row. Unscheduled rest days do not break it.</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/statistics/[id]', params: { id: best.habit.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 5 }}><Text style={{ color: palette.purple, fontSize: 13, fontWeight: '700' }}>View habit analytics</Text><MaterialCommunityIcons name="arrow-right" size={17} color={palette.purple} /></Pressable></Card> : <Card><Text style={{ color: palette.muted, fontSize: 13 }}>Add a habit and check in on its scheduled days to start building a streak.</Text></Card>}
    <Text style={{ color: palette.muted, fontSize: 11, textAlign: 'center' }}>Week of {new Date(`${today}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</Text>
  </Screen>;
}
