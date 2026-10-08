import { Modal, Pressable, Share, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import type { Habit } from './types';
import { useHabitlyTheme } from '../app/AppProvider';
import { onAccentControl, palette, softAccent } from '../../theme/tokens';

export function CelebrationModal({ habit, streak, onClose, onViewStreak }: { habit?: Habit; streak: number; onClose: () => void; onViewStreak: () => void }) {
  const { accent } = useHabitlyTheme();
  const shareProgress = async () => {
    if (!habit) return;
    await Share.share({ message: `I just completed ${habit.name} on Habitly${streak > 1 ? ` and reached a ${streak} day streak` : ''}! Small habits, big results.` });
  };
  return <Modal visible={Boolean(habit)} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', padding: 22, backgroundColor: palette.overlay }}>
      <Animated.View entering={FadeIn.duration(180)} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
      <Animated.View entering={ZoomIn.duration(230)} style={{ borderRadius: 27, backgroundColor: palette.card, padding: 20, gap: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close celebration" onPress={onClose} style={{ position: 'absolute', right: 14, top: 14, zIndex: 1, width: 38, height: 38, borderRadius: 19, backgroundColor: palette.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="close" size={20} color={palette.ink} /></Pressable>
        <View style={{ alignSelf: 'center', marginTop: 12, width: 94, height: 94, borderRadius: 47, backgroundColor: accent, borderWidth: 8, borderColor: softAccent(accent), alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="check-bold" size={43} color={onAccentControl(accent)} /></View>
        <View style={{ gap: 4 }}><Text style={{ color: palette.ink, textAlign: 'center', fontSize: 25, fontWeight: '800' }}>{streak > 1 ? `${streak} day streak!` : 'Great job!'}</Text><Text style={{ color: palette.muted, textAlign: 'center', fontSize: 14, lineHeight: 21 }}>You completed your habit for today 🎉</Text></View>
        {habit && <View style={{ minHeight: 68, borderRadius: 18, backgroundColor: palette.surfaceSoft, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }}><View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: softAccent(accent) }}><Text style={{ fontSize: 22 }}>{habit.icon}</Text></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: palette.ink, fontSize: 14, fontWeight: '700' }}>{habit.name}</Text><Text style={{ color: palette.muted, fontSize: 11, marginTop: 3 }}>Daily habit</Text></View><View style={{ alignItems: 'center' }}><Text style={{ color: accent, fontSize: 20, fontWeight: '800' }}>+1</Text><Text style={{ color: palette.muted, fontSize: 10 }}>day</Text></View></View>}
        <View style={{ borderRadius: 18, backgroundColor: softAccent(accent), padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><MaterialCommunityIcons name="format-quote-open" size={19} color={accent} /><Text style={{ color: palette.ink, textAlign: 'center', fontSize: 14, lineHeight: 21 }}>Consistency today creates a better tomorrow.</Text></View>
        <Pressable accessibilityRole="button" onPress={onClose} style={{ minHeight: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: accent }}><Text style={{ color: onAccentControl(accent), fontSize: 15, fontWeight: '700' }}>Done</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => void shareProgress()} style={{ minHeight: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: softAccent(accent) }}><MaterialCommunityIcons name="share-variant-outline" size={18} color={accent} /><Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>Share progress</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onViewStreak} style={{ minHeight: 34, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.muted, fontSize: 12, fontWeight: '600' }}>View your streak</Text></Pressable>
      </Animated.View>
    </View>
  </Modal>;
}
