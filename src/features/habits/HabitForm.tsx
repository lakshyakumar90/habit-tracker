import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import type { Habit, HabitDraft, HabitDifficulty, HabitType } from './types';
import { useHabitly } from '../app/AppProvider';
import { TimeDialog } from '../../components/ui/DateTimeDialogs';
import { ActionSheet } from '../../components/ui/ActionSheet';
import { palette } from '../../theme/tokens';

const trackingTypes: { value: HabitType; title: string; description: string; icon: string }[] = [
  { value: 'boolean', title: 'Yes / No', description: 'Simple completion every day', icon: 'check-bold' },
  { value: 'quantity', title: 'Quantity', description: 'Track a number (e.g. 8 glasses)', icon: 'chart-bar' },
  { value: 'duration', title: 'Duration', description: 'Track time (e.g. 30 minutes)', icon: 'clock-outline' },
  { value: 'counter', title: 'Counter', description: 'Increment a count (e.g. push ups)', icon: 'pound' },
];

const iconOptions = [
  { value: '📖', icon: 'book-open-variant', label: 'Reading' },
  { value: '🏃', icon: 'run-fast', label: 'Fitness' },
  { value: '🌱', icon: 'sprout', label: 'Growth' },
  { value: '💧', icon: 'water', label: 'Water' },
  { value: '🌙', icon: 'moon-waning-crescent', label: 'Sleep' },
  { value: '🏋️', icon: 'weight-lifter', label: 'Strength' },
  { value: '🤍', icon: 'heart-outline', label: 'Health' },
  { value: '🍎', icon: 'food-apple-outline', label: 'Nutrition' },
  { value: '🧠', icon: 'brain', label: 'Mind' },
  { value: '🧘', icon: 'meditation', label: 'Mindfulness' },
  { value: '✍️', icon: 'draw', label: 'Writing' },
  { value: '🎨', icon: 'palette-outline', label: 'Creativity' },
  { value: '💊', icon: 'pill', label: 'Medicine' },
  { value: '☀️', icon: 'weather-sunny', label: 'Morning' },
  { value: '✨', icon: 'star-four-points-outline', label: 'Other' },
];

const colors = ['#8570EE', '#F6C75A', '#F3A79A', '#F08BA2', '#73AAE8', '#71B99C', '#9A8CC8'];
const unitOptions = ['per day', 'times', 'glasses', 'cups', 'minutes', 'hours', 'pages', 'reps', 'steps'];
const weekDays = [
  { label: 'S', value: 0 }, { label: 'M', value: 1 }, { label: 'T', value: 2 }, { label: 'W', value: 3 },
  { label: 'T', value: 4 }, { label: 'F', value: 5 }, { label: 'S', value: 6 },
];

type FormStep = 1 | 2 | 3;

export function HabitForm({ visible, onClose, habit }: { visible: boolean; onClose: () => void; habit?: Habit }) {
  const { saveHabit, resolvedTheme } = useHabitly();
  const [step, setStep] = useState<FormStep>(1);
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? '📖');
  const [color, setColor] = useState(habit?.color ?? colors[0]);
  const [type, setType] = useState<HabitType>(habit?.type ?? 'boolean');
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(habit?.difficulty ?? 'easy');
  const [target, setTarget] = useState(String(habit?.target ?? 1));
  const [unit, setUnit] = useState(habit?.unit ?? 'per day');
  const [schedule, setSchedule] = useState<number[]>(habit?.schedule ?? [0, 1, 2, 3, 4, 5, 6]);
  const [reminderAt, setReminderAt] = useState<string | null>(habit?.reminderAt ?? null);
  const [timeOpen, setTimeOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [error, setError] = useState('');

  const close = () => { setError(''); onClose(); };
  const goBack = () => {
    if (step === 1) close();
    else { setStep((current) => (current - 1) as FormStep); setError(''); }
  };
  const next = () => {
    if (step === 1 && !name.trim()) { setError('Give your habit a name to continue.'); return; }
    if (step === 2 && type !== 'boolean' && target.trim() && (!Number.isFinite(Number(target)) || Number(target) <= 0)) { setError('Enter a target greater than zero, or leave it blank.'); return; }
    if (step < 3) { setError(''); setStep((current) => (current + 1) as FormStep); return; }
    void save();
  };
  const save = async () => {
    if (!schedule.length) { setError('Choose at least one day for your habit.'); return; }
    const amount = target.trim() ? Number(target) : 1;
    const draft: HabitDraft = {
      name: name.trim(), description: description.trim(), icon, color, type, difficulty,
      target: type === 'boolean' ? 1 : amount,
      unit: unit.trim() || 'per day', schedule, reminderAt, notificationIds: [],
    };
    const reminderError = await saveHabit(draft, habit?.id);
    if (reminderError) { setError(`Habit saved, but its reminder was not set: ${reminderError}`); return; }
    close();
  };

  const stepTitle = step === 1 ? (habit ? 'Edit Habit' : 'Create New Habit') : step === 2 ? 'Habit type' : 'Schedule & reminder';
  const stepSubtitle = step === 1 ? 'Start small and build a better you.' : step === 2 ? 'Choose how you want to track this habit.' : 'Choose the days and time that work for you.';

  return <>
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={goBack}>
      <View style={{ flex: 1, backgroundColor: palette.canvas, overflow: 'hidden' }}>
        <FormBackdrop />
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ paddingHorizontal: 20, paddingTop: 6, flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={step === 1 ? 'Close habit form' : 'Go back'} onPress={goBack} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line }}><MaterialCommunityIcons name="arrow-left" size={22} color={palette.ink} /></Pressable>
              <View accessibilityLabel={`Step ${step} of 3`} style={{ flex: 1, flexDirection: 'row', gap: 5 }}>
                {[1, 2, 3].map(value => <View key={value} style={{ flex: 1, height: 5, borderRadius: 5, backgroundColor: value <= step ? palette.purple : palette.line }} />)}
              </View>
              <Text style={{ minWidth: 34, textAlign: 'right', color: palette.muted, fontSize: 14, fontWeight: '600' }}>{step}/3</Text>
            </View>

            <ScrollView key={step} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 22, gap: 19 }}>
              <Animated.View key={`step-${step}`} entering={FadeInRight.duration(220)} style={{ gap: 6 }}>
                <Text style={{ color: palette.ink, fontSize: 28, fontWeight: '800', letterSpacing: -0.7 }}>{stepTitle}</Text>
                <Text style={{ color: palette.muted, fontSize: 15, lineHeight: 21 }}>{stepSubtitle}</Text>
              </Animated.View>

              {step === 1 && <View style={{ gap: 18 }}>
                <View style={{ gap: 8 }}>
                  <FieldLabel>Habit name</FieldLabel>
                  <View style={inputShell()}><MaterialCommunityIcons name="pencil-outline" size={20} color={palette.ink} /><TextInput accessibilityLabel="Habit name" value={name} onChangeText={setName} placeholder="e.g. Read books" placeholderTextColor={palette.muted} maxLength={50} returnKeyType="next" style={textInputStyle()} /></View>
                </View>
                <View style={{ gap: 8 }}>
                  <FieldLabel>Description <Text style={{ color: palette.muted, fontWeight: '400' }}>(optional)</Text></FieldLabel>
                  <View style={[inputShell(), { minHeight: 90, alignItems: 'flex-start', paddingTop: 12 }]}><MaterialCommunityIcons name="text-box-outline" size={20} color={palette.ink} style={{ marginTop: 1 }} /><TextInput accessibilityLabel="Habit description, optional" value={description} onChangeText={setDescription} placeholder="Add a short note..." placeholderTextColor={palette.muted} maxLength={160} multiline textAlignVertical="top" style={[textInputStyle(), { minHeight: 65, paddingTop: 0 }]} /></View>
                </View>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <FieldLabel>Choose an icon</FieldLabel>
                    <Pressable accessibilityRole="button" accessibilityLabel={showAllIcons ? 'Show fewer icons' : 'See all icons'} onPress={() => setShowAllIcons(value => !value)} hitSlop={7}><Text style={{ color: palette.muted, fontSize: 13, fontWeight: '600' }}>{showAllIcons ? 'Show less' : 'See all'}</Text></Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                    {iconOptions.slice(0, showAllIcons ? iconOptions.length : 10).map(option => <IconChoice key={option.value} icon={option.icon} label={option.label} selected={icon === option.value} color={color} onPress={() => setIcon(option.value)} />)}
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  <FieldLabel>Choose a color</FieldLabel>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    {colors.map(value => <ColorChoice key={value} value={value} selected={color === value} onPress={() => setColor(value)} />)}
                  </View>
                </View>
              </View>}

              {step === 2 && <View style={{ gap: 17 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {trackingTypes.map(option => <TrackingTypeCard key={option.value} option={option} selected={type === option.value} onPress={() => setType(option.value)} />)}
                </View>
                <View style={{ gap: 8 }}>
                  <FieldLabel>Target <Text style={{ color: palette.muted, fontWeight: '400' }}>(optional)</Text></FieldLabel>
                  <View style={[inputShell(), { minHeight: 58, gap: 10 }]}>
                    <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="bullseye-arrow" size={20} color={palette.purple} /></View>
                    <TextInput accessibilityLabel="Habit target" value={target} onChangeText={setTarget} placeholder="1" placeholderTextColor={palette.muted} keyboardType="decimal-pad" style={[textInputStyle(), { flex: 1 }]} />
                    <Pressable accessibilityRole="button" accessibilityLabel={`Target unit: ${unit}. Change unit`} onPress={() => setUnitOpen(true)} style={{ minHeight: 40, borderRadius: 17, backgroundColor: palette.surfaceSoft, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text numberOfLines={1} style={{ maxWidth: 85, color: palette.ink, fontSize: 13 }}>{unit}</Text><MaterialCommunityIcons name="chevron-down" size={17} color={palette.ink} /></Pressable>
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  <FieldLabel>Difficulty</FieldLabel>
                  <Text style={{ color: palette.muted, fontSize: 13 }}>Set a difficulty level for yourself.</Text>
                  <View style={{ marginTop: 6, flexDirection: 'row', gap: 3, padding: 4, borderRadius: 22, backgroundColor: palette.surfaceSoft }}>
                    {(['easy', 'medium', 'hard'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: difficulty === value }} onPress={() => setDifficulty(value)} style={{ flex: 1, minHeight: 42, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: difficulty === value ? palette.purple : 'transparent' }}><Text style={{ color: difficulty === value ? palette.onPrimary : palette.muted, fontSize: 13, fontWeight: difficulty === value ? '700' : '600' }}>{value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}
                  </View>
                </View>
              </View>}

              {step === 3 && <View style={{ gap: 18 }}>
                <View style={{ gap: 11 }}>
                  <FieldLabel>Repeat</FieldLabel>
                  <Text style={{ color: palette.muted, fontSize: 13 }}>Choose the days you want to practice.</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginTop: 3 }}>
                    {weekDays.map(day => <Pressable key={`${day.label}-${day.value}`} accessibilityRole="checkbox" accessibilityLabel={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day.value]}`} accessibilityState={{ checked: schedule.includes(day.value) }} onPress={() => setSchedule(current => current.includes(day.value) ? current.filter(value => value !== day.value) : [...current, day.value])} style={{ flex: 1, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: schedule.includes(day.value) ? palette.purple : palette.card, borderWidth: 1, borderColor: schedule.includes(day.value) ? palette.purple : palette.line }}><Text style={{ color: schedule.includes(day.value) ? palette.onPrimary : palette.muted, fontWeight: '700' }}>{day.label}</Text></Pressable>)}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
                    <QuickSchedule label="Every day" selected={schedule.length === 7} onPress={() => setSchedule([0, 1, 2, 3, 4, 5, 6])} />
                    <QuickSchedule label="Weekdays" selected={schedule.length === 5 && [1, 2, 3, 4, 5].every(day => schedule.includes(day))} onPress={() => setSchedule([1, 2, 3, 4, 5])} />
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: palette.line }} />
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}><View style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="bell-outline" size={20} color={palette.purple} /></View><View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>Reminder</Text><Text style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>A gentle nudge at a time you choose.</Text></View></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={reminderAt ? `Reminder at ${formatTime(reminderAt)}. Change time` : 'Choose reminder time'} onPress={() => setTimeOpen(true)} style={{ minHeight: 52, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name="clock-outline" size={19} color={palette.purple} /><Text style={{ color: reminderAt ? palette.ink : palette.muted, fontSize: 14, flex: 1 }}>{reminderAt ? formatTime(reminderAt) : 'Choose a reminder time'}</Text>{reminderAt ? <Pressable accessibilityRole="button" accessibilityLabel="Remove reminder" onPress={() => setReminderAt(null)} hitSlop={8}><MaterialCommunityIcons name="close-circle" size={19} color={palette.muted} /></Pressable> : <MaterialCommunityIcons name="chevron-right" size={18} color={palette.muted} />}</Pressable>
                  <Text style={{ color: palette.muted, fontSize: 12, lineHeight: 17 }}>Reminders repeat on your selected days. You can change this anytime.</Text>
                </View>
              </View>}

              {!!error && <Text accessibilityRole="alert" style={{ color: palette.danger, fontSize: 13 }}>{error}</Text>}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 }}>
              <PrimaryButton label={step === 3 ? (habit ? 'Save changes' : 'Create habit') : 'Continue'} onPress={next} dark={resolvedTheme === 'dark'} />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
    <ActionSheet visible={unitOpen} title="Target unit" subtitle="Choose how to measure this habit" onClose={() => setUnitOpen(false)} actions={[...new Set([...unitOptions, ...(unitOptions.includes(unit) ? [] : [unit])])].map(value => ({ label: value, icon: value === unit ? 'check-circle' : 'circle-outline', onPress: () => setUnit(value) }))} />
    <TimeDialog visible={timeOpen} value={reminderAt ?? '09:00'} title="Habit reminder" onClose={() => setTimeOpen(false)} onSelect={setReminderAt} />
  </>;
}

function FormBackdrop() {
  return <View pointerEvents="none" style={absoluteFill}>
    <LinearGradient colors={[palette.canvas, palette.card, palette.canvas]} locations={[0, 0.48, 1]} style={absoluteFill} />
    <View style={{ position: 'absolute', top: -175, right: -150, width: 370, height: 370, borderRadius: 190, backgroundColor: alpha(palette.purple, 0.09) }} />
    <View style={{ position: 'absolute', top: 165, right: -165, width: 300, height: 300, borderRadius: 155, backgroundColor: alpha(palette.yellow, 0.11) }} />
    <View style={{ position: 'absolute', bottom: -175, left: -132, width: 330, height: 330, borderRadius: 170, backgroundColor: alpha(palette.purple, 0.075) }} />
    <View style={{ position: 'absolute', bottom: -190, right: -110, width: 260, height: 260, borderRadius: 140, backgroundColor: alpha(palette.yellow, 0.12) }} />
  </View>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>{children}</Text>;
}

function IconChoice({ icon, label, selected, color, onPress }: { icon: string; label: string; selected: boolean; color: string; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${label} icon`} onPress={onPress} style={{ width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? alpha(color, 0.15) : palette.surfaceSoft, borderWidth: selected ? 2 : 1, borderColor: selected ? color : 'transparent' }}>
    <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={25} color={palette.ink} />
  </Pressable>;
}

function ColorChoice({ value, selected, onPress }: { value: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`Choose color ${value}`} onPress={onPress} style={{ width: 39, height: 39, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: selected ? 2 : 0, borderColor: value }}>
    <View style={{ width: 31, height: 31, borderRadius: 16, backgroundColor: value }} />
  </Pressable>;
}

function TrackingTypeCard({ option, selected, onPress }: { option: (typeof trackingTypes)[number]; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={{ width: '48%', minHeight: 142, borderRadius: 21, borderWidth: selected ? 1.5 : 1, borderColor: selected ? palette.purple : palette.line, backgroundColor: selected ? alpha(palette.purple, 0.075) : palette.card, padding: 14, justifyContent: 'space-between' }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={25} color={palette.ink} /></View>
      {selected && <View style={{ width: 23, height: 23, borderRadius: 12, backgroundColor: palette.purple, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="check" size={15} color={palette.onPrimary} /></View>}
    </View>
    <View style={{ gap: 4 }}><Text style={{ color: palette.ink, fontSize: 15, fontWeight: '700' }}>{option.title}</Text><Text style={{ color: palette.muted, fontSize: 12, lineHeight: 16 }}>{option.description}</Text></View>
  </Pressable>;
}

function QuickSchedule({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ minHeight: 38, paddingHorizontal: 13, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? palette.purpleSoft : palette.card, borderWidth: 1, borderColor: selected ? palette.purple : palette.line }}><Text style={{ color: selected ? palette.purple : palette.muted, fontSize: 12, fontWeight: '600' }}>{label}</Text></Pressable>;
}

function PrimaryButton({ label, onPress, dark }: { label: string; onPress: () => void; dark: boolean }) {
  const backgroundColor = dark ? palette.purple : '#19181D';
  const foregroundColor = dark ? palette.onPrimary : '#FFFFFF';
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ minHeight: 54, borderRadius: 28, backgroundColor, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}>
    <Text style={{ color: foregroundColor, fontSize: 15, fontWeight: '700' }}>{label}</Text><MaterialCommunityIcons name={label === 'Create habit' || label === 'Save changes' ? 'check' : 'arrow-right'} size={19} color={foregroundColor} />
  </Pressable>;
}

function inputShell() {
  return { minHeight: 56, borderRadius: 18, paddingHorizontal: 14, backgroundColor: palette.purpleSoft, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10, borderWidth: 1, borderColor: alpha(palette.purple, 0.06) };
}

function textInputStyle() {
  return { minHeight: 46, flex: 1, padding: 0, color: palette.ink, fontSize: 15 } as const;
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
