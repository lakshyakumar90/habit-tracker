import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FABProps {
  onPress: () => void;
  visible?: boolean;
}

export default function FloatingActionButton({
  onPress,
  visible = true,
}: FABProps) {
  const insets = useSafeAreaInsets();
  const selectedTheme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(selectedTheme);

  if (!visible) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute right-4 w-[52px] h-[52px] items-center justify-center rounded-[20px]"
      activeOpacity={0.8}
      style={{
        bottom: insets.bottom + 16,
        backgroundColor: appTheme.primaryLight,
        shadowColor: appTheme.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
      }}
    >
      <Ionicons name="add" size={28} color="black" />
    </TouchableOpacity>
  );
}
