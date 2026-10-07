import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card, Screen } from '../components/ui/Primitives';
import { useHabitlyEntries, useHabitlyHabits, useHabitlyTheme } from '../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak } from '../features/habits/domain';
import type { HabitEntry } from '../features/habits/types';
import { BackHeader } from '../features/statistics/StatisticsUI';
import { palette } from '../theme/tokens';

export default function Achievements() {
  useHabitlyTheme();
  const habits = useHabitlyHabits();
  const entries = useHabitlyEntries();
  const completedCount = entries.filter(entry => entry.completed).length;
  const longestStreak = Math.max(0, ...habits.map(habit => calculateLongestStreak(habit, entries)));
  const currentStreak = Math.max(0, ...habits.filter(habit => !habit.archived).map(habit => calculateStreak(habit, entries)));
  const badges = [
    { id: 'first-habit', icon: 'sprout', name: 'First Habit', detail: 'Create your first routine', current: habits.length, target: 1, color: palette.success },
    { id: 'seven-completions', icon: 'fire', name: '7 Check-ins', detail: 'Complete seven scheduled check-ins', current: completedCount, target: 7, color: palette.yellow },
    { id: 'seven-streak', icon: 'target', name: 'Consistency', detail: 'Reach a 7 day streak', current: longestStreak, target: 7, color: palette.purple },
    { id: 'ten-habits', icon: 'view-grid-outline', name: 'Habit Collector', detail: 'Create ten habits', current: habits.length, target: 10, color: '#4B9BCB' },
    { id: 'hundred-checkins', icon: 'chart-bar', name: '100 Check-ins', detail: 'Complete one hundred habits', current: completedCount, target: 100, color: '#DE8295' },
    { id: 'thirty-streak', icon: 'calendar-star', name: '30 Day Streak', detail: 'Reach a 30 day streak', current: longestStreak, target: 30, color: palette.purple },
  ];
  return <Screen safeBottom style={{ paddingBottom: 24 }}>
    <BackHeader title="Achievements" onBack={() => router.back()} />
    <View><Text style={{ color: palette.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>Achievements</Text><Text style={{ color: palette.muted, fontSize: 14, marginTop: 3 }}>Celebrate your progress.</Text></View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/achievements/streak')} style={{ borderRadius: 23, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, padding: 17, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.yellowSoft }}><MaterialCommunityIcons name="fire" size={35} color={palette.yellow} /></View><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>{currentStreak ? `${currentStreak} Day Streak!` : 'Your first streak starts today'}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>{currentStreak ? 'You’re building a great routine.' : 'Complete a scheduled habit to begin.'}</Text></View><MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} /></View>
      <WeekMarks entries={entries} />
    </Pressable>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}><Text style={{ color: palette.ink, fontSize: 18, fontWeight: '700' }}>Your badges</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{badges.filter(badge => badge.current >= badge.target).length} of {badges.length} unlocked</Text></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{badges.map(badge => { const unlocked = badge.current >= badge.target; return <View key={badge.id} style={{ width: '48%', flexGrow: 1, minHeight: 132, borderRadius: 20, padding: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, gap: 5, opacity: unlocked ? 1 : .75 }}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: unlocked ? `${badge.color}25` : palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={unlocked ? badge.icon as keyof typeof MaterialCommunityIcons.glyphMap : 'lock-outline'} size={25} color={unlocked ? badge.color : palette.muted} /></View><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{badge.name}</Text><Text style={{ color: palette.muted, fontSize: 10, textAlign: 'center' }}>{unlocked ? 'Unlocked' : badge.detail}</Text>{!unlocked && <Text style={{ color: palette.muted, fontSize: 9 }}>{badge.current} / {badge.target}</Text>}</View>; })}</View>
    <Card style={{ padding: 0, overflow: 'hidden' }}><View style={{ paddingHorizontal: 15, paddingTop: 14, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>Milestones</Text><Text style={{ color: palette.muted, fontSize: 11 }}>From your history</Text></View>{entries.filter(entry => entry.completed).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(entry => { const habit = habits.find(item => item.id === entry.habitId); return <View key={entry.id} style={{ minHeight: 51, marginHorizontal: 15, borderTopWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="check-decagram" size={20} color={palette.purple} /><Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontSize: 12, fontWeight: '600' }}>{habit?.name ?? 'Habit'} completed</Text><Text style={{ color: palette.muted, fontSize: 10 }}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</Text></View>; })}{!entries.some(entry => entry.completed) && <Text style={{ padding: 15, color: palette.muted, fontSize: 12 }}>Completed check-ins will appear here.</Text>}</Card>
  </Screen>;
}

function WeekMarks({ entries }: { entries: HabitEntry[] }) {
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(start); day.setDate(start.getDate() + index); const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; return { label: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index], done: entries.some(entry => entry.date === key && entry.completed) }; });
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>{days.map((day, index) => <View key={`${day.label}-${index}`} style={{ alignItems: 'center', gap: 4 }}><View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: day.done ? palette.purple : palette.purpleSoft }}><MaterialCommunityIcons name={day.done ? 'check' : 'circle-outline'} size={18} color={day.done ? palette.onPrimary : palette.muted} /></View><Text style={{ color: palette.muted, fontSize: 10 }}>{day.label}</Text></View>)}</View>;
}
