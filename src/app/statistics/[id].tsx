import { useLocalSearchParams, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Card, Screen } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { HabitForm } from '../../features/habits/HabitForm';
import { calculateLongestStreak, calculateStreak } from '../../features/habits/domain';
import { RANGE_OPTIONS, type RangeKey, summarizeHabit } from '../../features/statistics/analytics';
import { BackHeader, BarChart, HabitPicker, RangeSelector, StatTile } from '../../features/statistics/StatisticsUI';
import { palette } from '../../theme/tokens';
import { appRoute } from '../../utils/routes';

export default function HabitAnalytics() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, entries } = useHabitly();
  const [range, setRange] = useState<RangeKey>('30 Days');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const habit = habits.find(item => item.id === id);
  const stats = useMemo(() => habit ? summarizeHabit(habit, entries, range) : null, [habit, entries, range]);
  if (!habit || !stats) return <Screen><BackHeader title="Habit analytics" onBack={() => router.back()} /><Card><Text style={{ color: palette.ink, fontWeight: '700' }}>Habit not found</Text><Text style={{ color: palette.muted, marginTop: 5 }}>It may have been deleted.</Text></Card></Screen>;
  const completionTimeLabels = ['6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];
  const timeLabel = habit.type === 'duration' ? `${stats.totalTime} ${habit.unit}` : '—';
  return <>
    <Screen safeBottom style={{ paddingBottom: 24 }}>
      <BackHeader title="Habit Analytics" onBack={() => router.back()} aside={<HabitPicker name={habit.name} onPress={() => setPickerOpen(true)} />} />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 }}><View style={{ width: 56, height: 56, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><Text style={{ fontSize: 28 }}>{habit.icon}</Text></View><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>{habit.name}</Text><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>{habit.description || `Scheduled ${habit.schedule.length} days per week`}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Edit habit" onPress={() => setEditOpen(true)} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name="pencil-outline" size={19} color={palette.purple} /></Pressable></Card>
      <RangeSelector value={range} options={RANGE_OPTIONS} onChange={value => setRange(value as RangeKey)} />
      <View style={{ flexDirection: 'row', gap: 8 }}><StatTile icon="fire" value={`${calculateStreak(habit, entries)}`} label="Current streak" accent={palette.yellow} /><StatTile icon="trophy-outline" value={`${calculateLongestStreak(habit, entries)}`} label="Longest streak" accent={palette.yellow} /><StatTile icon="chart-donut" value={`${stats.rate}%`} label="Completion rate" /><StatTile icon="clock-outline" value={timeLabel} label="Total time" /></View>
      <Card style={{ gap: 7 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>Completion trend</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>{stats.done} of {stats.scheduled} scheduled check-ins</Text></View><Text style={{ color: palette.purple, fontWeight: '800', fontSize: 17 }}>{stats.rate}%</Text></View><BarChart values={stats.trend.map(item => item.value)} labels={stats.trend.map(item => item.label)} /></Card>
      <Card style={{ gap: 8 }}><View><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>Time spent</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>{range}</Text></View>{habit.type === 'duration' ? <><Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800' }}>{stats.totalTime} {habit.unit}</Text><BarChart values={stats.trend.map(item => item.duration)} labels={stats.trend.map(item => item.label)} color={habit.color} /></> : <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>This habit tracks {habit.type === 'boolean' ? 'yes or no completion' : habit.type}. Time totals are available for duration habits.</Text>}</Card>
      <Card style={{ gap: 9 }}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>Completion time</Text><Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19 }}>Entries store the day and result, but not the time of completion. A time-of-day chart will be available after timestamped logging is added.</Text><View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 42 }}>{completionTimeLabels.map(label => <View key={label} style={{ flex: 1, height: 7, borderRadius: 4, backgroundColor: palette.surfaceSoft }} />)}</View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{completionTimeLabels.filter((_, index) => index % 2 === 0).map(label => <Text key={label} style={{ color: palette.muted, fontSize: 9 }}>{label}</Text>)}</View></Card>
      <Pressable accessibilityRole="button" onPress={() => router.push(appRoute({ pathname: '/statistics/history/[id]', params: { id: habit.id } }))} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name="calendar-month-outline" size={18} color={palette.purple} /><Text style={{ color: palette.purple, fontWeight: '700' }}>Open habit history</Text></Pressable>
    </Screen>
    <ActionSheet visible={pickerOpen} title="Choose a habit" onClose={() => setPickerOpen(false)} actions={habits.filter(item => !item.archived).map(item => ({ label: item.name, icon: item.id === habit.id ? 'check-circle' : 'circle-outline', onPress: () => router.replace(appRoute({ pathname: '/statistics/[id]', params: { id: item.id } })) }))} />
    <HabitForm visible={editOpen} habit={habit} onClose={() => setEditOpen(false)} />
  </>;
}
