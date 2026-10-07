import type { ReactNode } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useOnboardingTheme } from './theme';

export function HabitlyMark({ size = 104 }: { size?: number }) {
  return <Image source={require('../../../assets/images/habitly-mark.png')} accessibilityLabel="Habitly sprout logo" style={{ width: size, height: size }} resizeMode="contain" />;
}

export function ProgressHeader({ step, onBack }: { step: number; onBack: () => void }) {
  const theme = useOnboardingTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go to previous screen" onPress={onBack} style={({ pressed }) => ({ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, opacity: pressed ? 0.7 : 1 })}>
      <MaterialCommunityIcons name="chevron-left" size={26} color={theme.ink} />
    </Pressable>
    <View accessibilityLabel={`Step ${step} of 5`} style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: 5 }, (_, index) => <View key={index} style={{ flex: 1, height: 5, borderRadius: 4, backgroundColor: index < step ? theme.purple : theme.line, opacity: index < step ? 1 : 0.85 }} />)}
    </View>
    <Text style={{ minWidth: 29, textAlign: 'right', color: theme.muted, fontSize: 14, fontWeight: '600' }}>{step}/5</Text>
  </View>;
}

export function PrimaryActionButton({ label, onPress, disabled = false, icon = 'arrow-right' }: { label: string; onPress: () => void; disabled?: boolean; icon?: string }) {
  const theme = useOnboardingTheme();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => ({ height: 56, borderRadius: 24, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: disabled ? theme.subtle : pressed ? theme.ctaPressed : theme.cta, transform: [{ scale: pressed && !disabled ? 0.985 : 1 }], opacity: disabled ? 0.68 : 1 })}>
    <Text style={{ color: theme.onPrimary, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={theme.onPrimary} />
  </Pressable>;
}

export function AccountActionButton({ label, icon, iconColor, onPress }: { label: string; icon: string; iconColor?: string; onPress: () => void }) {
  const theme = useOnboardingTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ minHeight: 54, borderRadius: 27, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: theme.surface, opacity: pressed ? 0.78 : 1 })}>
    <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={21} color={iconColor ?? theme.ink} />
    <Text style={{ color: theme.ink, fontSize: 14, fontWeight: '600' }}>{label}</Text>
  </Pressable>;
}

export function FormHeading({ title, description }: { title: string; description: string }) {
  const theme = useOnboardingTheme();
  return <View style={{ gap: 8, paddingHorizontal: 2 }}>
    <Text style={{ color: theme.ink, fontSize: 27, lineHeight: 32, letterSpacing: -0.7, fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: theme.muted, fontSize: 15, lineHeight: 21 }}>{description}</Text>
  </View>;
}

export function FriendlyFace({ children }: { children?: ReactNode }) {
  return <View style={{ alignItems: 'center', justifyContent: 'center', width: 130, height: 130, borderRadius: 65, backgroundColor: '#DCCFFF' }}>
    {children ?? <MaterialCommunityIcons name="emoticon-happy-outline" size={72} color="#30205F" />}
  </View>;
}
