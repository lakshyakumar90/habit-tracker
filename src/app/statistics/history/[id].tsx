import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { Card, Screen } from '../../../components/ui/Primitives';
import { useHabitly } from '../../../features/app/AppProvider';
import { heatmapLevel, isScheduledOn } from '../../../features/habits/domain';
import { BackHeader, HabitPicker } from '../../../features/statistics/StatisticsUI';
import { palette } from '../../../theme/tokens';
import { addDays, dateKey } from '../../../utils/dates';
import { appRoute } from '../../../utils/routes';

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export default function HabitHistory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { habits, entries, setEntry } = useHabitly();
  const heatColors = [palette.heat0, palette.heat1, palette.heat2, palette.heat3, palette.heat4];
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1, 12); });
  const [selected, setSelected] = useState(dateKey());
  const [pickerOpen, setPickerOpen] = useState(false);
  const habit = habits.find(item => item.id === id);
  const monthDays = useMemo(() => {
    const offset = (month.getDay() + 6) % 7;
    const first = addDays(month, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(first, index));
  }, [month]);
  const entryByDate = new Map(entries.filter(entry => entry.habitId === id).map(entry => [entry.date, entry]));
  if (!habit) return <Screen><BackHeader title="History" onBack={() => router.back()} /><Card><Text style={{ color: palette.ink, fontWeight: '700' }}>Habit not found</Text></Card></Screen>;
  const selectedEntry = entryByDate.get(selected);
  const recentStart = dateKey(addDays(new Date(), -89));
  const own = entries.filter(entry => entry.habitId === habit.id && entry.completed && entry.date >= recentStart);
  const weekdayRates = Array.from({ length: 7 }, (_, day) => {
    const matches = own.filter(entry => new Date(`${entry.date}T12:00:00`).getDay() === day).length;
    const scheduledDays = Array.from({ length: 90 }, (_, offset) => addDays(new Date(), -offset)).filter(date => date.getDay() === day && date >= new Date(`${habit.createdAt.slice(0, 10)}T12:00:00`) && isScheduledOn(habit, date)).length;
    return { day, rate: scheduledDays ? Math.round(matches / scheduledDays * 100) : 0 };
  });
  const bestDay = weekdayRates.reduce((best, current) => current.rate > best.rate ? current : best, weekdayRates[0]);
  const recentRate = own.filter(entry => entry.date >= dateKey(addDays(new Date(), -29))).length;
  return <>
    <Screen safeBottom style={{ paddingBottom: 24 }}>
      <BackHeader title="History" onBack={() => router.back()} aside={<HabitPicker name={habit.name} onPress={() => setPickerOpen(true)} />} />
      <Card style={{ gap: 13 }}>
        <View><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>Calendar view</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>Your activity for {month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Text></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))} hitSlop={10}><MaterialCommunityIcons name="chevron-left" size={22} color={palette.ink} /></Pressable><Text style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{month.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</Text><View style={{ flexDirection: 'row', gap: 11 }}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1, 12))} hitSlop={10}><MaterialCommunityIcons name="chevron-left" size={21} color={palette.muted} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1, 12))} hitSlop={10}><MaterialCommunityIcons name="chevron-right" size={21} color={palette.muted} /></Pressable></View></View>
        <View style={{ flexDirection: 'row' }}>{weekdayNames.map(name => <Text key={name} style={{ flex: 1, textAlign: 'center', color: palette.muted, fontSize: 10 }}>{name}</Text>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 7 }}>{monthDays.map(day => { const key = dateKey(day); const inside = day.getMonth() === month.getMonth(); const level = heatmapLevel(entryByDate.get(key), habit); const isFuture = key > dateKey(); const beforeStart = key < habit.createdAt.slice(0, 10); const disabled = isFuture || beforeStart; return <Pressable key={key} accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(entryByDate.get(key)?.completed), selected: selected === key, disabled }} accessibilityLabel={`${day.toLocaleDateString('en', { month: 'long', day: 'numeric' })}${level ? ', completed. Tap to mark incomplete' : ', not completed. Tap to mark complete'}`} disabled={disabled} onPress={() => { setSelected(key); const complete = entryByDate.get(key)?.completed ?? false; void setEntry(habit, complete ? 0 : habit.target, key); }} style={{ width: `${100 / 7}%`, alignItems: 'center' }}><View style={{ width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: level ? heatColors[level] : palette.heat0, borderWidth: selected === key ? 2 : 0, borderColor: palette.purple, opacity: inside && !disabled ? 1 : .35 }}><Text style={{ color: level >= 3 ? '#FFFFFF' : palette.ink, fontSize: 11, fontWeight: selected === key ? '800' : '500' }}>{day.getDate()}</Text></View></Pressable>; })}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, alignItems: 'center' }}>{['No activity', 'Low', 'Medium', 'High', 'Completed'].map((label, index) => <View key={label} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}><View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: heatColors[index] }} /><Text style={{ color: palette.muted, fontSize: 9 }}>{label}</Text></View>)}</View>
        <View style={{ borderTopWidth: 1, borderColor: palette.line, paddingTop: 10 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>{new Date(`${selected}T12:00:00`).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 3 }}>{selectedEntry ? `${selectedEntry.completed ? 'Completed' : 'Not completed'} · ${selectedEntry.value} ${habit.unit}` : isScheduledOn(habit, new Date(`${selected}T12:00:00`)) ? 'No entry recorded' : 'Rest day'}</Text></View>
      </Card>
      <Card style={{ gap: 10 }}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={palette.purple} /><Text style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '700' }}>Insights</Text><Pressable accessibilityRole="button" onPress={() => router.push(appRoute({ pathname: '/statistics/[id]', params: { id: habit.id } }))}><Text style={{ color: palette.purple, fontSize: 12, fontWeight: '700' }}>View all</Text></Pressable></View>
        <Insight icon="trending-up" title={`${recentRate} completed check-ins`} body="Recorded completions in the last 30 days." />
        <Insight icon="trophy-outline" title={bestDay.rate ? `${weekdayNames[(bestDay.day + 6) % 7]} is your strongest day` : 'Build your first pattern'} body={bestDay.rate ? `${bestDay.rate}% completion on scheduled ${weekdayNames[(bestDay.day + 6) % 7]}s.` : 'More scheduled check-ins will reveal your most consistent weekday.'} />
        <Insight icon="calendar-check-outline" title={`${habit.schedule.length} days each week`} body="Your current schedule for this habit." />
      </Card>
      <View style={{ padding: 20, borderRadius: 24, backgroundColor: palette.purpleSoft, flexDirection: 'row', alignItems: 'center', gap: 12 }}><MaterialCommunityIcons name="format-quote-open" size={28} color={palette.purple} /><Text style={{ flex: 1, color: palette.ink, fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center' }}>Small steps every day lead to big results.</Text></View>
    </Screen>
    <ActionSheet visible={pickerOpen} title="Choose a habit" onClose={() => setPickerOpen(false)} actions={habits.filter(item => !item.archived).map(item => ({ label: item.name, icon: item.id === habit.id ? 'check-circle' : 'circle-outline', onPress: () => router.replace(appRoute({ pathname: '/statistics/history/[id]', params: { id: item.id } })) }))} />
  </>;
}

function Insight({ icon, title, body }: { icon: string; title: string; body: string }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8, borderTopWidth: 1, borderColor: palette.line }}><View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={19} color={palette.purple} /></View><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>{title}</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>{body}</Text></View><MaterialCommunityIcons name="chevron-right" size={18} color={palette.muted} /></View>;
}
