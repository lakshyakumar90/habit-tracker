import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useHabitly } from '../app/AppProvider';
import type { Task, TaskDraft } from './types';
import { Button, Card } from '../../components/ui/Primitives';
import { palette } from '../../theme/tokens';
import { dateKey } from '../../utils/dates';
import { CalendarDialog, TimeDialog } from '../../components/ui/DateTimeDialogs';

export function TaskForm({ task, onClose }: { task?: Task; onClose: () => void }) {
  const { addTask } = useHabitly();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? dateKey());
  const [reminderAt, setReminderAt] = useState<string | null>(task?.reminderAt ?? null);
  const [priority, setPriority] = useState<Task['priority']>(task?.priority ?? 'medium');
  const [error, setError] = useState('');
  const [calendarOpen,setCalendarOpen]=useState(false);
  const [timeOpen,setTimeOpen]=useState(false);
  const close = () => { setError(''); onClose(); };
  const save = async () => {
    if (!title.trim()) { setError('Add a task title first.'); return; }
    const draft: TaskDraft = { id: task?.id, title: title.trim(), notes: notes.trim(), dueDate, priority, reminderAt };
    const reminderError = await addTask(draft);
    if (reminderError) { setError(`Task saved, but its reminder was not set: ${reminderError}`); return; }
    close();
  };

  return <><Modal visible animationType="slide" transparent onRequestClose={close}>
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: palette.overlay }}>
      <View style={{ maxHeight: '92%', backgroundColor: palette.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: palette.ink }}>{task ? 'Edit task' : 'New task'}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close task editor" onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="close" size={22} color={palette.muted} /></Pressable>
          </View>
          <Card style={{ gap: 11 }}>
            <TextInput value={title} onChangeText={setTitle} placeholder="What needs doing?" placeholderTextColor={palette.muted} autoFocus maxLength={120} returnKeyType="next" style={field()} />
            <TextInput value={notes} onChangeText={setNotes} placeholder="Add a note (optional)" placeholderTextColor={palette.muted} multiline maxLength={300} style={[field(), { minHeight: 68, textAlignVertical: 'top', paddingTop: 13 }]} />
            <Text style={label()}>Due date</Text>
            <Pressable accessibilityRole="button" onPress={()=>setCalendarOpen(true)} style={{minHeight:48,borderRadius:13,backgroundColor:palette.input,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9}}><MaterialCommunityIcons name="calendar-month-outline" size={19} color={palette.purple}/><Text style={{color:palette.ink}}>{new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</Text><MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} style={{marginLeft:'auto'}}/></Pressable>
            <Text style={label()}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>{(['low', 'medium', 'high'] as const).map(value => <Choice key={value} label={value[0].toUpperCase() + value.slice(1)} selected={priority === value} onPress={() => setPriority(value)} />)}</View>
          </Card>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><MaterialCommunityIcons name="bell-outline" size={20} color={palette.purple} /><Text style={{ fontWeight: '700', fontSize: 15, color: palette.ink }}>Reminder</Text><Text style={{ marginLeft: 'auto', fontSize: 12, color: palette.muted }}>Optional</Text></View>
            <View style={{flexDirection:'row',gap:8}}><Choice label={reminderAt??'Choose time'} selected={!!reminderAt} onPress={()=>setTimeOpen(true)}/>{reminderAt&&<Choice label="Remove" selected={false} onPress={()=>setReminderAt(null)}/>}</View>
            <Text style={{ fontSize: 12, lineHeight: 17, color: palette.muted }}>{reminderAt ? `We'll remind you at the selected time on ${new Date(`${dueDate}T12:00:00`).toLocaleDateString()}.` : 'Choose a time to receive a local notification on the due date.'}</Text>
          </Card>
          {!!error && <Text accessibilityRole="alert" style={{ color: palette.danger }}>{error}</Text>}
          <View style={{ flexDirection: 'row', gap: 10 }}><Button label="Cancel" secondary onPress={close} style={{ flex: 1 }} /><Button label={task ? 'Save task' : 'Add task'} onPress={() => void save()} style={{ flex: 1 }} /></View>
        </ScrollView>
      </View>
    </View>
  </Modal><CalendarDialog visible={calendarOpen} value={dueDate} onClose={()=>setCalendarOpen(false)} onSelect={setDueDate}/><TimeDialog visible={timeOpen} value={reminderAt??'09:00'} onClose={()=>setTimeOpen(false)} onSelect={setReminderAt}/></>;
}

function Choice({ label: text, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, borderRadius: 13, backgroundColor: selected ? palette.purpleSoft : palette.surfaceSoft, borderWidth: selected ? 1 : 0, borderColor: palette.purple }}><Text style={{ color: selected ? palette.purple : palette.ink, fontSize: 13, fontWeight: '600' }}>{text}</Text></Pressable>;
}

const field = () => ({ minHeight: 48, borderRadius: 13, backgroundColor: palette.input, paddingHorizontal: 13, color: palette.ink, fontSize: 15 } as const);
const label = () => ({ fontSize: 13, fontWeight: '700', color: palette.ink } as const);
