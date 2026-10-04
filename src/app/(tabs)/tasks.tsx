import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Header, IconButton, Screen } from '../../components/ui/Primitives';
import { useHabitly } from '../../features/app/AppProvider';
import { TaskForm } from '../../features/tasks/TaskForm';
import type { Task } from '../../features/tasks/types';
import { palette } from '../../theme/tokens';
import { dateKey, shortDate } from '../../utils/dates';
import { ActionSheet } from '../../components/ui/ActionSheet';

type TaskFilter = 'Today' | 'Upcoming' | 'Completed';

export default function Tasks() {
  const { tasks, toggleTask, deleteTask } = useHabitly();
  const [filter, setFilter] = useState<TaskFilter>('Today');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task>();
  const [actionTask,setActionTask]=useState<Task>();
  const [confirmDelete,setConfirmDelete]=useState<Task>();
  const today = dateKey();
  const visibleTasks = tasks.filter(task => {
    if (filter === 'Completed') return task.completed;
    if (filter === 'Upcoming') return !task.completed && task.dueDate > today;
    return !task.completed && task.dueDate <= today;
  });
  const openCreate = () => { setEditingTask(undefined); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingTask(undefined); };
  const openActions = (task: Task) => setActionTask(task);

  return (
    <Screen safeBottom={false}>
      <Header title="Tasks" subtitle="Keep the next small step in view." right={<IconButton icon="plus" accessibilityLabel="Add task" onPress={openCreate} />} />
      <View style={{ flexDirection: 'row', gap: 5, padding: 4, borderRadius: 14, backgroundColor: palette.surfaceSoft }}>
        {(['Today', 'Upcoming', 'Completed'] as const).map(value => {
          const selected = filter === value;
          return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={{ flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: selected ? palette.card : 'transparent' }}><Text style={{ fontSize: 13, fontWeight: '600', color: selected ? palette.ink : palette.muted }}>{value}</Text></Pressable>;
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 }}>
        <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{filter === 'Today' ? 'Due today' : filter}</Text>
        <Text style={{ color: palette.muted, fontSize: 12 }}>{visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}</Text>
      </View>
      {visibleTasks.length ? visibleTasks.map(task => <TaskRow key={task.id} task={task} today={today} onToggle={() => void toggleTask(task)} onMore={() => openActions(task)} />) : (
        <View style={{ alignItems: 'center', paddingVertical: 32, gap: 7 }}>
          <MaterialCommunityIcons name={filter === 'Completed' ? 'check-circle-outline' : 'playlist-check'} size={35} color={palette.purple} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{filter === 'Completed' ? 'Nothing completed yet' : 'A clear list for now'}</Text>
          <Text style={{ fontSize: 13, color: palette.muted, textAlign: 'center' }}>{filter === 'Upcoming' ? 'Tasks with a future due date will show here.' : 'Add a task whenever something needs a place.'}</Text>
          {filter !== 'Completed' && <Button label="Add a task" secondary onPress={openCreate} style={{ marginTop: 6 }} />}
        </View>
      )}
      {showForm && <TaskForm key={editingTask?.id ?? 'new'} task={editingTask} onClose={closeForm} />}
      <ActionSheet visible={!!actionTask} title={actionTask?.title??'Task'} subtitle="Choose an action" onClose={()=>setActionTask(undefined)} actions={[{label:'Edit task',icon:'pencil-outline',onPress:()=>{setEditingTask(actionTask);setShowForm(true)}},{label:'Delete task',icon:'delete-outline',destructive:true,onPress:()=>setConfirmDelete(actionTask)}]}/>
      <ActionSheet visible={!!confirmDelete} title="Delete this task?" subtitle="Its scheduled reminder will be cancelled." onClose={()=>setConfirmDelete(undefined)} actions={[{label:'Delete task',icon:'delete-outline',destructive:true,onPress:()=>{if(confirmDelete)void deleteTask(confirmDelete.id);setConfirmDelete(undefined)}}]}/>
    </Screen>
  );
}

function TaskRow({ task, today, onToggle, onMore }: { task: Task; today: string; onToggle: () => void; onMore: () => void }) {
  const overdue = !task.completed && task.dueDate < today;
  const dueLabel = task.dueDate === today ? 'Today' : `${overdue ? 'Overdue · ' : ''}${shortDate(task.dueDate)}`;
  const priorityColor = task.priority === 'high' ? palette.danger : task.priority === 'medium' ? palette.yellow : palette.muted;
  return <Card style={{ paddingVertical: 13, paddingHorizontal: 12 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={`${task.completed ? 'Reopen' : 'Complete'} ${task.title}`} onPress={onToggle} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={task.completed ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={25} color={task.completed ? palette.purple : palette.muted} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={onMore} style={{ flex: 1, minHeight: 48, justifyContent: 'center', gap: 5 }}>
        <Text numberOfLines={1} style={{ color: palette.ink, fontSize: 15, fontWeight: '600', textDecorationLine: task.completed ? 'line-through' : 'none' }}>{task.title}</Text>
        {!!task.notes && <Text numberOfLines={1} style={{ color: palette.muted, fontSize: 12 }}>{task.notes}</Text>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Text style={{ color: overdue ? palette.danger : palette.muted, fontSize: 12 }}>{dueLabel}</Text>
          <Text style={{ color: priorityColor, fontSize: 12, fontWeight: '600' }}>· {task.priority}</Text>
          {task.reminderAt && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}><MaterialCommunityIcons name={task.notificationId ? 'bell-check-outline' : 'bell-alert-outline'} size={14} color={task.notificationId ? palette.purple : palette.muted} /><Text style={{ fontSize: 11, color: task.notificationId ? palette.purple : palette.muted }}>{task.reminderAt}</Text></View>}
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${task.title}`} onPress={onMore} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="dots-vertical" size={21} color={palette.muted} /></Pressable>
    </View>
  </Card>;
}
