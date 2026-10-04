import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { TaskForm } from '../../features/tasks/TaskForm';
import type { Task } from '../../features/tasks/types';
import { useHabitly } from '../../features/app/AppProvider';
import { calculateStreak } from '../../features/habits/domain';
import type { Habit } from '../../features/habits/types';
import { CelebrationModal } from '../../features/habits/CelebrationModal';
import { palette } from '../../theme/tokens';
import { addDays, dateKey, shortDate } from '../../utils/dates';
import { appRoute } from '../../utils/routes';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Today() {
  const { habits, entries, tasks, profileName, setEntry, toggleTask, deleteTask } = useHabitly();
  const insets = useSafeAreaInsets();
  const today = dateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task>();
  const [actionTask, setActionTask] = useState<Task>();
  const [confirmDelete, setConfirmDelete] = useState<Task>();
  const [celebration, setCelebration] = useState<{ habit: Habit; streak: number }>();
  const focusProgress = useSharedValue(0);

  useFocusEffect(useCallback(() => {
    // Reanimated values are intentionally reset when the tab regains focus.
    // eslint-disable-next-line react-hooks/immutability
    focusProgress.value = 0;
    focusProgress.value = withSpring(1, { damping: 20, stiffness: 150 });
    return () => {};
  }, [focusProgress]));
  const entranceStyle = useAnimatedStyle(() => ({ opacity: focusProgress.value, transform: [{ translateY: (1 - focusProgress.value) * 9 }] }));

  const selectedDay = new Date(`${selectedDate}T12:00:00`);
  const activeHabits = habits.filter(habit => !habit.archived && habit.schedule.includes(selectedDay.getDay()));
  const completed = activeHabits.filter(habit => entries.some(entry => entry.habitId === habit.id && entry.date === selectedDate && entry.completed)).length;
  const progress = activeHabits.length ? Math.round(completed / activeHabits.length * 100) : 0;
  const startOfWeek = addDays(new Date(`${today}T12:00:00`), -((new Date(`${today}T12:00:00`).getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek, index));
  const dateTasks = tasks.filter(task => task.dueDate === selectedDate).slice(0, 3);
  const currentStreak = Math.max(0, ...habits.filter(habit => !habit.archived).map(habit => calculateStreak(habit, entries)));
  const bestWeekday = useMemo(() => {
    const completions = Array.from({ length: 7 }, () => 0);
    entries.filter(entry => entry.completed).forEach(entry => {
      const weekday = new Date(`${entry.date}T12:00:00`).getDay();
      completions[(weekday + 6) % 7] += 1;
    });
    const top = Math.max(...completions);
    return top ? WEEKDAY_NAMES[completions.indexOf(top)] : null;
  }, [entries]);

  const openCreateTask = () => { setEditingTask(undefined); setShowTaskForm(true); };
  const closeTaskForm = () => { setShowTaskForm(false); setEditingTask(undefined); };
  const openTaskActions = (task: Task) => setActionTask(task);
  const toggleHabit = async (habit: Habit) => {
    const entry = entries.find(item => item.habitId === habit.id && item.date === selectedDate);
    const isCompleting = !entry?.completed;
    void Haptics.selectionAsync();
    await setEntry(habit, entry?.completed ? 0 : habit.target, selectedDate);
    if (isCompleting && selectedDate === today) {
      const updatedEntries = [...entries.filter(item => item.id !== entry?.id), { id: entry?.id ?? `pending-${habit.id}-${today}`, habitId: habit.id, date: today, value: habit.target, completed: true }];
      setCelebration({ habit, streak: calculateStreak(habit, updatedEntries) });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.canvas, overflow: 'hidden' }}>
      <TodayBackdrop />
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Animated.ScrollView style={[{ flex: 1 }, entranceStyle]} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 164, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={{ color: palette.ink, fontSize: 26, fontWeight: '700', letterSpacing: -0.6 }}>Good morning,</Text>
              <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }}>{profileName} 👋</Text>
              <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 14, marginTop: 2 }}>Let’s build a better you, one day at a time.</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <HeaderAction icon="magnify" label="Search" onPress={() => router.push(appRoute('/search'))} />
              <HeaderAction icon="account-outline" label="Profile" onPress={() => router.push(appRoute('/(tabs)/profile'))} />
            </View>
          </View>

          <View style={cardStyle({ padding: 17, borderRadius: 24 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
                <Text style={{ color: palette.ink, fontSize: 20, fontWeight: '700', letterSpacing: -0.4 }}>{selectedDate === today ? 'Today’s progress' : `${shortDate(selectedDate)} progress`}</Text>
                <Text style={{ color: palette.muted, fontSize: 14 }}>{completed} of {activeHabits.length} habits completed</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 9, paddingRight: 3 }}>
                  {week.map((day, index) => <WeekDay key={dateKey(day)} day={day} label={DAY_LABELS[index]} selected={dateKey(day) === selectedDate} completed={entries.some(entry => entry.date === dateKey(day) && entry.completed)} onPress={() => setSelectedDate(dateKey(day))} />)}
                </View>
              </View>
              <ProgressRing value={progress} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${currentStreak} day current streak. Open stats`} onPress={() => router.push('/(tabs)/stats')} style={{ flex: 1.08, minHeight: 78, borderRadius: 22, backgroundColor: palette.yellowSoft, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="fire" size={27} color={palette.yellow} />
              <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{currentStreak ? `${currentStreak} day streak` : 'Start a streak'}</Text><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 13, marginTop: 3 }}>{currentStreak ? 'Keep going!' : 'One small step today'}</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={21} color={palette.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Your most consistent day: ${bestWeekday ?? 'not available'}. Open stats`} onPress={() => router.push('/(tabs)/stats')} style={{ flex: 0.92, minHeight: 78, borderRadius: 22, backgroundColor: palette.purpleSoft, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <MaterialCommunityIcons name="crown" size={25} color={palette.purple} />
              <View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>Your best day</Text><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 13, marginTop: 3 }}>{bestWeekday ?? 'Keep building'}</Text></View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} />
            </Pressable>
          </View>

          <SectionHeading title="Today’s habits" action="See all" onPress={() => router.push('/(tabs)/habits')} />
          {activeHabits.length ? (
            <View style={listCardStyle()}>
              {activeHabits.map((habit, index) => <TodayHabitRow key={habit.id} habit={habit} date={selectedDate} last={index === activeHabits.length - 1} onToggle={() => void toggleHabit(habit)} onOpen={() => router.push(appRoute({ pathname: '/habit/[id]', params: { id: habit.id } }))} />)}
            </View>
          ) : (
            <View style={cardStyle({ padding: 18, alignItems: 'center', gap: 7 })}>
              <MaterialCommunityIcons name="sprout-outline" size={27} color={palette.purple} />
              <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>A little room to grow</Text>
              <Text style={{ color: palette.muted, textAlign: 'center', fontSize: 13 }}>{selectedDate === today ? 'Add a habit to start shaping your routine.' : 'No habits are scheduled for this day.'}</Text>
              {selectedDate === today && <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/habits')} style={{ padding: 8 }}><Text style={{ color: palette.purple, fontWeight: '700' }}>Explore habits</Text></Pressable>}
            </View>
          )}

          <SectionHeading title={selectedDate === today ? 'Today’s tasks' : 'Tasks'} action="See all" onPress={() => router.push(appRoute('/(tabs)/tasks'))} />
          {dateTasks.length ? (
            <View style={listCardStyle()}>
              {dateTasks.map((task, index) => <TodayTaskRow key={task.id} task={task} date={selectedDate} last={index === dateTasks.length - 1} onToggle={() => void toggleTask(task)} onMore={() => openTaskActions(task)} />)}
            </View>
          ) : (
            <View style={cardStyle({ padding: 17, flexDirection: 'row', alignItems: 'center', gap: 11 })}>
              <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color={palette.purple} /></View>
              <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontWeight: '700', fontSize: 14 }}>A clear list for now</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>Add a task when something needs a place.</Text></View>
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>

      <Pressable accessibilityRole="button" accessibilityLabel="Add task" onPress={openCreateTask} style={{ position: 'absolute', right: 27, bottom: Math.max(insets.bottom, 8) + 84, width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purple, elevation: 8, shadowColor: palette.purple, shadowOpacity: 0.26, shadowRadius: 13, shadowOffset: { width: 0, height: 6 } }}>
        <MaterialCommunityIcons name="plus" size={30} color={palette.onPrimary} />
      </Pressable>

      {showTaskForm && <TaskForm key={editingTask?.id ?? 'new'} task={editingTask} onClose={closeTaskForm} />}
      <ActionSheet visible={!!actionTask} title={actionTask?.title ?? 'Task'} subtitle="Choose an action" onClose={() => setActionTask(undefined)} actions={[
        { label: 'Edit task', icon: 'pencil-outline', onPress: () => { setEditingTask(actionTask); setShowTaskForm(true); } },
        { label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => setConfirmDelete(actionTask) },
      ]} />
      <ActionSheet visible={!!confirmDelete} title="Delete this task?" subtitle="Its scheduled reminder will be cancelled." onClose={() => setConfirmDelete(undefined)} actions={[
        { label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => { if (confirmDelete) void deleteTask(confirmDelete.id); setConfirmDelete(undefined); } },
      ]} />
      <CelebrationModal habit={celebration?.habit} streak={celebration?.streak ?? 0} onClose={() => setCelebration(undefined)} onViewStreak={() => { setCelebration(undefined); router.push('/achievements/streak'); }} />
    </View>
  );
}

function TodayBackdrop() {
  return <View pointerEvents="none" style={{ ...absoluteFill }}>
    <View style={[absoluteFill, { backgroundColor: palette.canvas }]} />
    <View style={{ position: 'absolute', top: -112, right: -102, width: 310, height: 310, borderRadius: 160, backgroundColor: alpha(palette.purple, 0.09) }} />
    <View style={{ position: 'absolute', top: 126, right: -154, width: 270, height: 270, borderRadius: 150, backgroundColor: alpha(palette.yellow, 0.1) }} />
    <View style={{ position: 'absolute', bottom: -185, left: -122, width: 380, height: 380, borderRadius: 200, backgroundColor: alpha(palette.purple, 0.075) }} />
  </View>;
}

function HeaderAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={palette.ink} /></Pressable>;
}

function ProgressRing({ value }: { value: number }) {
  const tint = palette.purple;
  const track = palette.line;
  const width = 8;
  return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} accessibilityLabel={`Today's habits ${value}% complete`} style={{ width: 94, height: 94, borderRadius: 47, borderWidth: width, borderTopColor: value >= 12.5 ? tint : track, borderRightColor: value >= 37.5 ? tint : track, borderBottomColor: value >= 62.5 ? tint : track, borderLeftColor: value >= 87.5 ? tint : track, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}>
    <Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}>{value}%</Text>
  </View>;
}

function WeekDay({ day, label, selected, completed, onPress }: { day: Date; label: string; selected: boolean; completed: boolean; onPress: () => void }) {
  const marked = completed || selected;
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${completed ? ', habits completed' : ''}`} onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
    <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: marked ? palette.purple : palette.surfaceSoft, borderWidth: !marked ? 1.5 : 0, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }}>
      {selected && !completed && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: palette.onPrimary }} />}
    </View>
    <Text style={{ color: selected ? palette.purple : palette.muted, fontSize: 11, fontWeight: selected ? '700' : '600' }}>{label}</Text>
  </Pressable>;
}

function SectionHeading({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 3, marginBottom: -7 }}>
    <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>{title}</Text>
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={{ minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 2 }}><Text style={{ color: palette.muted, fontSize: 14 }}>{action}</Text><MaterialCommunityIcons name="chevron-right" size={19} color={palette.muted} /></Pressable>
  </View>;
}

function TodayHabitRow({ habit, date, last, onToggle, onOpen }: { habit: Habit; date: string; last: boolean; onToggle: () => void; onOpen: () => void }) {
  const { entries } = useHabitly();
  const entry = entries.find(item => item.habitId === habit.id && item.date === date);
  const done = Boolean(entry?.completed);
  const detail = habit.type === 'boolean' ? (done ? 'Daily habit' : 'Tap to mark complete') : `${entry?.value ?? 0} / ${habit.target} ${habit.unit}`;
  return <View style={{ minHeight: 82, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${habit.name}`} onPress={onOpen} style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(habit.color, 0.16) }}>
      <MaterialCommunityIcons name={habitGlyph(habit) as keyof typeof MaterialCommunityIcons.glyphMap} size={25} color={palette.purple} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${habit.name} details`} onPress={onOpen} style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 3 }}>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>{habit.name}</Text>
      <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 13 }}>{detail}</Text>
    </Pressable>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={`Mark ${habit.name} ${done ? 'incomplete' : 'complete'} for ${date}`} onPress={onToggle} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? palette.purple : 'transparent', borderWidth: done ? 0 : 2, borderColor: done ? palette.purple : palette.line }}>
      {done && <MaterialCommunityIcons name="check" size={23} color={palette.onPrimary} />}
    </Pressable>
  </View>;
}

function TodayTaskRow({ task, date, last, onToggle, onMore }: { task: Task; date: string; last: boolean; onToggle: () => void; onMore: () => void }) {
  const flagColor = task.priority === 'high' ? palette.danger : task.priority === 'medium' ? palette.yellow : palette.muted;
  const dayLabel = date === dateKey() ? 'Today' : shortDate(date);
  return <View style={{ minHeight: 76, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} onPress={onToggle} style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={task.completed ? 'checkbox-marked' : 'checkbox-blank-outline'} size={27} color={task.completed ? palette.purple : palette.ink} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={onMore} style={{ flex: 1, minWidth: 0, minHeight: 56, justifyContent: 'center', gap: 3 }}>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 15, fontWeight: '600', textDecorationLine: task.completed ? 'line-through' : 'none' }}>{task.title}</Text>
      <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 13 }}>{dayLabel}{task.dueTime ? `, ${formatTime(task.dueTime)}` : ''}</Text>
    </Pressable>
    {task.priority !== 'none' && task.priority !== 'low' && <MaterialCommunityIcons name="flag" size={19} color={flagColor} />}
    <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${task.title}`} onPress={onMore} style={{ width: 38, height: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="dots-horizontal" size={21} color={palette.ink} /></Pressable>
  </View>;
}

function cardStyle(extra: object = {}) {
  return { backgroundColor: palette.card, borderColor: palette.line, borderWidth: 1, borderRadius: 22, ...extra };
}

function listCardStyle() {
  return { backgroundColor: palette.card, borderColor: palette.line, borderWidth: 1, borderRadius: 26, paddingHorizontal: 3, overflow: 'hidden' as const };
}

function habitGlyph(habit: Habit) {
  const name = habit.name.toLocaleLowerCase();
  if (/water|drink|hydrat/.test(name)) return 'water';
  if (/workout|fitness|exercise|run|walk/.test(name)) return 'run-fast';
  if (/read|book|study|learn/.test(name)) return 'book-open-variant';
  if (/meditat|mindful|breath/.test(name)) return 'meditation';
  if (/sleep|bed/.test(name)) return 'moon-waning-crescent';
  return 'sprout';
}

function formatTime(value: string) {
  const [hourText, minute] = value.split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour) || !minute) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function alpha(hex: string, opacity: number) {
  const color = hex.replace('#', '');
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

const absoluteFill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };
