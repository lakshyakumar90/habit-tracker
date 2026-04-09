import { getAppTheme } from "@/constants/appThemes";
import { ICON_CATEGORIES } from "@/constants/icons";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface IconPickerProps {
  selectedIcon: string;
  onSelect: (icon: string) => void;
  color: string;
}

export default function IconPicker({
  selectedIcon,
  onSelect,
  color,
}: IconPickerProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);
  const [showIconModal, setShowIconModal] = useState(false);

  return (
    <View className="mb-6">
      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={() => setShowIconModal(true)}
          activeOpacity={0.8}
          className="w-20 h-20 rounded-full items-center justify-center mb-2 border"
          style={{
            backgroundColor: `${color}20`,
            borderColor: appTheme.cardBorder,
          }}
        >
          <Ionicons name={selectedIcon as any} size={36} color={color} />
        </TouchableOpacity>
        <Text className="text-textMuted text-xs mb-2">Tap to change</Text>
      </View>

      <Modal
        visible={showIconModal}
        animationType="slide"
        onRequestClose={() => setShowIconModal(false)}
      >
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: appTheme.background }}
        >
          <View className="flex-row items-center px-5 py-4 border-b border-cardBorder">
            <TouchableOpacity
              onPress={() => setShowIconModal(false)}
              hitSlop={12}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={appTheme.textPrimary}
              />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-3">
              Choose Icon
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-5 pt-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {ICON_CATEGORIES.map((category) => (
              <View key={category.title} className="my-6">
                <Text className="text-textSecondary text-sm font-bold mb-3">
                  {category.title}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {category.icons.map((iconOption) => {
                    const isActive = selectedIcon === iconOption;
                    return (
                      <TouchableOpacity
                        key={iconOption}
                        onPress={() => {
                          onSelect(iconOption);
                          setShowIconModal(false);
                        }}
                        className="h-12 w-12 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: appTheme.surface,
                          borderColor: isActive ? color : appTheme.cardBorder,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={iconOption as any}
                          size={24}
                          color={isActive ? color : "#6b7280"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
