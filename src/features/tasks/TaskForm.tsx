import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { Button } from '../../components/ui/Primitives';
import { SmoothSwitch } from '../../components/ui/SmoothSwitch';
import { CalendarDialog, TimeDialog } from '../../components/ui/DateTimeDialogs';
import { useHabitlyActions, useHabitlyTasks, useHabitlyTheme } from '../app/AppProvider';
import { preferencesRepository } from '../../database/repositories';
import type { Task, TaskDraft, TaskRepeatRule, TaskSubtask } from './types';
import { palette } from '../../theme/tokens';
import { addDays, dateKey } from '../../utils/dates';

const DEFAULT_LISTS = ['Personal', 'Work', 'Health', 'Study'];
const ICONS = ['clipboard-text', 'calendar-month-outline', 'cart-outline', 'phone-outline', 'laptop', 'book-open-variant', 'weight-lifter', 'heart-outline', 'airplane', 'dots-horizontal'];
const COLORS = ['#6750C7', '#F1C95B', '#F59B95', '#F07883', '#75B9EA', '#71C99A', '#B782D8'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const REMINDER_OPTIONS = [{ offset: 1440, label: '1 day before' }, { offset: 60, label: '1 hour before' }, { offset: 30, label: '30 minutes before' }, { offset: 15, label: '15 minutes before' }, { offset: 0, label: 'At due time' }];
const PRIORITIES: { value: Task['priority']; title: string; icon: string; colorKey: 'purple' | 'yellow' | 'danger' | 'muted' }[] = [
  { value: 'low', title: 'Low', icon: 'flag', colorKey: 'purple' }, { value: 'medium', title: 'Medium', icon: 'flag', colorKey: 'yellow' },
  { value: 'high', title: 'High', icon: 'flag', colorKey: 'danger' }, { value: 'none', title: 'None', icon: 'cancel', colorKey: 'muted' },
];

export function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  useHabitlyTheme();
  const { addTask } = useHabitlyActions();
  const tasks = useHabitlyTasks();
  const { width } = useWindowDimensions();
  const iconCellWidth = (width - 64 - 32) / 5;
  const [step, setStep] = useState(1);
  const [recordId, setRecordId] = useState(task?.id);
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [icon, setIcon] = useState(task?.icon ?? ICONS[0]);
  const [color, setColor] = useState(task?.color ?? COLORS[0]);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? dateKey());
  const [dueTime, setDueTime] = useState<string | null>(task?.dueTime ?? '17:00');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [repeatRule, setRepeatRule] = useState<TaskRepeatRule>(task?.repeatRule ?? 'none');
  const [repeatDays, setRepeatDays] = useState(task?.repeatDays ?? [new Date().getDay()]);
  const [listName, setListName] = useState(task?.listName ?? 'Personal');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(task?.subtasks ?? []);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(task ? task.reminders.length > 0 : true);
  const [reminders, setReminders] = useState(task?.reminders ?? [60]);
  const [reminderSheet, setReminderSheet] = useState<'add' | number | null>(null);
  const [listSheet, setListSheet] = useState(false);
  const [lists, setLists] = useState(DEFAULT_LISTS);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listError, setListError] = useState('');
  const [customReminderOpen, setCustomReminderOpen] = useState(false);
  const customReminderTarget = useRef<'add' | number>('add');
  useEffect(() => {
    let active = true;
    void preferencesRepository.get('taskLists', '[]').then(raw => {
      let saved: string[] = [];
      try { const parsed: unknown = JSON.parse(raw); if (Array.isArray(parsed)) saved = parsed.filter((value): value is string => typeof value === 'string'); } catch { /* Keep existing task lists. */ }
      if (active) setLists([...new Set([...DEFAULT_LISTS, ...saved, ...tasks.map(item => item.listName), listName].map(value => value.trim()).filter(Boolean))]);
    });
    return () => { active = false; };
  }, [tasks, listName]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const dateText = new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const dueToday = dueDate === dateKey();
  const tomorrow = dateKey(addDays(new Date(), 1));
  const goBack = () => step > 1 ? setStep(step - 1) : onClose();
  const continueTo = (next: number) => {
    if (step === 1 && !title.trim()) { setError('Add a task title before continuing.'); return; }
    setError(''); setStep(next);
  };
  const toggleDay = (day: number) => setRepeatDays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day].sort((a, b) => a - b));
  const addSubtask = () => {
    const value = subtaskDraft.trim();
    if (!value) return;
    setSubtasks(current => [...current, { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, title: value, completed: false }]);
    setSubtaskDraft(''); setAddingSubtask(false);
  };
  const chooseReminder = (offset: number, target = reminderSheet) => {
    if (target === 'add') setReminders(current => current.includes(offset) ? current : [...current, offset].sort((a, b) => b - a));
    else if (typeof target === 'number') setReminders(current => current.map((value, index) => index === target ? offset : value).filter((value, index, all) => all.indexOf(value) === index).sort((a, b) => b - a));
  };
  const createList = async () => {
    const name = newListName.trim();
    if (!name) { setListError('Enter a list name.'); return; }
    const existing = lists.find(value => value.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (existing) { setListName(existing); setCreateListOpen(false); return; }
    const next = [...lists, name];
    try {
      await preferencesRepository.set('taskLists', JSON.stringify(next));
      setLists(next); setListName(name); setNewListName(''); setListError(''); setCreateListOpen(false);
    } catch { setListError('Could not save the list. Try again.'); }
  };
  const chooseCustomReminder = (time: string) => {
    if (!dueTime) return;
    const [dueHour, dueMinute] = dueTime.split(':').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const offset = ((dueHour * 60 + dueMinute - hour * 60 - minute) + 1440) % 1440;
    chooseReminder(offset, customReminderTarget.current);
    setCustomReminderOpen(false);
  };
  const save = async () => {
    if (saving) return;
    if (!title.trim()) { setStep(1); setError('Add a task title before saving.'); return; }
    if (remindersEnabled && reminders.length && !dueTime) { setError('Choose a due time or turn reminders off.'); return; }
    if (repeatRule === 'custom' && !repeatDays.length) { setError('Choose at least one repeat day.'); return; }
    setSaving(true); setError('');
    try {
      const draft: TaskDraft = { id: recordId, title: title.trim(), notes: notes.trim(), dueDate, dueTime, priority, listName, subtasks, icon, color, repeatRule, repeatDays, reminders: remindersEnabled ? reminders : [] };
      const result = await addTask(draft);
      setRecordId(result.id);
      if (result.reminderError) { setError(`Task saved, but reminders could not be scheduled: ${result.reminderError}`); return; }
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? `Could not save the task: ${reason.message}` : 'Could not save the task. Try again.');
    } finally { setSaving(false); }
  };

  return <>
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={goBack}>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close task form" onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <SafeAreaView style={{ flex: 1, marginHorizontal: 12, marginTop: 18, marginBottom: 6, borderRadius: 25, overflow: 'hidden', backgroundColor: palette.canvas }} edges={['top', 'bottom', 'left', 'right']}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -150, right: -140, width: 300, height: 300, borderRadius: 160, backgroundColor: palette.purpleSoft }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -180, left: -130, width: 340, height: 340, borderRadius: 180, backgroundColor: palette.yellowSoft }} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <View style={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? 'Close task form' : 'Previous task step'} onPress={goBack} style={roundButton()}><MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} /></Pressable>
            <View style={{ flex: 1, flexDirection: 'row', gap: 5 }}>{[1, 2, 3].map(index => <View key={index} style={{ flex: 1, height: 5, borderRadius: 4, backgroundColor: step >= index ? palette.purple : palette.line }} />)}</View>
            <Text style={{ color: palette.muted, fontSize: 13, fontWeight: '600' }}>{step}/3</Text>
          </View>
          <ScrollView key={step} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 }}>
            <Animated.View entering={FadeInRight.duration(180)} exiting={FadeOutLeft.duration(120)} style={{ flex: 1 }}>
              <Text style={{ color: palette.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.6 }}>{step === 1 ? task ? 'Edit task' : 'Create New Task' : step === 2 ? 'When do you want to do it?' : 'Subtasks & reminders'}</Text>
              <Text style={{ color: palette.muted, fontSize: 14, marginTop: 5, marginBottom: 19 }}>{step === 1 ? 'Break it down and make it happen.' : step === 2 ? 'Set a date, time and priority.' : 'Make it easier to complete.'}</Text>

              {step === 1 && <>
                <FieldLabel>Task title</FieldLabel>
                <View style={inputShell()}><MaterialCommunityIcons name="text-box-outline" size={20} color={palette.ink} /><TextInput accessibilityLabel="Task title" value={title} onChangeText={setTitle} placeholder="e.g. Finish project report" placeholderTextColor={palette.muted} maxLength={120} autoFocus={!task} returnKeyType="next" style={input()} /></View>
                <FieldLabel style={{ marginTop: 17 }}>Description <Text style={optional()}>(optional)</Text></FieldLabel>
                <View style={[inputShell(), { minHeight: 86, alignItems: 'flex-start', paddingTop: 12 }]}><MaterialCommunityIcons name="text-box-outline" size={19} color={palette.ink} style={{ marginTop: 1 }} /><TextInput accessibilityLabel="Task description" value={notes} onChangeText={setNotes} placeholder="Add more details..." placeholderTextColor={palette.muted} multiline maxLength={300} textAlignVertical="top" style={[input(), { minHeight: 60 }]} /></View>

                <View style={sectionHeader}><FieldLabel>Choose an icon</FieldLabel><Pressable accessibilityRole="button" accessibilityState={{ expanded: showAllIcons }} onPress={() => setShowAllIcons(value => !value)}><Text style={{ color: palette.muted, fontSize: 12 }}>{showAllIcons ? 'Show less' : 'See all'}</Text></Pressable></View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 }}>{(showAllIcons ? ICONS : ICONS.slice(0, 5)).map(item => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: icon === item }} accessibilityLabel={`Task icon ${item}`} onPress={() => setIcon(item)} style={{ width: iconCellWidth, height: iconCellWidth, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: icon === item ? palette.purpleSoft : palette.surfaceSoft, borderWidth: icon === item ? 1.5 : 0, borderColor: palette.purple }}><View style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={item as keyof typeof MaterialCommunityIcons.glyphMap} size={23} color={palette.ink} /></View></Pressable>)}</View>

                <FieldLabel style={{ marginTop: 18 }}>Choose a color</FieldLabel>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>{COLORS.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: color === value }} accessibilityLabel={`Task color ${value}`} onPress={() => setColor(value)} style={{ width: 38, height: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: value + '38', borderWidth: color === value ? 2 : 0, borderColor: value }}><View style={{ width: 25, height: 25, borderRadius: 14, backgroundColor: value }} />{color === value && <View style={{ position: 'absolute', width: 44, height: 44, borderRadius: 23, borderWidth: 1.4, borderColor: value }} />}</Pressable>)}</View>
              </>}

              {step === 2 && <>
                <FieldLabel>Due date</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <DateChoice label="Today" icon="calendar-today" selected={dueToday} onPress={() => setDueDate(dateKey())} />
                  <DateChoice label="Tomorrow" icon="weather-sunny" selected={dueDate === tomorrow} onPress={() => setDueDate(tomorrow)} />
                  <DateChoice label="Pick date" icon="calendar-month-outline" selected={!dueToday && dueDate !== tomorrow} onPress={() => setCalendarOpen(true)} />
                </View>
                {!dueToday && dueDate !== tomorrow && <Text style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>{dateText}</Text>}

                <FieldLabel style={{ marginTop: 17 }}>Time <Text style={optional()}>(optional)</Text></FieldLabel>
                <Pressable accessibilityRole="button" accessibilityLabel={dueTime ? `Due time ${formatTime(dueTime)}. Change` : 'Choose due time'} onPress={() => setTimeOpen(true)} style={[inputShell(), { marginTop: 7, minHeight: 52 }]}><MaterialCommunityIcons name="clock-outline" size={20} color={palette.purple} /><Text style={{ color: dueTime ? palette.ink : palette.muted, fontSize: 14, flex: 1 }}>{dueTime ? formatTime(dueTime) : 'Choose a time'}</Text>{dueTime && <Pressable accessibilityRole="button" accessibilityLabel="Clear due time" onPress={() => setDueTime(null)} hitSlop={8}><MaterialCommunityIcons name="close-circle" size={19} color={palette.muted} /></Pressable>}</Pressable>

                <FieldLabel style={{ marginTop: 17 }}>Repeat <Text style={optional()}>(optional)</Text></FieldLabel>
                <View style={{ flexDirection: 'row', gap: 7, marginTop: 7 }}>{(['none', 'daily', 'weekly', 'custom'] as const).map(rule => <Pressable key={rule} accessibilityRole="radio" accessibilityState={{ selected: repeatRule === rule }} onPress={() => setRepeatRule(rule)} style={{ flex: 1, minHeight: 61, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 15, backgroundColor: repeatRule === rule ? palette.purpleSoft : palette.card, borderWidth: repeatRule === rule ? 1.5 : 1, borderColor: repeatRule === rule ? palette.purple : palette.line }}><MaterialCommunityIcons name={repeatIcon(rule)} size={18} color={repeatRule === rule ? palette.purple : palette.ink} /><Text style={{ color: repeatRule === rule ? palette.ink : palette.muted, fontSize: 10, fontWeight: repeatRule === rule ? '700' : '500' }}>{capitalize(rule)}</Text></Pressable>)}</View>
                {repeatRule === 'custom' && <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>{DAYS.map((day, index) => <Pressable key={`${day}-${index}`} accessibilityRole="checkbox" accessibilityState={{ checked: repeatDays.includes(index) }} accessibilityLabel={`Repeat on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]}`} onPress={() => toggleDay(index)} style={{ width: 37, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: repeatDays.includes(index) ? palette.purple : palette.surfaceSoft }}><Text style={{ color: repeatDays.includes(index) ? palette.onPrimary : palette.muted, fontSize: 12, fontWeight: '700' }}>{day}</Text></Pressable>)}</View>}

                <FieldLabel style={{ marginTop: 17 }}>Priority</FieldLabel>
                <View style={{ flexDirection: 'row', gap: 7, marginTop: 7 }}>{PRIORITIES.map(item => { const selected = priority === item.value; const color = palette[item.colorKey]; return <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setPriority(item.value)} style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 15, borderWidth: selected ? 1 : 0, borderColor: color, backgroundColor: selected ? color + '20' : palette.card }}><MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={color} /><Text style={{ color: selected ? palette.ink : palette.muted, fontSize: 10, fontWeight: selected ? '700' : '500' }}>{item.title}</Text></Pressable>; })}</View>

                <View style={[sectionHeader, { marginTop: 18 }]}><FieldLabel>Add to list <Text style={optional()}>(optional)</Text></FieldLabel></View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Task list: ${listName}. Change list`} onPress={() => setListSheet(true)} style={[inputShell(), { marginTop: 7, minHeight: 50 }]}><MaterialCommunityIcons name="format-list-bulleted" size={19} color={palette.purple} /><Text style={{ color: palette.ink, flex: 1, fontSize: 14 }}>{listName}</Text><MaterialCommunityIcons name="chevron-down" size={19} color={palette.muted} /></Pressable>
              </>}

              {step === 3 && <>
                <Panel>
                  <View style={sectionHeader}><FieldLabel>Subtasks <Text style={optional()}>(optional)</Text></FieldLabel><Text style={{ color: palette.muted, fontSize: 11 }}>{subtasks.filter(item => item.completed).length} of {subtasks.length} completed</Text></View>
                  {subtasks.map((item, index) => <View key={item.id} style={{ minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: index === subtasks.length - 1 ? 0 : 1, borderBottomColor: palette.line }}>
                    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.completed }} accessibilityLabel={`${item.completed ? 'Reopen' : 'Complete'} ${item.title}`} onPress={() => setSubtasks(current => current.map(subtask => subtask.id === item.id ? { ...subtask, completed: !subtask.completed } : subtask))} style={{ width: 30, height: 40, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 21, height: 21, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: item.completed ? palette.purple : 'transparent', borderWidth: item.completed ? 0 : 1.5, borderColor: palette.purple }}>{item.completed && <MaterialCommunityIcons name="check" size={15} color={palette.onPrimary} />}</View></Pressable>
                    <Text numberOfLines={1} style={{ flex: 1, color: item.completed ? palette.muted : palette.ink, fontSize: 12, textDecorationLine: item.completed ? 'line-through' : 'none' }}>{item.title}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${item.title}`} onPress={() => setSubtasks(current => current.filter(subtask => subtask.id !== item.id))} hitSlop={8} style={{ padding: 7 }}><MaterialCommunityIcons name="close" size={16} color={palette.muted} /></Pressable>
                  </View>)}
                  {addingSubtask && <View style={{ minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 6 }}><TextInput accessibilityLabel="New subtask" autoFocus value={subtaskDraft} onChangeText={setSubtaskDraft} onSubmitEditing={addSubtask} returnKeyType="done" placeholder="Add a step..." placeholderTextColor={palette.muted} maxLength={100} style={[input(), { minHeight: 42 }]} /><Pressable accessibilityRole="button" accessibilityLabel="Save subtask" onPress={addSubtask} style={{ padding: 8 }}><MaterialCommunityIcons name="check-circle" size={22} color={palette.purple} /></Pressable></View>}
                  <Pressable accessibilityRole="button" onPress={() => addingSubtask ? addSubtask() : setAddingSubtask(true)} style={{ minHeight: 42, marginTop: 5, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: palette.purpleSoft }}><MaterialCommunityIcons name="plus" size={19} color={palette.purple} /><Text style={{ color: palette.purple, fontSize: 12, fontWeight: '700' }}>{addingSubtask ? 'Add subtask' : 'Add subtask'}</Text></Pressable>
                </Panel>

                <Panel style={{ marginTop: 12 }}>
                  <View style={sectionHeader}><FieldLabel>Reminders <Text style={optional()}>(optional)</Text></FieldLabel><SmoothSwitch value={remindersEnabled} label="Toggle task reminders" onChange={setRemindersEnabled} /></View>
                  {remindersEnabled && <>
                    {reminders.map((offset, index) => <View key={`${offset}-${index}`} style={{ minHeight: 47, marginTop: 8, paddingHorizontal: 11, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: palette.surfaceSoft }}>
                      <MaterialCommunityIcons name="bell-outline" size={19} color={palette.purple} />
                      <Pressable accessibilityRole="button" accessibilityLabel={`Reminder ${reminderLabel(offset)}. Change`} onPress={() => setReminderSheet(index)} style={{ flex: 1, minHeight: 42, justifyContent: 'center' }}><Text style={{ color: palette.ink, fontSize: 12 }}>{reminderLabel(offset)}</Text></Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel="Remove reminder" onPress={() => setReminders(current => current.filter((_, itemIndex) => itemIndex !== index))} hitSlop={8} style={{ padding: 5 }}><MaterialCommunityIcons name="close" size={17} color={palette.muted} /></Pressable>
                    </View>)}
                    <Pressable accessibilityRole="button" onPress={() => setReminderSheet('add')} style={{ minHeight: 38, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, marginTop: 5 }}><MaterialCommunityIcons name="plus" size={18} color={palette.purple} /><Text style={{ color: palette.purple, fontSize: 12, fontWeight: '700' }}>Add another reminder</Text></Pressable>
                    {!dueTime && <Text style={{ color: palette.danger, fontSize: 11 }}>Choose a due time to schedule reminders.</Text>}
                  </>}
                </Panel>

                <Panel style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <View style={{ width: 43, height: 43, borderRadius: 14, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="autorenew" size={21} color={palette.purple} /></View>
                  <View style={{ flex: 1, gap: 2 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>Set as recurring</Text><Text style={{ color: palette.muted, fontSize: 11 }}>Repeat this task automatically</Text></View>
                  <SmoothSwitch value={repeatRule !== 'none'} label="Set task as recurring" onChange={enabled => setRepeatRule(rule => enabled ? (rule === 'none' ? 'daily' : rule) : 'none')} />
                </Panel>
              </>}
              {!!error && <Text accessibilityRole="alert" style={{ color: palette.danger, fontSize: 12, marginTop: 12 }}>{error}</Text>}
            </Animated.View>
          </ScrollView>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, backgroundColor: palette.canvas }}>
            <Button label={saving ? 'Saving…' : step < 3 ? 'Continue  →' : recordId ? 'Save task  →' : 'Create Task  →'} onPress={step < 3 ? () => continueTo(step + 1) : () => void save()} style={{ width: '100%' }} />
          </View>
        </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
    <CalendarDialog visible={calendarOpen} value={dueDate} title="Choose due date" onClose={() => setCalendarOpen(false)} onSelect={setDueDate} />
    <TimeDialog visible={timeOpen} value={dueTime ?? '17:00'} title="Due time" onClose={() => setTimeOpen(false)} onSelect={setDueTime} />
    <ActionSheet visible={listSheet} title="Add to list" subtitle="Choose where to organize this task" onClose={() => setListSheet(false)} actions={[...lists.map(name => ({ label: name, icon: listName === name ? 'check-circle' : 'format-list-bulleted', onPress: () => setListName(name) })), { label: 'Create new list', icon: 'plus', onPress: () => setCreateListOpen(true) }]} />
    <Modal visible={createListOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCreateListOpen(false)}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: palette.overlay }}><View style={{ padding: 20, borderRadius: 22, backgroundColor: palette.card, gap: 14 }}><Text style={{ color: palette.ink, fontSize: 20, fontWeight: '800' }}>Create a list</Text><TextInput accessibilityLabel="New list name" autoFocus value={newListName} onChangeText={value => { setNewListName(value); setListError(''); }} maxLength={40} placeholder="List name" placeholderTextColor={palette.muted} returnKeyType="done" onSubmitEditing={() => void createList()} style={[input(), { flex: 0, minHeight: 50, paddingHorizontal: 14, borderRadius: 14, backgroundColor: palette.input }]} />{!!listError && <Text accessibilityRole="alert" style={{ color: palette.danger, fontSize: 12 }}>{listError}</Text>}<View style={{ flexDirection: 'row', gap: 10 }}><Button label="Cancel" secondary onPress={() => setCreateListOpen(false)} style={{ flex: 1 }} /><Button label="Create list" onPress={() => void createList()} style={{ flex: 1 }} /></View></View></KeyboardAvoidingView></Modal>
    <ActionSheet visible={reminderSheet !== null && !customReminderOpen} title={reminderSheet === 'add' ? 'Add reminder' : 'Reminder time'} subtitle="Choose when to be notified" onClose={() => setReminderSheet(null)} actions={[...REMINDER_OPTIONS.filter(option => reminderSheet !== 'add' || !reminders.includes(option.offset)).map(option => ({ label: option.label, icon: 'bell-outline', onPress: () => chooseReminder(option.offset) })), { label: 'Custom time', icon: 'clock-outline', onPress: () => { if (dueTime) { customReminderTarget.current = reminderSheet ?? 'add'; setCustomReminderOpen(true); } else setError('Choose a due time before setting a custom reminder.'); } }]} />
    <TimeDialog visible={customReminderOpen} value={dueTime ?? '17:00'} title="Custom reminder time" onClose={() => { setCustomReminderOpen(false); setReminderSheet(null); }} onSelect={chooseCustomReminder} />
  </>;
}

function FieldLabel({ children, style }: { children: React.ReactNode; style?: object }) { return <Text style={[{ color: palette.ink, fontSize: 14, fontWeight: '700' }, style]}>{children}</Text>; }
function DateChoice({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ flex: 1, minHeight: 62, alignItems: 'flex-start', justifyContent: 'center', gap: 4, paddingHorizontal: 10, borderRadius: 15, borderWidth: selected ? 1.5 : 1, borderColor: selected ? palette.purple : palette.line, backgroundColor: selected ? palette.purpleSoft : palette.card }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={18} color={selected ? palette.purple : palette.ink} /><Text style={{ color: palette.ink, fontSize: 11, fontWeight: selected ? '700' : '500' }}>{label}</Text></Pressable>; }
function Panel({ children, style }: { children: React.ReactNode; style?: object }) { return <View style={[{ padding: 13, borderRadius: 19, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card }, style]}>{children}</View>; }
function reminderLabel(offset: number) { return REMINDER_OPTIONS.find(option => option.offset === offset)?.label ?? (offset >= 60 ? `${Math.floor(offset / 60)}h ${offset % 60}m before` : `${offset} minutes before`); }
function repeatIcon(rule: TaskRepeatRule) { return rule === 'none' ? 'cancel' : rule === 'daily' ? 'autorenew' : rule === 'weekly' ? 'calendar-week' : 'tune-variant'; }
function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
function formatTime(value: string) { const [hourText, minute] = value.split(':'); const hour = Number(hourText); if (!Number.isFinite(hour) || !minute) return value; return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`; }
const sectionHeader = { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const };
const optional = () => ({ color: palette.muted, fontWeight: '400' as const });
const roundButton = () => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line });
const inputShell = () => ({ minHeight: 52, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, backgroundColor: palette.input, borderWidth: 1, borderColor: palette.line });
const input = () => ({ flex: 1, padding: 0, color: palette.ink, fontSize: 14 } as const);
