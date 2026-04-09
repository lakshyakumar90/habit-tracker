import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import React from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function CustomSwitch({
  value,
  onValueChange,
}: CustomSwitchProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(value ? appTheme.primary : "#374151", {
      duration: 200,
    }),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(value ? 20 : 0, { duration: 200 }),
      },
    ],
  }));

  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.8}>
      <Animated.View
        style={[
          {
            width: 48,
            height: 28,
            borderRadius: 14,
            justifyContent: "center",
            paddingHorizontal: 4,
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "white",
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
