import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Header, IconButton, ProgressBar, Screen, SectionTitle } from '../../components/ui/Primitives';
import { HabitRow } from '../../features/habits/HabitRow';
import { useHabitly } from '../../features/app/AppProvider';
import { palette } from '../../theme/tokens';
import { addDays, dateKey, shortDate } from '../../utils/dates';
import { appRoute } from '../../utils/routes';

export default function Today() {
  const { habits, entries, tasks, profileName } = useHabitly();
  const today = dateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedWeekday = new Date(`${selectedDate}T12:00:00`).getDay();
  const activeHabits = habits.filter(habit => !habit.archived && habit.schedule.includes(selectedWeekday));
  const completed = activeHabits.filter(habit => entries.some(entry => entry.habitId === habit.id && entry.date === selectedDate && entry.completed)).length;
  const progress = activeHabits.length ? Math.round(completed / activeHabits.length * 100) : 0;
  const dateTasks = tasks.filter(task => task.dueDate === selectedDate && !task.completed);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const week = Array.from({ length: 7 }, (_, index) => addDays(new Date(), index - 6));

  return (
    <Screen safeBottom={false}>
      <Header title={`${greeting},`} subtitle={`${profileName} · ${selectedDate === today ? 'Today' : shortDate(selectedDate)}`} right={<IconButton icon="magnify" accessibilityLabel="Search" onPress={() => router.push(appRoute('/search'))} />} />
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {week.map(day => {
          const key = dateKey(day);
          const chosen = key === selectedDate;
          const label = day.toLocaleDateString('en', { weekday: 'short' });
          return <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: chosen }} accessibilityLabel={`${label} ${day.getDate()}${key === today ? ', today' : ''}`} onPress={() => setSelectedDate(key)} style={{ flex: 1, minWidth: 0, height: 62, borderRadius: 15, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: chosen ? palette.purple : palette.card, borderWidth: 1, borderColor: chosen ? palette.purple : palette.line }}>
            <Text style={{ color: chosen ? palette.onPrimary : palette.muted, fontSize: 11, fontWeight: '600' }}>{label}</Text>
            <Text style={{ color: chosen ? palette.onPrimary : palette.ink, fontSize: 16, fontWeight: '700' }}>{day.getDate()}</Text>
          </Pressable>;
        })}
      </View>
      <Card style={{ backgroundColor: palette.purpleSoft, borderColor: palette.purpleSoft, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View><Text style={{ fontSize: 17, fontWeight: '700', color: palette.ink }}>{selectedDate === today ? 'Daily progress' : 'Past day progress'}</Text><Text style={{ fontSize: 13, color: palette.muted, marginTop: 4 }}>{completed} of {activeHabits.length} habits complete</Text></View>
          <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 5, borderColor: palette.purple, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card }}><Text style={{ fontSize: 14, fontWeight: '800', color: palette.ink }}>{progress}%</Text></View>
        </View>
        <ProgressBar value={progress} />
        <Text style={{ color: palette.muted, fontSize: 12 }}>{selectedDate === today ? 'A little progress is still progress.' : 'You can fill in a missed day from here.'}</Text>
      </Card>
      {selectedDate === today && <View style={{ minHeight: 48, borderRadius: 15, backgroundColor: palette.yellowSoft, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="fire" size={20} color={palette.yellow} /><Text style={{ fontWeight: '700', color: palette.ink, flex: 1 }}>Keep your streak going</Text><MaterialCommunityIcons name="chevron-right" size={20} color={palette.muted} /></View>}
      <SectionTitle>{selectedDate === today ? "Today's habits" : 'Habits for this day'}</SectionTitle>
      {activeHabits.length ? activeHabits.map(habit => <HabitRow key={habit.id} habit={habit} date={selectedDate} />) : <Card><Text style={{ color: palette.muted }}>No habits were scheduled for this day.</Text></Card>}
      <SectionTitle aside={<Pressable accessibilityRole="button" onPress={() => router.push(appRoute('/(tabs)/tasks'))}><Text style={{ color: palette.purple, fontWeight: '700' }}>All tasks</Text></Pressable>}>Tasks</SectionTitle>
      {dateTasks.length ? <Card style={{ gap: 12 }}>{dateTasks.slice(0, 4).map(task => <View key={task.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="checkbox-blank-circle-outline" size={21} color={palette.muted} /><Text numberOfLines={1} style={{ flex: 1, fontSize: 14, color: palette.ink }}>{task.title}</Text>{task.reminderAt && <MaterialCommunityIcons name="bell-outline" size={16} color={palette.purple} />}</View>)}</Card> : <Card><Text style={{ color: palette.muted }}>{selectedDate === today ? 'Nothing due today. Enjoy the breathing room.' : 'No unfinished tasks for this day.'}</Text></Card>}
    </Screen>
  );
}
