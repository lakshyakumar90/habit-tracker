import { Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { palette } from '../../theme/tokens';
import { useHabitly } from '../app/AppProvider';

export function StatTile({ icon, value, label, accent = palette.purple }: { icon: string; value: string; label: string; accent?: string }) {
  useHabitly();
  return <View style={{ flex: 1, minWidth: 74, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, gap: 7 }}><MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={accent} /><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: palette.ink, fontSize: 20, fontWeight: '800' }}>{value}</Text><Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82} android_hyphenationFrequency="none" style={{ color: palette.muted, fontSize: 11, lineHeight: 15 }}>{label}</Text></View>;
}

export function BarChart({ values, labels, color = palette.purple, suffix = '' }: { values: number[]; labels: string[]; color?: string; suffix?: string }) {
  useHabitly();
  const max = Math.max(1, ...values);
  return <View style={{ height: 142, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 20 }}>{values.map((value, index) => <View key={`${labels[index]}-${index}`} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 7 }}><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 9 }}>{value}{suffix}</Text><View style={{ width: '72%', height: `${Math.max(4, value / max * 76)}%`, borderRadius: 7, backgroundColor: value ? color : palette.surfaceSoft, opacity: .42 + (value / max) * .58 }} /><Text numberOfLines={1} style={{ color: palette.muted, fontSize: 9 }}>{labels[index]}</Text></View>)}</View>;
}

export function ProgressRing({ value, size = 86 }: { value: number; size?: number }) {
  useHabitly();
  return <View accessibilityLabel={`${value}% completion`} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 8, borderColor: palette.purpleSoft, alignItems: 'center', justifyContent: 'center' }}><View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: 8, borderColor: 'transparent', borderTopColor: palette.purple, borderRightColor: value >= 25 ? palette.purple : 'transparent', borderBottomColor: value >= 50 ? palette.purple : 'transparent', borderLeftColor: value >= 75 ? palette.purple : 'transparent', transform: [{ rotate: '-45deg' }] }} /><Text style={{ color: palette.ink, fontSize: size * .2, fontWeight: '800' }}>{value}%</Text></View>;
}

export function RangeSelector({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  useHabitly();
  return <View style={{ flexDirection: 'row', backgroundColor: palette.surfaceSoft, padding: 4, borderRadius: 18, gap: 3 }}>{options.map(option => <Pressable key={option} accessibilityRole="tab" accessibilityState={{ selected: value === option }} onPress={() => onChange(option)} style={{ flex: 1, minHeight: 38, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: value === option ? palette.purpleSoft : 'transparent' }}><Text numberOfLines={1} style={{ fontSize: 11, fontWeight: value === option ? '700' : '500', color: value === option ? palette.purple : palette.muted }}>{option}</Text></Pressable>)}</View>;
}

export function BackHeader({ title, onBack, aside }: { title: string; onBack: () => void; aside?: React.ReactNode }) {
  useHabitly();
  return <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card, borderColor: palette.line, borderWidth: 1 }}><MaterialCommunityIcons name="arrow-left" size={21} color={palette.ink} /></Pressable><Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>{title}</Text>{aside ?? <View style={{ width: 42 }} />}</View>;
}

export function HabitPicker({ name, onPress }: { name: string; onPress: () => void }) {
  useHabitly();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Choose habit. Selected ${name}`} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card }}><Text numberOfLines={1} style={{ maxWidth: 100, color: palette.ink, fontSize: 12, fontWeight: '600' }}>{name}</Text><MaterialCommunityIcons name="chevron-down" size={17} color={palette.muted} /></Pressable>;
}
