import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useHabitly } from '../app/AppProvider';
import type { Task, TaskDraft } from './types';
import { Button } from '../../components/ui/Primitives';
import { palette } from '../../theme/tokens';
import { dateKey, addDays } from '../../utils/dates';
import { CalendarDialog, TimeDialog } from '../../components/ui/DateTimeDialogs';

const LISTS = ['Personal', 'Work', 'Health', 'Study'];
const PRIORITIES: { value: Task['priority']; title: string; icon: string; color: string }[] = [
  { value: 'low', title: 'Low', icon: 'flag', color: palette.purple },
  { value: 'medium', title: 'Medium', icon: 'flag', color: palette.yellow },
  { value: 'high', title: 'High', icon: 'flag', color: palette.danger },
  { value: 'none', title: 'None', icon: 'cancel', color: palette.muted },
];

export function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  const { addTask } = useHabitly();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? dateKey());
  const [reminderAt, setReminderAt] = useState<string | null>(task?.reminderAt ?? null);
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [listName, setListName] = useState(task?.listName ?? 'Personal');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateText = new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const goBack = () => step === 2 ? setStep(1) : onClose();
  const continueToReminder = () => {
    if (!title.trim()) { setError('Add a task title before continuing.'); return; }
    setError('');
    setStep(2);
  };
  const save = async (skipReminder = false) => {
    if (saving) return;
    if (!title.trim()) { setStep(1); setError('Add a task title before saving.'); return; }
    setSaving(true);
    try {
      const draft: TaskDraft = { id: task?.id, title: title.trim(), notes: notes.trim(), dueDate, priority, reminderAt: skipReminder ? null : reminderAt, listName, subtasks: task?.subtasks ?? [] };
      const reminderError = await addTask(draft);
      if (reminderError) { setError(`Task saved, but its reminder was not set: ${reminderError}`); return; }
      onClose();
    } finally { setSaving(false); }
  };

  return <>
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={goBack}>
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas }} edges={['top', 'bottom', 'left', 'right']}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -150, right: -140, width: 300, height: 300, borderRadius: 160, backgroundColor: palette.purpleSoft }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -180, left: -130, width: 340, height: 340, borderRadius: 180, backgroundColor: palette.yellowSoft }} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? 'Close task form' : 'Back to task details'} onPress={goBack} style={roundButton}><MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} /></Pressable>
            <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>{[0, 1].map(index => <View key={index} style={{ flex: 1, height: 5, borderRadius: 4, backgroundColor: step > index ? palette.purple : palette.line }} />)}</View>
            <Text style={{ color: palette.muted, fontSize: 13, fontWeight: '600' }}>{step}/2</Text>
          </View>
          <ScrollView key={step} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 }}>
            <Animated.View entering={FadeInRight.duration(180)} exiting={FadeOutLeft.duration(120)} style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 }}>{step === 1 ? task ? 'Edit task' : 'Create New Task' : 'Make it actionable'}</Text>
              <Text style={{ color: palette.muted, fontSize: 14, marginTop: 5, marginBottom: 20 }}>{step === 1 ? 'Break it down and make it happen.' : 'Choose a reminder and a place for this task.'}</Text>

              {step === 1 ? <>
                <FieldLabel>Task title</FieldLabel>
                <View style={inputShell}><MaterialCommunityIcons name="text-box-outline" size={20} color={palette.ink} /><TextInput accessibilityLabel="Task title" value={title} onChangeText={setTitle} placeholder="e.g. Finish project report" placeholderTextColor={palette.muted} maxLength={120} autoFocus={!task} returnKeyType="next" style={input} /></View>
                <FieldLabel style={{ marginTop: 19 }}>Description <Text style={{ color: palette.muted, fontWeight: '400' }}>(optional)</Text></FieldLabel>
                <View style={[inputShell, { minHeight: 94, alignItems: 'flex-start', paddingTop: 13 }]}><MaterialCommunityIcons name="text-box-outline" size={19} color={palette.ink} style={{ marginTop: 1 }} /><TextInput accessibilityLabel="Task description" value={notes} onChangeText={setNotes} placeholder="Add more details..." placeholderTextColor={palette.muted} multiline maxLength={300} textAlignVertical="top" style={[input, { minHeight: 65 }]} /></View>

                <FieldLabel style={{ marginTop: 20 }}>Due date</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <DateChoice label="Today" icon="calendar-today" selected={dueDate === dateKey()} onPress={() => setDueDate(dateKey())} />
                  <DateChoice label="Tomorrow" icon="weather-sunny" selected={dueDate === dateKey(addDays(new Date(), 1))} onPress={() => setDueDate(dateKey(addDays(new Date(), 1)))} />
                  <DateChoice label="Pick date" icon="calendar-month-outline" selected={dueDate !== dateKey() && dueDate !== dateKey(addDays(new Date(), 1))} onPress={() => setCalendarOpen(true)} />
                </View>
                {dueDate !== dateKey() && dueDate !== dateKey(addDays(new Date(), 1)) && <Text style={{ color: palette.muted, fontSize: 12, marginTop: 7 }}>{dateText}</Text>}

                <FieldLabel style={{ marginTop: 20 }}>Priority</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 7, marginTop: 8 }}>
                  {PRIORITIES.map(item => { const selected = priority === item.value; return <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setPriority(item.value)} style={{ flex: 1, minHeight: 68, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 16, borderWidth: selected ? 1 : 0, borderColor: item.color, backgroundColor: selected ? item.color + '20' : palette.card }}><MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={item.color} /><Text style={{ color: selected ? palette.ink : palette.muted, fontSize: 11, fontWeight: selected ? '700' : '500' }}>{item.title}</Text></Pressable>; })}
                </View>
              </> : <>
                <View style={{ padding: 15, borderRadius: 20, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, marginBottom: 18 }}>
                  <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>{title.trim()}</Text>
                  <Text style={{ color: palette.muted, fontSize: 13, marginTop: 6 }}>{dateText}{priority !== 'none' ? ` · ${priority} priority` : ''}</Text>
                </View>
                <FieldLabel>Reminder <Text style={{ color: palette.muted, fontWeight: '400' }}>(optional)</Text></FieldLabel>
                <Pressable accessibilityRole="button" accessibilityLabel={reminderAt ? `Reminder at ${formatTime(reminderAt)}. Change time` : 'Choose reminder time'} onPress={() => setTimeOpen(true)} style={[inputShell, { marginTop: 8, minHeight: 55 }]}><MaterialCommunityIcons name="bell-outline" size={20} color={palette.purple} /><Text style={{ color: reminderAt ? palette.ink : palette.muted, fontSize: 14, flex: 1 }}>{reminderAt ? formatTime(reminderAt) : 'Choose a time'}</Text>{reminderAt && <Pressable accessibilityRole="button" accessibilityLabel="Remove reminder" onPress={() => setReminderAt(null)} hitSlop={8}><MaterialCommunityIcons name="close-circle" size={19} color={palette.muted} /></Pressable>}</Pressable>
                <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }}>A local reminder will arrive on the due date at this time.</Text>

                <FieldLabel style={{ marginTop: 22 }}>Add to list <Text style={{ color: palette.muted, fontWeight: '400' }}>(optional)</Text></FieldLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{LISTS.map(name => <Pressable key={name} accessibilityRole="radio" accessibilityState={{ selected: listName === name }} onPress={() => setListName(name)} style={{ minWidth: '46%', flexGrow: 1, minHeight: 50, paddingHorizontal: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: listName === name ? palette.purpleSoft : palette.card, borderWidth: listName === name ? 1 : 0, borderColor: palette.purple }}><MaterialCommunityIcons name="format-list-bulleted" size={18} color={listName === name ? palette.purple : palette.muted} /><Text style={{ flex: 1, color: palette.ink, fontSize: 13, fontWeight: listName === name ? '700' : '500' }}>{name}</Text>{listName === name && <MaterialCommunityIcons name="check-circle" size={17} color={palette.purple} />}</Pressable>)}</View>
              </>}
              {!!error && <Text accessibilityRole="alert" style={{ color: palette.danger, fontSize: 13, marginTop: 14 }}>{error}</Text>}
            </Animated.View>
          </ScrollView>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, backgroundColor: palette.canvas }}>
            <Button label={saving ? 'Saving…' : step === 1 ? 'Continue  →' : task ? 'Save task' : 'Create task'} onPress={step === 1 ? continueToReminder : () => void save()} style={{ width: '100%' }} />
            {step === 2 && !task && <Pressable accessibilityRole="button" disabled={saving} onPress={() => void save(true)} style={{ alignItems: 'center', padding: 10, opacity: saving ? 0.5 : 1 }}><Text style={{ color: palette.muted, fontSize: 13 }}>Skip reminder and create task</Text></Pressable>}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
    <CalendarDialog visible={calendarOpen} value={dueDate} title="Choose due date" onClose={() => setCalendarOpen(false)} onSelect={setDueDate} />
    <TimeDialog visible={timeOpen} value={reminderAt ?? '09:00'} title="Task reminder" onClose={() => setTimeOpen(false)} onSelect={setReminderAt} />
  </>;
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: object }) { return <Text style={[{ color: palette.ink, fontSize: 14, fontWeight: '700' }, style]}>{children}</Text>; }
function DateChoice({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ flex: 1, minHeight: 67, alignItems: 'flex-start', justifyContent: 'center', gap: 4, paddingHorizontal: 10, borderRadius: 15, borderWidth: selected ? 1.5 : 1, borderColor: selected ? palette.purple : palette.line, backgroundColor: selected ? palette.purpleSoft : palette.card }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={selected ? palette.purple : palette.ink} /><Text style={{ color: palette.ink, fontSize: 12, fontWeight: selected ? '700' : '500' }}>{label}</Text></Pressable>;
}
function formatTime(value: string) { const [hourText, minute] = value.split(':'); const hour = Number(hourText); if (!Number.isFinite(hour) || !minute) return value; return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`; }
const roundButton = { width: 42, height: 42, borderRadius: 21, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line };
const inputShell = { minHeight: 54, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: palette.input, borderWidth: 1, borderColor: palette.line };
const input = { flex: 1, padding: 0, color: palette.ink, fontSize: 14 } as const;
