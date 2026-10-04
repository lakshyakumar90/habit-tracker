import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Button } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { TaskForm } from '../../features/tasks/TaskForm';
import type { TaskSubtask } from '../../features/tasks/types';
import { palette } from '../../theme/tokens';
import { dateKey, shortDate } from '../../utils/dates';

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, toggleTask, setTaskSubtasks, deleteTask, resolvedTheme } = useHabitly();
  const task = tasks.find(item => item.id === id);
  const [formOpen, setFormOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const progress = useMemo(() => {
    const all = task?.subtasks ?? [];
    return { done: all.filter(item => item.completed).length, total: all.length };
  }, [task?.subtasks]);

  if (!task) return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.canvas, padding: 24 }}><MaterialCommunityIcons name="clipboard-alert-outline" size={36} color={palette.purple} /><Text style={{ color: palette.ink, fontSize: 18, fontWeight: '700', marginTop: 12 }}>Task not found</Text><Pressable accessibilityRole="button" onPress={() => router.back()} style={{ padding: 14 }}><Text style={{ color: palette.purple, fontWeight: '700' }}>Go back</Text></Pressable></SafeAreaView>;

  const priorityColor = task.priority === 'high' ? palette.danger : task.priority === 'medium' ? palette.yellow : task.priority === 'low' ? palette.purple : palette.muted;
  const dueText = task.dueDate === dateKey() ? 'Today' : shortDate(task.dueDate);
  const toggleSubtask = (subtask: TaskSubtask) => void setTaskSubtasks(task.id, task.subtasks.map(item => item.id === subtask.id ? { ...item, completed: !item.completed } : item));
  const addSubtask = () => {
    const title = subtaskTitle.trim();
    if (!title) return;
    void setTaskSubtasks(task.id, [...task.subtasks, { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, title, completed: false }]);
    setSubtaskTitle(''); setSubtaskOpen(false);
  };

  return <View style={{ flex: 1, backgroundColor: palette.canvas, overflow: 'hidden' }}>
    <View pointerEvents="none" style={{ position: 'absolute', top: -130, right: -150, width: 330, height: 330, borderRadius: 170, backgroundColor: palette.purpleSoft }} />
    <View pointerEvents="none" style={{ position: 'absolute', bottom: -170, left: -130, width: 330, height: 330, borderRadius: 170, backgroundColor: palette.yellowSoft }} />
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <HeaderIcon icon="arrow-left" label="Go back" onPress={() => router.back()} />
        <View style={{ flexDirection: 'row', gap: 8 }}><HeaderIcon icon="pencil-outline" label="Edit task" onPress={() => setFormOpen(true)} /><HeaderIcon icon="dots-horizontal" label="More task actions" onPress={() => setActionsOpen(true)} /></View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 19, paddingTop: 14, paddingBottom: 22, gap: 16 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(200)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={task.completed ? 'Mark task incomplete' : 'Mark task complete'} onPress={() => void toggleTask(task)} style={{ width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${task.color}28` }}><MaterialCommunityIcons name={task.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color={task.color} /><View style={{ position: 'absolute', right: 1, bottom: 1, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.card, backgroundColor: task.completed ? palette.purple : palette.card }}>{task.completed && <MaterialCommunityIcons name="check" size={12} color={palette.onPrimary} />}</View></Pressable>
          <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <Text style={{ color: palette.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.35 }}>{task.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 9 }}>
              <MaterialCommunityIcons name="calendar-month-outline" size={16} color={palette.muted} /><Text style={{ color: palette.muted, fontSize: 13 }}>{dueText}{task.dueTime ? `, ${formatTime(task.dueTime)}` : ''}</Text>
              {task.priority !== 'none' && <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: `${priorityColor}22`, flexDirection: 'row', alignItems: 'center', gap: 4 }}><MaterialCommunityIcons name="flag" size={14} color={priorityColor} /><Text style={{ color: priorityColor, fontSize: 11, fontWeight: '700' }}>{task.priority[0].toUpperCase() + task.priority.slice(1)} Priority</Text></View>}
              {task.repeatRule !== 'none' && <View style={{ paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: palette.purpleSoft, flexDirection: 'row', alignItems: 'center', gap: 4 }}><MaterialCommunityIcons name="autorenew" size={13} color={palette.purple} /><Text style={{ color: palette.purple, fontSize: 10, fontWeight: '700' }}>{repeatLabel(task.repeatRule)}</Text></View>}
            </View>
          </View>
        </Animated.View>

        {!!task.notes && <Panel><Text style={{ color: palette.muted, fontSize: 14, lineHeight: 21 }}>{task.notes}</Text></Panel>}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}><Text style={sectionTitle}>Subtasks</Text><Text style={{ color: palette.muted, fontSize: 12 }}>{progress.done} of {progress.total} completed</Text></View>
        <Panel style={{ paddingHorizontal: 13, paddingVertical: 5 }}>
          {task.subtasks.map((subtask, index) => <View key={subtask.id} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: index === task.subtasks.length - 1 ? 0 : 1, borderBottomColor: palette.line }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: subtask.completed }} accessibilityLabel={`${subtask.completed ? 'Reopen' : 'Complete'} ${subtask.title}`} onPress={() => toggleSubtask(subtask)} style={{ width: 35, height: 40, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: subtask.completed ? palette.purple : 'transparent', borderWidth: subtask.completed ? 0 : 1.5, borderColor: palette.purple }}>{subtask.completed && <MaterialCommunityIcons name="check" size={16} color={palette.onPrimary} />}</View></Pressable>
            <Text style={{ flex: 1, color: subtask.completed ? palette.muted : palette.ink, fontSize: 13, textDecorationLine: subtask.completed ? 'line-through' : 'none' }}>{subtask.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${subtask.title}`} onPress={() => void setTaskSubtasks(task.id, task.subtasks.filter(item => item.id !== subtask.id))} hitSlop={10} style={{ padding: 7 }}><MaterialCommunityIcons name="close" size={16} color={palette.muted} /></Pressable>
          </View>)}
          <Pressable accessibilityRole="button" onPress={() => setSubtaskOpen(true)} style={{ minHeight: 46, marginTop: task.subtasks.length ? 5 : 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name="plus" size={20} color={palette.purple} /><Text style={{ color: palette.purple, fontSize: 13, fontWeight: '700' }}>Add subtask</Text></Pressable>
        </Panel>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <InfoTile icon="calendar-month-outline" label="Due date" value={`${dueText}${task.dueTime ? `\n${formatTime(task.dueTime)}` : ''}`} />
          <InfoTile icon="format-list-bulleted" label="List" value={task.listName} />
        </View>
        {task.reminders.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingHorizontal: 4 }}><MaterialCommunityIcons name="bell-outline" size={17} color={palette.purple} /><Text style={{ flex: 1, color: palette.muted, fontSize: 12, lineHeight: 18 }}>Reminders: {task.reminders.map(reminderLabel).join(', ')}</Text></View>}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
          <Pressable accessibilityRole="button" onPress={() => void toggleTask(task)} style={{ flex: 1, minHeight: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name={task.completed ? 'undo' : 'check'} size={19} color={palette.purple} /><Text style={{ color: palette.purple, fontSize: 13, fontWeight: '700' }}>{task.completed ? 'Reopen task' : 'Mark Complete'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => setFormOpen(true)} style={{ flex: 1, minHeight: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, backgroundColor: resolvedTheme === 'dark' ? palette.purple : '#19181D' }}><MaterialCommunityIcons name="pencil-outline" size={18} color={palette.onPrimary} /><Text style={{ color: palette.onPrimary, fontSize: 13, fontWeight: '700' }}>Edit Task</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
    {formOpen && <TaskForm key={task.id} task={task} onClose={() => setFormOpen(false)} />}
    <ActionSheet visible={actionsOpen} title={task.title} subtitle="Manage this task" onClose={() => setActionsOpen(false)} actions={[{ label: 'Edit task', icon: 'pencil-outline', onPress: () => setFormOpen(true) }, { label: task.completed ? 'Mark incomplete' : 'Mark complete', icon: task.completed ? 'undo' : 'check', onPress: () => void toggleTask(task) }, { label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => setDeleteOpen(true) }]} />
    <ActionSheet visible={deleteOpen} title="Delete this task?" subtitle="Its scheduled reminder will be cancelled." onClose={() => setDeleteOpen(false)} actions={[{ label: 'Delete task', icon: 'delete-outline', destructive: true, onPress: () => { void deleteTask(task.id); router.back(); } }]} />
    <SubtaskDialog visible={subtaskOpen} value={subtaskTitle} onChange={setSubtaskTitle} onClose={() => setSubtaskOpen(false)} onSave={addSubtask} />
  </View>;
}

function HeaderIcon({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={palette.ink} /></Pressable>; }
function Panel({ children, style }: { children: React.ReactNode; style?: object }) { return <Animated.View entering={FadeInDown.duration(210)} style={[{ padding: 16, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card }, style]}>{children}</Animated.View>; }
function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) { return <View style={{ flex: 1, minHeight: 74, padding: 11, borderRadius: 19, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={{ width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={palette.purple} /></View><View style={{ flex: 1, gap: 3 }}><Text style={{ color: palette.muted, fontSize: 11 }}>{label}</Text><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>{value}</Text></View></View>; }
function SubtaskDialog({ visible, value, onChange, onClose, onSave }: { visible: boolean; value: string; onChange: (value: string) => void; onClose: () => void; onSave: () => void }) { return <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}><View style={{ padding: 20, paddingBottom: 28, gap: 14, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: palette.canvas }}><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800' }}>Add a subtask</Text><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceSoft }}><MaterialCommunityIcons name="close" size={20} color={palette.ink} /></Pressable></View><TextInput accessibilityLabel="Subtask title" autoFocus value={value} onChangeText={onChange} onSubmitEditing={onSave} returnKeyType="done" placeholder="e.g. Draft the introduction" placeholderTextColor={palette.muted} maxLength={100} style={{ minHeight: 52, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, color: palette.ink, fontSize: 15 }} /><Button label="Add subtask" onPress={onSave} /></View></KeyboardAvoidingView></Modal>; }
function formatTime(value: string) { const [h, m] = value.split(':'); const hour = Number(h); return Number.isFinite(hour) && m ? `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}` : value; }
function repeatLabel(rule: string) { return rule === 'custom' ? 'Custom repeat' : `Repeats ${rule}`; }
function reminderLabel(offset: number) { if (!offset) return 'at due time'; if (offset === 1440) return '1 day before'; if (offset % 60 === 0) return `${offset / 60} hour${offset === 60 ? '' : 's'} before`; return `${offset} minutes before`; }
const sectionTitle = { color: palette.ink, fontSize: 17, fontWeight: '700' as const };
