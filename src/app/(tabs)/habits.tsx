import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Header, IconButton, Screen } from '../../components/ui/Primitives';
import { HabitRow } from '../../features/habits/HabitRow';
import { HabitForm } from '../../features/habits/HabitForm';
import { useHabitly } from '../../features/app/AppProvider';
import type { Habit } from '../../features/habits/types';
import { palette } from '../../theme/tokens';
import { ActionSheet } from '../../components/ui/ActionSheet';

type HabitFilter = 'All' | 'Active' | 'Archived';

export default function Habits() {
  const { habits, archiveHabit, deleteHabit } = useHabitly();
  const [filter, setFilter] = useState<HabitFilter>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit>();
  const [actionHabit,setActionHabit]=useState<Habit>();
  const [confirmDelete,setConfirmDelete]=useState<Habit>();
  const visibleHabits = habits.filter(habit => filter === 'All' || (filter === 'Active' ? !habit.archived : habit.archived));
  const closeForm = () => { setShowForm(false); setEditingHabit(undefined); };
  const openActions = (habit: Habit) => setActionHabit(habit);

  return (
    <Screen safeBottom={false}>
      <Header title="Habits" subtitle={`${habits.filter(habit => !habit.archived).length} active routines`} right={<IconButton icon="plus" accessibilityLabel="Create habit" onPress={() => { setEditingHabit(undefined); setShowForm(true); }} />} />
      <View style={{ flexDirection: 'row', gap: 5, padding: 4, borderRadius: 14, backgroundColor: palette.surfaceSoft }}>
        {(['All', 'Active', 'Archived'] as const).map(value => {
          const selected = filter === value;
          return <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setFilter(value)} style={{ flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: selected ? palette.card : 'transparent' }}><Text style={{ fontSize: 13, fontWeight: '600', color: selected ? palette.ink : palette.muted }}>{value}</Text></Pressable>;
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{filter} habits</Text><Text style={{ fontSize: 12, color: palette.muted }}>{visibleHabits.length}</Text></View>
      {visibleHabits.length ? visibleHabits.map(habit => <HabitRow key={habit.id} habit={habit} onManage={() => openActions(habit)} />) : (
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 26 }}>
          <MaterialCommunityIcons name={filter === 'Archived' ? 'archive-outline' : 'sprout-outline'} size={34} color={palette.purple} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>{filter === 'Archived' ? 'No archived habits' : 'Start with one small routine'}</Text>
          <Text style={{ color: palette.muted, textAlign: 'center', lineHeight: 19 }}>{filter === 'Archived' ? 'Archived habits will stay here until you restore them.' : 'Pick something easy to repeat and build from there.'}</Text>
        </Card>
      )}
      {showForm && <HabitForm key={editingHabit?.id ?? 'new'} visible onClose={closeForm} habit={editingHabit} />}
      <ActionSheet visible={!!actionHabit} title={actionHabit?.name??'Habit'} subtitle="Manage this routine" onClose={()=>setActionHabit(undefined)} actions={[{label:'Edit habit',icon:'pencil-outline',onPress:()=>{setEditingHabit(actionHabit);setShowForm(true)}},{label:actionHabit?.archived?'Restore habit':'Archive habit',icon:actionHabit?.archived?'archive-arrow-up-outline':'archive-outline',onPress:()=>{if(actionHabit)void archiveHabit(actionHabit.id,!actionHabit.archived)}},{label:'Delete habit',icon:'delete-outline',destructive:true,onPress:()=>setConfirmDelete(actionHabit)}]}/>
      <ActionSheet visible={!!confirmDelete} title="Delete this habit?" subtitle="Its completion history will also be removed." onClose={()=>setConfirmDelete(undefined)} actions={[{label:'Delete habit',icon:'delete-outline',destructive:true,onPress:()=>{if(confirmDelete)void deleteHabit(confirmDelete.id);setConfirmDelete(undefined)}}]}/>
    </Screen>
  );
}
