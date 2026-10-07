import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { useHabitlyActions, useHabitlyEntries, useHabitlyHabits } from '../../features/app/AppProvider';
import { calculateStreak } from '../../features/habits/domain';
import { HabitForm } from '../../features/habits/HabitForm';
import type { Habit, HabitEntry } from '../../features/habits/types';
import { palette } from '../../theme/tokens';
import { addDays, dateKey } from '../../utils/dates';
import { appRoute } from '../../utils/routes';

type HabitFilter = 'All' | 'Active' | 'Archived';
type HabitSort = 'Streak' | 'Week progress' | 'Name A–Z';

const FILTERS: HabitFilter[] = ['All', 'Active', 'Archived'];
const SORTS: HabitSort[] = ['Streak', 'Week progress', 'Name A–Z'];
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Habits() {
  const habits = useHabitlyHabits();
  const entries = useHabitlyEntries();
  const { setEntry, archiveHabit, deleteHabit } = useHabitlyActions();
  const today = dateKey();
  const [filter, setFilter] = useState<HabitFilter>('All');
  const [sort, setSort] = useState<HabitSort>('Streak');
  const [showSort, setShowSort] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit>();
  const [actionHabit, setActionHabit] = useState<Habit>();
  const [confirmDelete, setConfirmDelete] = useState<Habit>();
  const startOfWeek = mondayOf(new Date(`${today}T12:00:00`));
  const week = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek, index));
  const metrics = useMemo(() => new Map(habits.map(habit => [habit.id, getHabitMetrics(habit, entries, startOfWeek, today)])), [habits, entries, startOfWeek, today]);
  const visibleHabits = useMemo(() => habits
    .filter(habit => filter === 'All' || (filter === 'Active' ? !habit.archived : habit.archived))
    .slice()
    .sort((left, right) => {
      if (sort === 'Name A–Z') return left.name.localeCompare(right.name);
      const leftMetrics = metrics.get(left.id);
      const rightMetrics = metrics.get(right.id);
      if (sort === 'Week progress') return (rightMetrics?.progress ?? 0) - (leftMetrics?.progress ?? 0) || left.name.localeCompare(right.name);
      return (calculateStreak(right, entries) - calculateStreak(left, entries)) || left.name.localeCompare(right.name);
    }), [habits, filter, sort, metrics, entries]);

  const openCreate = () => { setEditingHabit(undefined); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingHabit(undefined); };
  const toggleDate = (habit: Habit, date: string) => {
    const entry = entries.find(item => item.habitId === habit.id && item.date === date);
    void Haptics.selectionAsync();
    void setEntry(habit, entry?.completed ? 0 : habit.target, date, !entry?.completed);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas, overflow: 'hidden' }}>
      <HabitsBackdrop />
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 112, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: palette.ink, fontSize: 32, fontWeight: '800', letterSpacing: -0.8 }}>Habits</Text>
              <Text style={{ color: palette.muted, fontSize: 15, marginTop: 2 }}>Small habits. Big results.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <HeaderAction icon="magnify" label="Search habits and tasks" onPress={() => router.push(appRoute('/search'))} />
              <HeaderAction icon="plus" label="Create habit" primary onPress={openCreate} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 5, borderRadius: 20, padding: 4, backgroundColor: palette.surfaceSoft }}>
              {FILTERS.map(value => <FilterTab key={value} label={value} selected={filter === value} onPress={() => setFilter(value)} />)}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Sort habits. Current sort: ${sort}`} onPress={() => setShowSort(true)} style={{ minWidth: 91, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>Sort</Text>
              <MaterialCommunityIcons name="chevron-down" size={18} color={palette.ink} />
            </Pressable>
          </View>

          {visibleHabits.length ? visibleHabits.map(habit => <HabitOverviewCard key={habit.id} habit={habit} week={week} today={today} entries={entries} metrics={metrics.get(habit.id) ?? getHabitMetrics(habit, entries, startOfWeek, today)} onOpen={() => router.push(appRoute({ pathname: '/habit/[id]', params: { id: habit.id } }))} onManage={() => setActionHabit(habit)} onToggleDate={toggleDate} />) : (
            <View style={{ borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 30, gap: 9 }}>
              <MaterialCommunityIcons name={filter === 'Archived' ? 'archive-outline' : 'sprout-outline'} size={34} color={palette.purple} />
              <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{filter === 'Archived' ? 'No archived habits' : 'Start with one small routine'}</Text>
              <Text style={{ color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>{filter === 'Archived' ? 'Archived habits will stay here until you restore them.' : 'Pick something easy to repeat and build from there.'}</Text>
              {filter !== 'Archived' && <Pressable accessibilityRole="button" onPress={openCreate} style={{ minHeight: 42, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={{ color: palette.purple, fontWeight: '700' }}>Create your first habit</Text></Pressable>}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {showForm && <HabitForm key={editingHabit?.id ?? 'new'} visible onClose={closeForm} habit={editingHabit} />}
      <ActionSheet visible={showSort} title="Sort habits" subtitle="Choose how your routines are ordered" onClose={() => setShowSort(false)} actions={SORTS.map(value => ({ label: value, icon: value === sort ? 'check-circle' : 'circle-outline', onPress: () => setSort(value) }))} />
      <ActionSheet visible={!!actionHabit} title={actionHabit?.name ?? 'Habit'} subtitle="Manage this routine" onClose={() => setActionHabit(undefined)} actions={[
        { label: 'Edit habit', icon: 'pencil-outline', onPress: () => { setEditingHabit(actionHabit); setShowForm(true); } },
        { label: actionHabit?.archived ? 'Restore habit' : 'Archive habit', icon: actionHabit?.archived ? 'archive-arrow-up-outline' : 'archive-outline', onPress: () => { if (actionHabit) void archiveHabit(actionHabit.id, !actionHabit.archived); } },
        { label: 'Delete habit', icon: 'delete-outline', destructive: true, onPress: () => setConfirmDelete(actionHabit) },
      ]} />
      <ActionSheet visible={!!confirmDelete} title="Delete this habit?" subtitle="Its completion history will also be removed." onClose={() => setConfirmDelete(undefined)} actions={[
        { label: 'Delete habit', icon: 'delete-outline', destructive: true, onPress: () => { if (confirmDelete) void deleteHabit(confirmDelete.id); setConfirmDelete(undefined); } },
      ]} />
    </View>
  );
}

function HabitsBackdrop() {
  return <View pointerEvents="none" style={absoluteFill}>
    <View style={[absoluteFill, { backgroundColor: palette.canvas }]} />
    <View style={{ position: 'absolute', top: -122, right: -112, width: 300, height: 300, borderRadius: 155, backgroundColor: alpha(palette.purple, 0.09) }} />
    <View style={{ position: 'absolute', top: 75, left: 90, width: 200, height: 200, borderRadius: 105, backgroundColor: alpha(palette.yellow, 0.075) }} />
    <View style={{ position: 'absolute', bottom: -164, right: -100, width: 340, height: 340, borderRadius: 180, backgroundColor: alpha(palette.purple, 0.07) }} />
  </View>;
}

function HeaderAction({ icon, label, primary, onPress }: { icon: string; label: string; primary?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? palette.purple : palette.card, borderWidth: primary ? 0 : 1, borderColor: palette.line, elevation: primary ? 3 : 0, shadowColor: palette.purple, shadowOpacity: primary ? 0.16 : 0, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
    <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={23} color={primary ? palette.onPrimary : palette.ink} />
  </Pressable>;
}

function FilterTab({ label, selected, onPress }: { label: HabitFilter; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={{ flex: 1, minHeight: 38, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? palette.purple : 'transparent' }}>
    <Text style={{ color: selected ? palette.onPrimary : palette.muted, fontSize: 12, fontWeight: selected ? '700' : '600' }}>{label}</Text>
  </Pressable>;
}

function HabitOverviewCard({ habit, week, today, entries, metrics, onOpen, onManage, onToggleDate }: { habit: Habit; week: Date[]; today: string; entries: HabitEntry[]; metrics: HabitMetrics; onOpen: () => void; onManage: () => void; onToggleDate: (habit: Habit, date: string) => void }) {
  const streak = calculateStreak(habit, entries);
  const color = habit.color;
  return <View style={{ padding: 12, borderRadius: 24, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, gap: 9 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${habit.name}`} onPress={onOpen} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(color, 0.19) }}>
        <MaterialCommunityIcons name={habitGlyph(habit) as keyof typeof MaterialCommunityIcons.glyphMap} size={29} color={palette.ink} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${habit.name} details`} onPress={onOpen} hitSlop={4}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.25 }}>{habit.name}</Text></Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MaterialCommunityIcons name="fire" size={16} color={streak ? palette.yellow : palette.muted} />
          <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 12 }}>{streak ? `${streak} day streak` : 'Start your streak'}</Text>
        </View>
      </View>
      <ProgressRing value={metrics.progress} color={color} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Manage ${habit.name}`} onPress={onManage} style={{ width: 32, height: 42, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="dots-vertical" size={21} color={palette.ink} /></Pressable>
    </View>

    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingLeft: 3 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <WeekDots habit={habit} week={week} today={today} entries={entries} color={color} onToggleDate={onToggleDate} />
      </View>
      <View style={{ width: 72, alignItems: 'flex-end', gap: 5, paddingBottom: 1 }}>
        <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 11, fontWeight: '600' }}>{metrics.completed}/{metrics.scheduled} this week</Text>
        <WeekBars values={metrics.weeklyTrend} color={color} />
      </View>
    </View>
  </View>;
}

function WeekDots({ habit, week, today, entries, color, onToggleDate }: { habit: Habit; week: Date[]; today: string; entries: HabitEntry[]; color: string; onToggleDate: (habit: Habit, date: string) => void }) {
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 2 }}>
    {week.map((day, index) => {
      const key = dateKey(day);
      const done = entries.some(entry => entry.habitId === habit.id && entry.date === key && entry.completed);
      const future = key > today;
      const scheduled = habit.schedule.includes(day.getDay());
      return <Pressable key={key} accessibilityRole="checkbox" accessibilityState={{ checked: done, disabled: future }} accessibilityLabel={`${habit.name}, ${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${scheduled ? '' : ', not scheduled'}${future ? ', upcoming' : ''}`} disabled={future} onPress={() => onToggleDate(habit, key)} style={{ flex: 1, alignItems: 'center', gap: 4, opacity: future ? 0.55 : 1 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: done ? color : scheduled ? 'transparent' : alpha(color, 0.13), borderWidth: done || !scheduled ? 0 : 1.5, borderColor: palette.line }} />
        <Text style={{ color: palette.muted, fontSize: 9, fontWeight: day.getDay() === new Date(`${today}T12:00:00`).getDay() ? '700' : '500' }}>{WEEKDAY_LABELS[index]}</Text>
      </Pressable>;
    })}
  </View>;
}

function WeekBars({ values, color }: { values: number[]; color: string }) {
  return <View accessibilityLabel={`Five week completion trend: ${values.map(value => `${value}%`).join(', ')}`} style={{ height: 31, width: 66, flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
    {values.map((value, index) => <View key={`${index}-${value}`} style={{ flex: 1, height: 31, justifyContent: 'flex-end', borderRadius: 7, overflow: 'hidden', backgroundColor: alpha(color, 0.11) }}>
      {!!value && <View style={{ height: `${value}%`, minHeight: 3, backgroundColor: alpha(color, 0.52 + (index / values.length) * 0.48), borderRadius: 7 }} />}
    </View>)}
  </View>;
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const track = alpha(color, 0.17);
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} accessibilityLabel={`${value}% completed this week`} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 6, borderTopColor: value >= 12.5 ? color : track, borderRightColor: value >= 37.5 ? color : track, borderBottomColor: value >= 62.5 ? color : track, borderLeftColor: value >= 87.5 ? color : track, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}>
    <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '800', letterSpacing: -0.2 }}>{value}%</Text>
  </View>;
}

type HabitMetrics = { completed: number; scheduled: number; progress: number; weeklyTrend: number[] };

function getHabitMetrics(habit: Habit, entries: HabitEntry[], currentWeekStart: Date, today: string): HabitMetrics {
  const created = habit.createdAt.slice(0, 10);
  const weeklyTrend = Array.from({ length: 5 }, (_, index) => {
    const weekStart = addDays(currentWeekStart, (index - 4) * 7);
    return measureWeek(habit, entries, weekStart, today, created).progress;
  });
  const currentWeek = measureWeek(habit, entries, currentWeekStart, today, created);
  return { ...currentWeek, weeklyTrend };
}

function measureWeek(habit: Habit, entries: HabitEntry[], weekStart: Date, today: string, created: string) {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map(dateKey);
  const dueDates = dates.filter(date => date >= created && date <= today && habit.schedule.includes(new Date(`${date}T12:00:00`).getDay()));
  const completedDates = new Set(entries.filter(entry => entry.habitId === habit.id && entry.completed).map(entry => entry.date));
  const completed = dueDates.filter(date => completedDates.has(date)).length;
  return { completed, scheduled: dueDates.length, progress: dueDates.length ? Math.round(completed / dueDates.length * 100) : 0 };
}

function mondayOf(date: Date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function habitGlyph(habit: Habit) {
  const iconMap: Record<string, string> = { '💧': 'water', '🏃': 'run-fast', '📖': 'book-open-variant', '🌱': 'sprout', '🧘': 'meditation', '✍️': 'draw', '🎨': 'palette', '💊': 'pill' };
  if (iconMap[habit.icon]) return iconMap[habit.icon];
  const name = habit.name.toLocaleLowerCase();
  if (/water|drink|hydrat/.test(name)) return 'water';
  if (/workout|fitness|exercise|run|walk|push up/.test(name)) return 'run-fast';
  if (/read|book|study|learn/.test(name)) return 'book-open-variant';
  if (/meditat|mindful|breath/.test(name)) return 'meditation';
  if (/sleep|bed/.test(name)) return 'moon-waning-crescent';
  return 'sprout';
}

function alpha(hex: string, opacity: number) {
  const color = hex.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };
