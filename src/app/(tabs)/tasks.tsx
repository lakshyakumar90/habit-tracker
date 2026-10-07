import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Button, IconButton, Screen } from '../../components/ui/Primitives';
import { useHabitlyActions, useHabitlyTasks, useHabitlyTheme } from '../../features/app/AppProvider';
import { TaskForm } from '../../features/tasks/TaskForm';
import type { Task } from '../../features/tasks/types';
import { palette } from '../../theme/tokens';
import { appRoute } from '../../utils/routes';
import { dateKey, shortDate } from '../../utils/dates';

type TaskFilter = 'Today' | 'Upcoming' | 'Completed';
const FILTERS: TaskFilter[] = ['Today', 'Upcoming', 'Completed'];

export default function Tasks() {
  useHabitlyTheme();
  const tasks = useHabitlyTasks();
  const { toggleTask, deleteTask } = useHabitlyActions();
  const [filter, setFilter] = useState<TaskFilter>('Today');
  const [showForm, setShowForm] = useState(false);
  const [actionTask, setActionTask] = useState<Task>();
  const [editingTask, setEditingTask] = useState<Task>();
  const [confirmDelete, setConfirmDelete] = useState<Task>();
  const today = dateKey();
  const visibleTasks = useMemo(() => tasks.filter(task => {
    if (filter === 'Completed') return task.completed;
    if (filter === 'Upcoming') return !task.completed && task.dueDate > today;
    return task.dueDate <= today;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || Number(a.completed) - Number(b.completed) || a.createdAt.localeCompare(b.createdAt)), [tasks, filter, today]);
  const dueToday = visibleTasks.filter(task => task.dueDate === today);
  const completed = dueToday.filter(task => task.completed).length;
  const percent = dueToday.length ? Math.round(completed / dueToday.length * 100) : 0;
  const openCreate = () => setShowForm(true);
  return <Screen safeBottom={false} style={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 112, gap: 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.6 }}>Tasks</Text><Text style={{ color: palette.muted, fontSize: 14, marginTop: 1 }}>Stay organized, get more done.</Text></View>
      <IconButton icon="magnify" accessibilityLabel="Search tasks" onPress={() => router.push(appRoute('/search'))} />
      <IconButton icon="plus" accessibilityLabel="Create task" onPress={openCreate} />
    </View>

    <View style={{ flexDirection: 'row', gap: 5, padding: 4, borderRadius: 18, backgroundColor: palette.surfaceSoft }}>
      {FILTERS.map(value => { const selected = filter === value; const count = value === 'Today' ? tasks.filter(task => task.dueDate <= today).length : value === 'Upcoming' ? tasks.filter(task => !task.completed && task.dueDate > today).length : tasks.filter(task => task.completed).length; return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={{ flex: 1, minHeight: 41, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: selected ? palette.purpleSoft : 'transparent' }}><Text style={{ color: selected ? palette.ink : palette.muted, fontSize: 12, fontWeight: selected ? '700' : '500' }}>{value}{count > 0 ? ` · ${count}` : ''}</Text></Pressable>; })}
    </View>

    {filter === 'Today' && <Animated.View entering={FadeInDown.duration(230)} style={{ padding: 15, borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ flex: 1, gap: 4 }}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>Today, {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text><Text style={{ color: palette.muted, fontSize: 12 }}>{completed} of {dueToday.length} completed</Text><View style={{ height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: palette.line, marginTop: 5 }}><View style={{ width: `${percent}%`, height: '100%', borderRadius: 5, backgroundColor: palette.purple }} /></View></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} accessibilityLabel={`${percent}% of today's tasks completed`} style={{ width: 74, height: 74, borderRadius: 38, borderWidth: 7, borderColor: percent ? palette.purple : palette.purpleSoft, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>{percent}%</Text></View>
    </Animated.View>}

    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 }}><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>{filter === 'Today' ? 'Your tasks' : filter === 'Upcoming' ? 'Coming up' : 'Completed'}</Text><Text style={{ color: palette.muted, fontSize: 12 }}>{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</Text></View>

    {visibleTasks.length ? <View style={{ borderRadius: 22, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, paddingHorizontal: 12, paddingVertical: 2 }}>
      {visibleTasks.map((task, index) => <TaskRow key={task.id} task={task} today={today} last={index === visibleTasks.length - 1} onOpen={() => router.push(appRoute({ pathname: '/task/[id]', params: { id: task.id } }))} onToggle={() => void toggleTask(task)} onMore={() => setActionTask(task)} />)}
    </View> : <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 18, gap: 8 }}>
      <MaterialCommunityIcons name={filter === 'Completed' ? 'check-circle-outline' : 'clipboard-check-outline'} size={36} color={palette.purple} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{filter === 'Completed' ? 'Nothing completed yet' : filter === 'Upcoming' ? 'Your calendar is clear' : 'A clear list for today'}</Text>
      <Text style={{ fontSize: 13, color: palette.muted, textAlign: 'center' }}>{filter === 'Upcoming' ? 'Tasks with a future due date will show here.' : 'Add a task whenever something needs a place.'}</Text>
      {filter !== 'Completed' && <Button label="Add a task" secondary onPress={openCreate} style={{ marginTop: 6 }} />}
    </View>}

    {showForm && <TaskForm task={editingTask} onClose={() => { setShowForm(false); setEditingTask(undefined); }} />}
    <ActionSheet visible={!!actionTask} title={actionTask?.title ?? 'Task'} subtitle="Choose an action" onClose={() => setActionTask(undefined)} actions={[{ label: 'Open task', icon: 'text-box-outline', onPress: () => actionTask && router.push(appRoute({ pathname: '/task/[id]', params: { id: actionTask.id } })) }, { label: 'Edit task', icon: 'pencil-outline', onPress: () => { if (actionTask) { setEditingTask(actionTask); setShowForm(true); } } }, { label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => setConfirmDelete(actionTask) }]} />
    <ActionSheet visible={!!confirmDelete} title="Delete this task?" subtitle="Its scheduled reminder will be cancelled." onClose={() => setConfirmDelete(undefined)} actions={[{ label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => { if (confirmDelete) void deleteTask(confirmDelete.id); setConfirmDelete(undefined); } }]} />
  </Screen>;
}

function TaskRow({ task, today, last, onOpen, onToggle, onMore }: { task: Task; today: string; last: boolean; onOpen: () => void; onToggle: () => void; onMore: () => void }) {
  const overdue = !task.completed && task.dueDate < today;
  const dueLabel = task.dueDate === today ? task.dueTime ? `Today, ${formatTime(task.dueTime)}` : 'Today' : `${overdue ? 'Overdue · ' : ''}${shortDate(task.dueDate)}${task.dueTime ? `, ${formatTime(task.dueTime)}` : ''}`;
  const flagColor = task.priority === 'high' ? palette.danger : task.priority === 'medium' ? palette.yellow : palette.muted;
  return <View style={{ minHeight: 69, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: last ? 0 : 1, borderBottomColor: palette.line }}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} onPress={onToggle} style={{ width: 42, height: 48, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${task.color}28` }}><MaterialCommunityIcons name={task.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={task.color} /><View style={{ position: 'absolute', right: -3, bottom: -3, width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: palette.card, backgroundColor: task.completed ? palette.purple : palette.card, alignItems: 'center', justifyContent: 'center' }}>{task.completed && <MaterialCommunityIcons name="check" size={11} color={palette.onPrimary} />}</View></View></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open task: ${task.title}`} onPress={onOpen} style={{ flex: 1, minHeight: 64, justifyContent: 'center', gap: 3 }}>
      <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '600', textDecorationLine: task.completed ? 'line-through' : 'none' }}>{task.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MaterialCommunityIcons name="calendar-month-outline" size={14} color={overdue ? palette.danger : palette.muted} /><Text style={{ color: overdue ? palette.danger : palette.muted, fontSize: 11 }}>{dueLabel}</Text>{task.listName && <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 11 }}> · {task.listName}</Text>}{task.notificationIds.length > 0 && <MaterialCommunityIcons name="bell-check-outline" size={13} color={palette.purple} />}</View>
    </Pressable>
    {task.priority !== 'low' && task.priority !== 'none' && <MaterialCommunityIcons name="flag" size={18} color={flagColor} />}
    <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${task.title}`} onPress={onMore} style={{ width: 38, height: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="dots-horizontal" size={21} color={palette.ink} /></Pressable>
  </View>;
}

function formatTime(value: string) { const [h, m] = value.split(':'); const hour = Number(h); return Number.isFinite(hour) && m ? `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}` : value; }
