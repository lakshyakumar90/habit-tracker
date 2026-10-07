import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Card, Header, Screen } from '../../components/ui/Primitives';
import { useHabitlyEntries, useHabitlyHabits, useHabitlyTheme } from '../../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak } from '../../features/habits/domain';
import { bestWeekday } from '../../features/statistics/calculations';
import { BarChart, StatTile } from '../../features/statistics/StatisticsUI';
import { summarizeOverall } from '../../features/statistics/analytics';
import { palette } from '../../theme/tokens';
import { appRoute } from '../../utils/routes';
import { addDays } from '../../utils/dates';

type Period = 'This Week' | 'This Month' | 'This Year';
const periods: Period[] = ['This Week', 'This Month', 'This Year'];
const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Stats() {
  useHabitlyTheme();
  const habits = useHabitlyHabits();
  const entries = useHabitlyEntries();
  const [period, setPeriod] = useState<Period>('This Month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const now = new Date(); now.setHours(12, 0, 0, 0);
  const todayTime = now.getTime();
  // All of the statistics crunching below walks every habit and entry, so keep
  // it memoized: without this the whole model recomputes on every render and
  // mounting this page blocks the UI thread (VirtualizedList slow updates).
  const { summary, streak, longest, total, durationLabel, best, bars, breakdown, totalDone } = useMemo(() => {
    const active = habits.filter(habit => !habit.archived);
    const today = new Date(todayTime);
    const start = period === 'This Week' ? addDays(today, -((today.getDay() + 6) % 7)) : period === 'This Year' ? new Date(today.getFullYear(), 0, 1, 12) : new Date(today.getFullYear(), today.getMonth(), 1, 12);
    const summary = summarizeOverall(active, entries, start, today);
    const streak = Math.max(0, ...active.map(habit => calculateStreak(habit, entries)));
    const longest = Math.max(0, ...active.map(habit => calculateLongestStreak(habit, entries)));
    const inPeriod = entries.filter(entry => entry.completed && entry.date >= start.toISOString().slice(0, 10) && entry.date <= today.toISOString().slice(0, 10));
    const total = inPeriod.length;
    const durationMinutes = active.filter(habit => habit.type === 'duration').reduce((sum, habit) => sum + inPeriod.filter(entry => entry.habitId === habit.id).reduce((value, entry) => value + entry.value * (habit.unit.toLowerCase().startsWith('hour') ? 60 : 1), 0), 0);
    const durationLabel = durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m` : `${durationMinutes}m`;
    const best = bestWeekday(active, entries);
    const bars = (() => {
      const count = period === 'This Week' ? 7 : period === 'This Month' ? Math.min(5, Math.ceil(today.getDate() / 7)) : today.getMonth() + 1;
      return Array.from({ length: count }, (_, index) => {
        const from = period === 'This Week' ? addDays(start, index) : period === 'This Month' ? addDays(start, index * 7) : new Date(today.getFullYear(), index, 1, 12);
        const to = period === 'This Week' ? from : period === 'This Month' ? addDays(from, 6) : new Date(today.getFullYear(), index + 1, 0, 12);
        const section = summarizeOverall(active, entries, from, to > today ? today : to);
        return { label: period === 'This Week' ? weekdayNames[from.getDay()] : period === 'This Month' ? `W${index + 1}` : from.toLocaleDateString('en', { month: 'short' }), value: section.rate };
      });
    })();
    const breakdown = active.map(habit => ({ habit, count: inPeriod.filter(entry => entry.habitId === habit.id).length })).filter(item => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);
    const totalDone = breakdown.reduce((sum, item) => sum + item.count, 0);
    return { summary, streak, longest, total, durationLabel, best, bars, breakdown, totalDone };
  }, [habits, entries, period, todayTime]);

  return <Screen safeBottom={false} style={{ paddingBottom: 118 }}>
    <Header title="Stats" subtitle="Track your progress and stay motivated." right={<Pressable accessibilityRole="button" onPress={() => setPeriodOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, borderRadius: 18, paddingHorizontal: 12, minHeight: 40 }}><Text style={{ color: palette.ink, fontSize: 12, fontWeight: '600' }}>{period}</Text><MaterialCommunityIcons name="chevron-down" size={17} color={palette.ink} /></Pressable>} />
    <View style={{ flexDirection: 'row', gap: 8 }}>{[
      { icon: 'fire', value: String(streak), label: 'Day streak', color: palette.yellow },
      { icon: 'check-circle-outline', value: `${summary.rate}%`, label: 'Completion', color: palette.purple },
      { icon: 'chart-bar', value: String(total), label: 'Habits done', color: palette.purple },
      { icon: 'clock-outline', value: durationLabel, label: 'Time spent', color: palette.purple },
    ].map(tile => <StatTile key={tile.label} {...tile} accent={tile.color} />)}</View>
    <Card style={{ gap: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>Consistency</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>Scheduled check-ins completed</Text></View><Text style={{ color: palette.ink, fontSize: 21, fontWeight: '800' }}>{summary.rate}%</Text></View><BarChart values={bars.map(bar => bar.value)} labels={bars.map(bar => bar.label)} /></Card>
    <View style={{ flexDirection: 'row', gap: 10 }}><Card style={{ flex: 1, gap: 6, backgroundColor: palette.yellowSoft }}><MaterialCommunityIcons name="trophy-outline" size={21} color={palette.yellow} /><Text style={{ color: palette.muted, fontSize: 11 }}>Best day</Text><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{best}</Text></Card><Card style={{ flex: 1, gap: 6 }}><MaterialCommunityIcons name="chart-box-outline" size={21} color={palette.purple} /><Text style={{ color: palette.muted, fontSize: 11 }}>Longest streak</Text><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{longest} days</Text></Card></View>
    <Card style={{ gap: 12 }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>Habit breakdown</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{totalDone} completions</Text></View>{breakdown.length ? breakdown.map(({ habit, count }) => <Pressable key={habit.id} accessibilityRole="button" onPress={() => router.push(appRoute({ pathname: '/statistics/[id]', params: { id: habit.id } }))} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 34 }}><Text style={{ width: 24, fontSize: 17 }}>{habit.icon}</Text><Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontSize: 13 }}>{habit.name}</Text><View style={{ width: 82, height: 7, backgroundColor: palette.surfaceSoft, borderRadius: 8, overflow: 'hidden' }}><View style={{ width: `${Math.round(count / Math.max(totalDone, 1) * 100)}%`, height: 7, backgroundColor: habit.color, borderRadius: 8 }} /></View><Text style={{ width: 32, textAlign: 'right', color: palette.muted, fontSize: 11 }}>{Math.round(count / Math.max(totalDone, 1) * 100)}%</Text></Pressable>) : <Text style={{ color: palette.muted, fontSize: 13 }}>Complete a habit to see its share of your progress.</Text>}</Card>
    <Text style={{ textAlign: 'center', color: palette.muted, fontSize: 11, lineHeight: 16 }}>Time totals use recorded duration values. “Longest streak” is the best run across your active habits.</Text>
    <ActionSheet visible={periodOpen} title="Stats period" subtitle="Choose the range for your summary" onClose={() => setPeriodOpen(false)} actions={periods.map(value => ({ label: value, icon: value === period ? 'check-circle' : 'calendar-blank-outline', onPress: () => setPeriod(value) }))} />
  </Screen>;
}
