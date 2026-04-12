import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import React, { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TIMING_CONFIG = { duration: 200 };
const TRACK_ON_OFFSET = 20;
const TRACK_OFF_OFFSET = 0;
const TRACK_OFF_COLOR = "#374151";

function CustomSwitch({ value, onValueChange }: CustomSwitchProps) {
  const theme = useSettingsStore((s) => s.theme);
  const appTheme = useMemo(() => getAppTheme(theme), [theme]);

  const onColor = appTheme.primary;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      value ? onColor : TRACK_OFF_COLOR,
      TIMING_CONFIG,
    ),
  }), [value, onColor]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(
          value ? TRACK_ON_OFFSET : TRACK_OFF_OFFSET,
          TIMING_CONFIG,
        ),
      },
    ],
  }), [value]);

  const handlePress = useCallback(() => {
    onValueChange(!value);
  }, [value, onValueChange]);

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
});

export default React.memo(CustomSwitch);