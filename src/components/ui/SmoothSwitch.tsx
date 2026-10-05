import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { palette } from '../../theme/tokens';
import { useHabitly } from '../../features/app/AppProvider';

export function SmoothSwitch({ value, onChange, label, disabled = false }: { value: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  useHabitly();
  const offset = useSharedValue(value ? 18 : 0);
  useEffect(() => {
    // The thumb follows the already-updated switch value with a short, direct glide.
    offset.value = withTiming(value ? 18 : 0, { duration: 145 });
  }, [offset, value]);
  const thumbMotion = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  return <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked: value, disabled }}
    accessibilityLabel={label}
    disabled={disabled}
    onPress={() => onChange(!value)}
    hitSlop={8}
    style={{ width: 52, height: 42, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
  >
    <View style={{ width: 46, height: 27, padding: 3, borderRadius: 16, justifyContent: 'center', backgroundColor: value ? palette.purple : palette.line }}>
      <Animated.View style={[{ width: 21, height: 21, borderRadius: 12, backgroundColor: '#FFFFFF' }, thumbMotion]} />
    </View>
  </Pressable>;
}
