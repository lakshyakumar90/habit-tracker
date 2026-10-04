import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { TimeDialog } from '../../components/ui/DateTimeDialogs';
import { HabitForm } from '../../features/habits/HabitForm';
import { useHabitly } from '../../features/app/AppProvider';
import { calculateLongestStreak, calculateStreak, heatmapLevel, isScheduledOn } from '../../features/habits/domain';
import type { Habit, HabitEntry } from '../../features/habits/types';
import { palette } from '../../theme/tokens';
import { addDays, dateKey } from '../../utils/dates';

type DetailTab = 'Overview' | 'History' | 'Insights';
type ChartRange = 'Weekly' | 'Monthly';

const TABS: DetailTab[] = ['Overview', 'History', 'Insights'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const CALENDAR_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, entries, setEntry, saveHabit, archiveHabit, deleteHabit, resolvedTheme } = useHabitly();
  const habit = habits.find(item => item.id === id);
  const today = dateKey();
  const [tab, setTab] = useState<DetailTab>('Overview');
  const [month, setMonth] = useState(() => monthStart(new Date(`${today}T12:00:00`)));
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [chartRange, setChartRange] = useState<ChartRange>('Weekly');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const focusProgress = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    // Reanimated values are intentionally reset when the detail route regains focus.
    // eslint-disable-next-line react-hooks/immutability
    focusProgress.value = 0;
    focusProgress.value = withTiming(1, { duration: 200 });
    return () => {};
  }, [focusProgress]));
  const entranceStyle = useAnimatedStyle(() => ({ opacity: focusProgress.value, transform: [{ translateY: (1 - focusProgress.value) * 8 }] }));

  const calendar = useMemo(() => habit ? monthDays(month, habit, entries, today) : [], [month, habit, entries, today]);
  const recentActivity = useMemo(() => habit ? recentDates(month, habit, entries, today) : [], [month, habit, entries, today]);
  const last30 = useMemo(() => habit ? measureLast30Days(habit, entries, today) : emptyMonthMetrics(), [habit, entries, today]);
  const trends = useMemo(() => habit ? getTrend(habit, entries, chartRange, today) : [], [habit, entries, chartRange, today]);
  const week = useMemo(() => {
    const current = new Date(`${today}T12:00:00`);
    const monday = addDays(current, -((current.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [today]);
  const weekMetrics = useMemo(() => habit ? measureRange(habit, entries, dateKey(week[0]), today) : { completed: 0, scheduled: 0, rate: 0 }, [habit, entries, week, today]);
  const habitEntryMap = useMemo(() => new Map(entries.filter(entry => entry.habitId === id).map(entry => [entry.date, entry])), [entries, id]);

  if (!habit) {
    return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas, padding: 24 }}>
      <MaterialCommunityIcons name="sprout-outline" size={36} color={palette.purple} />
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '700', marginTop: 12 }}>Habit not found</Text>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 14 }}><Text style={{ color: palette.purple, fontWeight: '700' }}>Go back</Text></Pressable>
    </SafeAreaView>;
  }

  const activeToday = !habit.archived && isScheduledOn(habit, new Date(`${today}T12:00:00`));
  const todayEntry = habitEntryMap.get(today);
  const createdOn = habit.createdAt.slice(0, 10);
  const completedToday = Boolean(todayEntry?.completed);
  const streak = calculateStreak(habit, entries);
  const longestStreak = calculateLongestStreak(habit, entries);
  const saveDate = (date: string) => {
    if (date < createdOn || date > today || !habit.schedule.includes(new Date(`${date}T12:00:00`).getDay())) return;
    const completed = habitEntryMap.get(date)?.completed ?? false;
    void Haptics.selectionAsync();
    void setEntry(habit, completed ? 0 : habit.target, date);
  };
  const updateReminder = async (time: string | null) => {
    const error = await saveHabit({
      name: habit.name, description: habit.description ?? '', icon: habit.icon, color: habit.color, type: habit.type,
      difficulty: habit.difficulty ?? 'easy', target: habit.target, unit: habit.unit, schedule: habit.schedule,
      reminderAt: time, notificationIds: [],
    }, habit.id);
    if (error) setFeedback(`Your habit was saved, but the reminder could not be scheduled: ${error}`);
  };
  const changeMonth = (amount: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return <View style={{ flex: 1, backgroundColor: palette.canvas, overflow: 'hidden' }}>
    <DetailBackdrop />
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 5, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <HeaderAction icon="arrow-left" label="Go back" onPress={() => router.back()} />
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: palette.ink, fontSize: 18, fontWeight: '700' }}>{habit.name}</Text>
        <HeaderAction icon="pencil-outline" label="Edit habit" onPress={() => setShowForm(true)} />
        <HeaderAction icon="dots-horizontal" label="More habit actions" onPress={() => setShowActions(true)} />
      </View>

      <View style={{ marginHorizontal: 18, marginBottom: 4, flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: palette.surfaceSoft }}>
        {TABS.map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: tab === value }} onPress={() => setTab(value)} style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: tab === value ? palette.purpleSoft : 'transparent' }}><Text style={{ color: tab === value ? palette.purple : palette.muted, fontSize: 13, fontWeight: tab === value ? '700' : '600' }}>{value}</Text></Pressable>)}
      </View>

      <Animated.ScrollView style={[{ flex: 1 }, entranceStyle]} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, gap: 15 }} showsVerticalScrollIndicator={false}>
        {tab === 'Overview' && <OverviewView habit={habit} entries={entries} week={week} today={today} weekMetrics={weekMetrics} streak={streak} longestStreak={longestStreak} todayEntry={todayEntry} activeToday={activeToday} resolvedTheme={resolvedTheme} onDate={saveDate} onEdit={() => setShowForm(true)} onReminder={() => setTimeOpen(true)} onReminderOff={() => void updateReminder(null)} />}
        {tab === 'History' && <HistoryView habit={habit} entries={entries} month={month} calendar={calendar} recent={recentActivity} showAll={showAllActivity} onToggleAll={() => setShowAllActivity(value => !value)} onMonth={changeMonth} onDate={saveDate} today={today} />}
        {tab === 'Insights' && <InsightsView habit={habit} metrics={last30} trends={trends} range={chartRange} onRange={() => setRangeOpen(true)} />}
      </Animated.ScrollView>

      {tab === 'Overview' && <View style={{ paddingHorizontal: 18, paddingTop: 7, paddingBottom: 7 }}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completedToday, disabled: !activeToday }} accessibilityLabel={completedToday ? 'Mark habit incomplete today' : 'Mark habit completed today'} disabled={!activeToday} onPress={() => saveDate(today)} style={({ pressed }) => ({ minHeight: 54, borderRadius: 28, backgroundColor: activeToday ? (resolvedTheme === 'dark' ? palette.purpleSoft : '#19181D') : palette.surfaceSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: pressed ? 0.91 : 1 })}>
        <MaterialCommunityIcons name={completedToday ? 'check-circle-outline' : 'play-outline'} size={20} color={activeToday ? (resolvedTheme === 'dark' ? palette.onPrimary : '#FFFFFF') : palette.muted} />
        <Text style={{ color: activeToday ? (resolvedTheme === 'dark' ? palette.onPrimary : '#FFFFFF') : palette.muted, fontSize: 15, fontWeight: '700' }}>{completedToday ? 'Completed today' : activeToday ? 'Mark as Completed' : habit.archived ? 'Habit archived' : 'Rest day today'}</Text>
      </Pressable></View>}
    </SafeAreaView>

    {showForm && <HabitForm key={habit.id} visible onClose={() => setShowForm(false)} habit={habit} />}
    <ActionSheet visible={showActions} title={habit.name} subtitle="Manage this habit" onClose={() => setShowActions(false)} actions={[
      { label: 'Edit habit', icon: 'pencil-outline', onPress: () => setShowForm(true) },
      { label: habit.archived ? 'Restore habit' : 'Archive habit', icon: habit.archived ? 'archive-arrow-up-outline' : 'archive-outline', onPress: () => void archiveHabit(habit.id, !habit.archived) },
      { label: 'Delete habit', icon: 'delete-outline', destructive: true, onPress: () => setShowDelete(true) },
    ]} />
    <ActionSheet visible={showDelete} title="Delete this habit?" subtitle="Its completion history will also be removed." onClose={() => setShowDelete(false)} actions={[{ label: 'Delete habit', icon: 'delete-outline', destructive: true, onPress: () => { void deleteHabit(habit.id); router.back(); } }]} />
    <ActionSheet visible={rangeOpen} title="Chart range" subtitle="Choose the time period" onClose={() => setRangeOpen(false)} actions={(['Weekly', 'Monthly'] as const).map(value => ({ label: value, icon: chartRange === value ? 'check-circle' : 'circle-outline', onPress: () => setChartRange(value) }))} />
    <ActionSheet visible={!!feedback} title="Reminder status" subtitle={feedback} onClose={() => setFeedback('')} actions={[{ label: 'Got it', icon: 'check', onPress: () => setFeedback('') }]} />
    <TimeDialog visible={timeOpen} value={habit.reminderAt ?? '09:00'} title="Habit reminder" onClose={() => setTimeOpen(false)} onSelect={time => { setTimeOpen(false); void updateReminder(time); }} />
  </View>;
}

function OverviewView({ habit, entries, week, today, weekMetrics, streak, longestStreak, todayEntry, activeToday, resolvedTheme, onDate, onEdit, onReminder, onReminderOff }: {
  habit: Habit; entries: HabitEntry[]; week: Date[]; today: string; weekMetrics: { completed: number; scheduled: number; rate: number };
  streak: number; longestStreak: number; todayEntry?: HabitEntry; activeToday: boolean; resolvedTheme: 'light' | 'dark'; onDate: (date: string) => void; onEdit: () => void; onReminder: () => void; onReminderOff: () => void;
}) {
  return <>
    <Animated.View entering={FadeInDown.duration(240)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
      <HabitIcon habit={habit} size={68} radius={22} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: habit.archived ? palette.surfaceSoft : alpha(palette.success, 0.18) }}><Text style={{ color: habit.archived ? palette.muted : palette.success, fontSize: 11, fontWeight: '700' }}>{habit.archived ? 'Archived' : 'Active'}</Text></View>
        <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 23, fontWeight: '800', letterSpacing: -0.5 }}>{habit.name}</Text>
        <Text numberOfLines={2} style={{ color: palette.muted, fontSize: 13 }}>{habit.description?.trim() || 'Small steps, repeated with care.'}</Text>
      </View>
    </Animated.View>

    <View style={{ flexDirection: 'row', gap: 10 }}>
      <MetricTile icon="fire" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} label="Current streak" tint={palette.yellowSoft} iconColor={palette.yellow} />
      <MetricTile icon="trophy" value={`${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}`} label="Longest streak" tint={palette.purpleSoft} iconColor={palette.purple} />
    </View>

    <Panel style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={panelTitle}>Weekly progress</Text>
        <Text style={{ color: palette.muted, fontSize: 12 }}>{weekMetrics.completed}/{weekMetrics.scheduled} completed</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 79 }}>
          {week.map((day, index) => {
            const key = dateKey(day);
            const done = entries.some(entry => entry.habitId === habit.id && entry.date === key && entry.completed);
            const due = isScheduledOn(habit, day) && key >= habit.createdAt.slice(0, 10) && key <= today;
            const height = done ? 54 : due ? 14 : 28;
            return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${done ? ', completed' : due ? ', missed' : ''}`} onPress={() => { if (key <= today && isScheduledOn(habit, day)) onDate(key); }} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
              <View style={{ width: 17, height, borderRadius: 9, backgroundColor: done ? habit.color : alpha(habit.color, due ? 0.23 : 0.12) }} />
              <Text style={{ color: palette.muted, fontSize: 10, fontWeight: key === today ? '700' : '500' }}>{DAY_INITIALS[index]}</Text>
            </Pressable>;
          })}
        </View>
        <ProgressRing value={weekMetrics.rate} color={habit.color} size={86} fontSize={18} />
      </View>
    </Panel>

    <Panel style={{ paddingHorizontal: 15, paddingVertical: 3 }}>
      <DetailRow icon="bullseye-arrow" label="Goal" value={formatGoal(habit)} onPress={onEdit} />
      <DetailRow icon="calendar-month-outline" label="Schedule" value={formatSchedule(habit.schedule)} onPress={onEdit} />
      <DetailRow icon="clock-outline" label="Reminder" value={habit.reminderAt ? formatTime(habit.reminderAt) : 'Off'} onPress={onReminder} switchValue={Boolean(habit.reminderAt)} onSwitch={habit.reminderAt ? onReminderOff : onReminder} />
      <DetailRow icon="chart-bar" label="Habit type" value={formatHabitType(habit.type)} onPress={onEdit} last />
    </Panel>
    {todayEntry?.value && habit.type !== 'boolean' && <Text style={{ color: palette.muted, textAlign: 'center', fontSize: 12 }}>{formatValue(habit, todayEntry)} logged today{activeToday ? '' : ' on an off day'}</Text>}
  </>;
}

function HistoryView({ habit, entries, month, calendar, recent, showAll, onToggleAll, onMonth, onDate, today }: {
  habit: Habit; entries: HabitEntry[]; month: Date; calendar: CalendarDay[]; recent: Date[]; showAll: boolean; onToggleAll: () => void; onMonth: (amount: number) => void; onDate: (date: string) => void; today: string;
}) {
  const monthKey = dateKey(new Date(month.getFullYear(), month.getMonth(), 1));
  const currentMonthKey = dateKey(new Date(new Date(`${today}T12:00:00`).getFullYear(), new Date(`${today}T12:00:00`).getMonth(), 1));
  return <>
    <Panel style={{ padding: 15, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={panelTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          <HeaderAction icon="chevron-left" label="Previous month" onPress={() => onMonth(-1)} compact />
          <HeaderAction icon="chevron-right" label="Next month" onPress={() => onMonth(1)} compact disabled={monthKey >= currentMonthKey} />
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>{CALENDAR_WEEKDAYS.map(day => <Text key={day} style={{ flex: 1, textAlign: 'center', color: palette.muted, fontSize: 10, fontWeight: '600', paddingVertical: 3 }}>{day}</Text>)}</View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendar.map(day => day.date ? <Pressable key={day.key} accessibilityRole="button" accessibilityState={{ disabled: day.future, selected: day.key === today }} accessibilityLabel={`${day.key}, ${day.entry?.completed ? 'completed' : day.scheduled ? 'not completed' : 'rest day'}`} disabled={day.future || !day.scheduled || day.beforeStart} onPress={() => onDate(day.key)} style={{ width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: day.level ? heatColor(habit.color, day.level) : palette.surfaceSoft, borderWidth: day.key === today ? 1.5 : 0, borderColor: palette.purple, opacity: day.future || day.beforeStart ? 0.45 : day.scheduled ? 1 : 0.55 }}>
            <Text style={{ color: day.level >= 3 ? '#FFFFFF' : palette.ink, fontSize: 12, fontWeight: day.key === today ? '800' : '500' }}>{day.date.getDate()}</Text>
          </View>
        </Pressable> : <View key={day.key} style={{ width: '14.285%', height: 40 }} />)}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, paddingTop: 2 }}>
        <Text style={{ color: palette.muted, fontSize: 10 }}>No activity</Text>
        {[1, 2, 3, 4].map(level => <View key={level} style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: heatColor(habit.color, level) }} />)}
        <Text style={{ color: palette.muted, fontSize: 10 }}>Completed</Text>
      </View>
    </Panel>

    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, marginTop: 1 }}>
      <Text style={panelTitle}>Recent activity</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: showAll }} onPress={onToggleAll} hitSlop={8}><Text style={{ color: palette.muted, fontSize: 13 }}>{showAll ? 'Show less' : 'See all'}</Text></Pressable>
    </View>
    <Panel style={{ paddingHorizontal: 13, paddingVertical: 2 }}>
      {recent.length ? (showAll ? recent : recent.slice(0, 5)).map((day, index) => {
        const key = dateKey(day);
        const entry = entries.find(item => item.habitId === habit.id && item.date === key);
        const scheduled = habit.schedule.includes(day.getDay());
        const title = dateLabel(day, today);
        const detail = entry?.completed ? formatValue(habit, entry) : scheduled ? (entry ? 'Not completed' : 'Missed') : 'Rest day';
        return <View key={key} style={{ minHeight: 57, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: index === (showAll ? recent.length : Math.min(5, recent.length)) - 1 ? 0 : 1, borderBottomColor: palette.line }}>
          <HabitIcon habit={habit} size={38} radius={14} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>{title}</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{detail}</Text></View>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(entry?.completed), disabled: key > today || key < habit.createdAt.slice(0, 10) || !scheduled }} accessibilityLabel={`${entry?.completed ? 'Mark incomplete' : 'Mark complete'} for ${title}`} disabled={key > today || key < habit.createdAt.slice(0, 10) || !scheduled} onPress={() => onDate(key)} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={entry?.completed ? 'check-circle' : scheduled ? 'circle-outline' : 'minus-circle-outline'} size={23} color={entry?.completed ? palette.success : palette.muted} />
          </Pressable>
        </View>;
      }) : <Text style={{ color: palette.muted, fontSize: 13, textAlign: 'center', padding: 18 }}>No activity for this month yet.</Text>}
    </Panel>
  </>;
}

function InsightsView({ habit, metrics, trends, range, onRange }: { habit: Habit; metrics: Last30Metrics; trends: TrendBucket[]; range: ChartRange; onRange: () => void }) {
  const isDuration = habit.type === 'duration';
  const total = metrics.totalValue;
  const average = metrics.completed ? total / metrics.completed : 0;
  const best = metrics.bestWeekday;
  const unit = isDuration ? 'minutes' : habit.unit;
  return <>
    <Panel style={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}><Text style={panelTitle}>Completion rate</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>Last 30 days</Text></View>
        <ProgressRing value={metrics.rate} color={habit.color} size={78} fontSize={17} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SmallStat value={String(metrics.completed)} label="Completed" />
        <View style={{ width: 1, height: 36, backgroundColor: palette.line }} />
        <SmallStat value={String(metrics.missed)} label="Missed" />
        <View style={{ width: 1, height: 36, backgroundColor: palette.line }} />
        <SmallStat value={String(metrics.totalDays)} label="Total days" />
      </View>
    </Panel>

    <Panel style={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}><Text style={panelTitle}>{isDuration ? 'Time spent' : 'Progress logged'}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>{range === 'Weekly' ? 'Last 4 weeks' : 'Last 4 months'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Chart range: ${range}. Change range`} onPress={onRange} style={{ minHeight: 36, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: 'row', alignItems: 'center', gap: 4 }}><Text style={{ color: palette.ink, fontSize: 12, fontWeight: '600' }}>{range}</Text><MaterialCommunityIcons name="chevron-down" size={16} color={palette.ink} /></Pressable>
      </View>
      <TrendChart buckets={trends} color={habit.color} unit={unit} />
    </Panel>

    <Panel style={{ padding: 16, gap: 13 }}>
      <View><Text style={panelTitle}>Best performing day</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>{best ? `You’re most consistent on ${best}s.` : 'Complete a habit to find your strongest day.'}</Text></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 5 }}>
        {DAY_INITIALS.map((day, index) => {
          const dayName = WEEKDAYS[index];
          const selected = best === dayName;
          return <View key={`${day}-${index}`} style={{ flex: 1, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? habit.color : palette.surfaceSoft }}><Text style={{ color: selected ? '#FFFFFF' : palette.muted, fontSize: 12, fontWeight: selected ? '700' : '500' }}>{day}</Text></View>;
        })}
      </View>
    </Panel>

    <View style={{ flexDirection: 'row', gap: 10 }}>
      <InsightTile icon="lightning-bolt-outline" label="Avg. per check-in" value={formatMetric(average, isDuration ? 'minutes' : unit)} tint={palette.yellowSoft} iconColor={palette.yellow} />
      <InsightTile icon={isDuration ? 'chart-bar' : 'check-all'} label={isDuration ? 'Total time' : 'Total progress'} value={formatMetric(total, isDuration ? 'minutes' : unit, true)} tint={palette.purpleSoft} iconColor={palette.purple} />
    </View>
  </>;
}

function DetailBackdrop() {
  return <View pointerEvents="none" style={absoluteFill}>
    <View style={[absoluteFill, { backgroundColor: palette.canvas }]} />
    <View style={{ position: 'absolute', top: -145, right: -140, width: 330, height: 330, borderRadius: 170, backgroundColor: alpha(palette.purple, 0.08) }} />
    <View style={{ position: 'absolute', top: 180, right: -190, width: 310, height: 310, borderRadius: 160, backgroundColor: alpha(palette.yellow, 0.08) }} />
    <View style={{ position: 'absolute', bottom: -170, left: -125, width: 320, height: 320, borderRadius: 165, backgroundColor: alpha(palette.purple, 0.07) }} />
  </View>;
}

function HeaderAction({ icon, label, onPress, compact, disabled }: { icon: string; label: string; onPress: () => void; compact?: boolean; disabled?: boolean }) {
  const size = compact ? 34 : 40;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, opacity: disabled ? 0.42 : 1 }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={compact ? 20 : 19} color={palette.ink} /></Pressable>;
}

type CalendarDay = { key: string; date?: Date; entry?: HabitEntry; scheduled: boolean; future: boolean; beforeStart: boolean; level: number };
type Last30Metrics = { completed: number; missed: number; totalDays: number; rate: number; totalValue: number; bestWeekday: string | null };
type TrendBucket = { label: string; value: number };

const panelTitle = { color: palette.ink, fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 };
const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };

function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <Animated.View entering={FadeInDown.duration(220)} style={[{ borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card }, style]}>{children}</Animated.View>;
}

function MetricTile({ icon, value, label, tint, iconColor }: { icon: string; value: string; label: string; tint: string; iconColor: string }) {
  return <View style={{ flex: 1, minHeight: 76, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: tint }}>
    <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={25} color={iconColor} />
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{value}</Text><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 11 }}>{label}</Text></View>
  </View>;
}

function ProgressRing({ value, color, size, fontSize }: { value: number; color: string; size: number; fontSize: number }) {
  const track = alpha(color, 0.17);
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} accessibilityLabel={`${value}% complete`} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(6, size * 0.09), borderTopColor: value >= 12.5 ? color : track, borderRightColor: value >= 37.5 ? color : track, borderBottomColor: value >= 62.5 ? color : track, borderLeftColor: value >= 87.5 ? color : track, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}>
    <Text style={{ color: palette.ink, fontSize, fontWeight: '800', letterSpacing: -0.4 }}>{value}%</Text>
  </View>;
}

function DetailRow({ icon, label, value, onPress, switchValue, onSwitch, last }: { icon: string; label: string; value: string; onPress: () => void; switchValue?: boolean; onSwitch?: () => void; last?: boolean }) {
  const content = <>
    <View style={{ width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={palette.ink} /></View>
    <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: palette.ink, fontSize: 14, fontWeight: '600' }}>{label}</Text></View>
    <Text numberOfLines={1} style={{ maxWidth: '47%', color: palette.muted, fontSize: 13, textAlign: 'right' }}>{value}</Text>
  </>;
  if (switchValue !== undefined && onSwitch) return <View style={{ minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}>
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }}>{content}</Pressable>
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: switchValue }} accessibilityLabel={`${switchValue ? 'Turn off' : 'Set'} reminder`} onPress={onSwitch} style={{ width: 48, height: 42, alignItems: 'flex-end', justifyContent: 'center' }}><View style={{ width: 39, height: 23, borderRadius: 12, backgroundColor: switchValue ? palette.purple : palette.line, justifyContent: 'center', paddingHorizontal: 3 }}><View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: '#FFFFFF', alignSelf: switchValue ? 'flex-end' : 'flex-start' }} /></View></Pressable>
  </View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}>{content}<MaterialCommunityIcons name="chevron-right" size={19} color={palette.muted} /></Pressable>;
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return <View style={{ flex: 1, alignItems: 'center', gap: 4 }}><Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800' }}>{value}</Text><Text style={{ color: palette.muted, fontSize: 11 }}>{label}</Text></View>;
}

function InsightTile({ icon, label, value, tint, iconColor }: { icon: string; label: string; value: string; tint: string; iconColor: string }) {
  return <View style={{ flex: 1, minHeight: 73, borderRadius: 19, backgroundColor: tint, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <View style={{ width: 32, height: 32, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(iconColor, 0.12) }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={iconColor} /></View>
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 10 }}>{label}</Text><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{value}</Text></View>
  </View>;
}

function HabitIcon({ habit, size, radius }: { habit: Habit; size: number; radius: number }) {
  return <View style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(habit.color, 0.2) }}><MaterialCommunityIcons name={habitGlyph(habit) as keyof typeof MaterialCommunityIcons.glyphMap} size={Math.round(size * 0.44)} color={palette.ink} /></View>;
}

function TrendChart({ buckets, color, unit }: { buckets: TrendBucket[]; color: string; unit: string }) {
  const maximum = Math.max(0, ...buckets.map(bucket => bucket.value));
  if (!maximum) return <View style={{ minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 6 }}><MaterialCommunityIcons name="chart-bar" size={25} color={palette.muted} /><Text style={{ color: palette.muted, fontSize: 12 }}>Complete this habit to build your trend.</Text></View>;
  const ticks = [maximum, maximum / 2, 0];
  return <View style={{ flexDirection: 'row', gap: 7 }}>
    <View style={{ height: 127, justifyContent: 'space-between', paddingBottom: 20 }}>
      {ticks.map((tick, index) => <Text key={`${index}-${tick}`} style={{ color: palette.muted, fontSize: 9 }}>{formatAxis(tick, unit)}</Text>)}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={{ height: 107, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: palette.line }}>
        {buckets.map((bucket, index) => <View key={`${bucket.label}-${index}`} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: palette.line }} />
          <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: palette.line }} />
          <View style={{ width: '50%', maxWidth: 34, height: bucket.value ? Math.max(3, (bucket.value / maximum) * 100) : 0, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: alpha(color, 0.55 + (index / Math.max(1, buckets.length - 1)) * 0.45) }} />
        </View>)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 7 }}>{buckets.map((bucket, index) => <Text key={`${bucket.label}-${index}`} numberOfLines={1} style={{ flex: 1, textAlign: 'center', color: palette.muted, fontSize: 9 }}>{bucket.label}</Text>)}</View>
    </View>
  </View>;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function monthDays(month: Date, habit: Habit, entries: HabitEntry[], today: string): CalendarDay[] {
  const first = monthStart(month);
  const offset = (first.getDay() + 6) % 7;
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + total) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const date = index - offset + 1;
    if (date < 1 || date > total) return { key: `empty-${index}`, scheduled: false, future: false, beforeStart: false, level: 0 };
    const day = new Date(first.getFullYear(), first.getMonth(), date, 12);
    const key = dateKey(day);
    const entry = entries.find(item => item.habitId === habit.id && item.date === key);
    return { key, date: day, entry, scheduled: isScheduledOn(habit, day), future: key > today, beforeStart: key < habit.createdAt.slice(0, 10), level: heatmapLevel(entry, habit) };
  });
}

function recentDates(month: Date, habit: Habit, entries: HabitEntry[], today: string) {
  const first = monthStart(month);
  const total = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lastDay = dateKey(first).slice(0, 7) === today.slice(0, 7) ? new Date(`${today}T12:00:00`).getDate() : total;
  const dates: Date[] = [];
  for (let day = lastDay; day > 0; day--) {
    const date = new Date(first.getFullYear(), first.getMonth(), day, 12);
    const key = dateKey(date);
    if (key < habit.createdAt.slice(0, 10)) break;
    dates.push(date);
  }
  return dates;
}

function measureRange(habit: Habit, entries: HabitEntry[], start: string, today: string) {
  const end = dateKey(addDays(new Date(`${start}T12:00:00`), 6));
  const through = end < today ? end : today;
  const due: string[] = [];
  for (let date = new Date(`${start}T12:00:00`); dateKey(date) <= through; date = addDays(date, 1)) {
    const key = dateKey(date);
    if (key >= habit.createdAt.slice(0, 10) && isScheduledOn(habit, date)) due.push(key);
  }
  const done = new Set(entries.filter(entry => entry.habitId === habit.id && entry.completed).map(entry => entry.date));
  const completed = due.filter(key => done.has(key)).length;
  return { completed, scheduled: due.length, rate: due.length ? Math.round((completed / due.length) * 100) : 0 };
}

function measureLast30Days(habit: Habit, entries: HabitEntry[], today: string): Last30Metrics {
  const end = new Date(`${today}T12:00:00`);
  const start = addDays(end, -29);
  const due: Date[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    if (dateKey(date) >= habit.createdAt.slice(0, 10) && isScheduledOn(habit, date)) due.push(date);
  }
  const relevant = entries.filter(entry => entry.habitId === habit.id && entry.completed && entry.date >= dateKey(start) && entry.date <= today);
  const completedDates = new Set(relevant.map(entry => entry.date));
  const completed = due.filter(date => completedDates.has(dateKey(date))).length;
  const totalValue = relevant.reduce((sum, entry) => sum + entry.value, 0);
  const byDay = Array.from({ length: 7 }, () => ({ due: 0, done: 0 }));
  for (const date of due) {
    const weekday = date.getDay();
    byDay[weekday].due++;
    if (completedDates.has(dateKey(date))) byDay[weekday].done++;
  }
  const best = byDay.map((value, index) => ({ ...value, index, rate: value.due ? value.done / value.due : -1 })).sort((a, b) => b.rate - a.rate)[0];
  const bestWeekday = best && best.rate > 0 ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][best.index] : null;
  return { completed, missed: due.length - completed, totalDays: due.length, rate: due.length ? Math.round(completed / due.length * 100) : 0, totalValue, bestWeekday };
}

function getTrend(habit: Habit, entries: HabitEntry[], range: ChartRange, today: string): TrendBucket[] {
  const currentDate = new Date(`${today}T12:00:00`);
  if (range === 'Weekly') {
    const currentMonday = addDays(currentDate, -((currentDate.getDay() + 6) % 7));
    return Array.from({ length: 4 }, (_, index) => {
      const start = addDays(currentMonday, (index - 3) * 7);
      const startKey = dateKey(start);
      const endKey = dateKey(addDays(start, 6)) < today ? dateKey(addDays(start, 6)) : today;
      const value = sumEntries(entries, habit, startKey < habit.createdAt.slice(0, 10) ? habit.createdAt.slice(0, 10) : startKey, endKey);
      return { label: `Week ${index + 1}`, value };
    });
  }
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 12);
  return Array.from({ length: 4 }, (_, index) => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - (3 - index), 1, 12);
    const endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0, 12);
    const endKey = dateKey(endDate) < today ? dateKey(endDate) : today;
    const startKey = dateKey(start) < habit.createdAt.slice(0, 10) ? habit.createdAt.slice(0, 10) : dateKey(start);
    return { label: start.toLocaleDateString(undefined, { month: 'short' }), value: sumEntries(entries, habit, startKey, endKey) };
  });
}

function sumEntries(entries: HabitEntry[], habit: Habit, start: string, end: string) {
  if (start > end) return 0;
  return entries.filter(entry => entry.habitId === habit.id && entry.completed && entry.date >= start && entry.date <= end).reduce((sum, entry) => sum + entry.value, 0);
}

function emptyMonthMetrics(): Last30Metrics {
  return { completed: 0, missed: 0, totalDays: 0, rate: 0, totalValue: 0, bestWeekday: null };
}

function formatGoal(habit: Habit) {
  if (habit.type === 'boolean') return 'Once per scheduled day';
  const amount = formatNumber(habit.target);
  const unit = normalizedUnit(habit.unit);
  return `${amount} ${unit} / day`;
}

function formatSchedule(schedule: number[]) {
  if (schedule.length === 7) return 'Every day';
  if ([1, 2, 3, 4, 5].every(day => schedule.includes(day)) && schedule.length === 5) return 'Weekdays';
  if ([0, 6].every(day => schedule.includes(day)) && schedule.length === 2) return 'Weekends';
  return schedule.slice().sort((a, b) => a - b).map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ');
}

function formatHabitType(type: Habit['type']) {
  return ({ boolean: 'Yes / No', quantity: 'Quantity', duration: 'Duration', counter: 'Counter' })[type];
}

function formatValue(habit: Habit, entry: HabitEntry) {
  if (habit.type === 'boolean') return 'Completed';
  return `${formatNumber(entry.value)} ${normalizedUnit(habit.unit)}`;
}

function formatMetric(value: number, unit: string, total = false) {
  if (unit === 'per day') return `${formatNumber(value)} ${total ? 'check-ins' : 'times'}`;
  if (unit === 'min' || unit === 'minute' || unit === 'minutes') {
    if (total && value >= 60) return `${(value / 60).toFixed(1)} hours`;
    return `${formatNumber(value)} ${value === 1 ? 'minute' : 'minutes'}`;
  }
  return `${formatNumber(value)} ${normalizedUnit(unit)}`;
}

function formatAxis(value: number, unit: string) {
  if (unit === 'min' || unit === 'minute' || unit === 'minutes') return `${Math.round(value)}m`;
  return formatNumber(value);
}

function normalizedUnit(unit: string) {
  if (unit === 'min' || unit === 'minute') return 'minutes';
  if (unit === 'hr' || unit === 'hour') return 'hours';
  return unit;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function dateLabel(date: Date, today: string) {
  const key = dateKey(date);
  if (key === today) return 'Today';
  if (key === dateKey(addDays(new Date(`${today}T12:00:00`), -1))) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minute) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function habitGlyph(habit: Habit) {
  const iconMap: Record<string, string> = { '💧': 'water', '🏃': 'run-fast', '📖': 'book-open-variant', '🌱': 'sprout', '🧘': 'meditation', '✍️': 'draw', '🎨': 'palette-outline', '💊': 'pill', '🌙': 'moon-waning-crescent', '🏋️': 'weight-lifter', '🤍': 'heart-outline', '🍎': 'food-apple-outline', '🧠': 'brain' };
  if (iconMap[habit.icon]) return iconMap[habit.icon];
  const name = habit.name.toLocaleLowerCase();
  if (/water|drink|hydrat/.test(name)) return 'water';
  if (/workout|fitness|exercise|run|walk/.test(name)) return 'run-fast';
  if (/read|book|study|learn/.test(name)) return 'book-open-variant';
  if (/meditat|mindful|breath/.test(name)) return 'meditation';
  if (/sleep|bed/.test(name)) return 'moon-waning-crescent';
  return 'sprout';
}

function heatColor(color: string, level: number) {
  return level >= 4 ? color : mix(color, palette.card, [0, 0.2, 0.38, 0.62][level] ?? 0);
}

function mix(foreground: string, background: string, ratio: number) {
  const rgb = (color: string) => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
  const front = rgb(foreground);
  const back = rgb(background);
  return `#${front.map((value, index) => Math.round(value * ratio + back[index] * (1 - ratio)).toString(16).padStart(2, '0')).join('')}`;
}

function alpha(hex: string, opacity: number) {
  const color = hex.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
