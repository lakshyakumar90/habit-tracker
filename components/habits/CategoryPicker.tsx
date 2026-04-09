import { getAppTheme } from "@/constants/appThemes";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    Modal,
    Pressable,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface CategoryPickerProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  onClose: () => void;
}

export default function CategoryPicker({
  selectedCategory,
  onSelect,
  onClose,
}: CategoryPickerProps) {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const [customName, setCustomName] = useState("");
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const addCustomCategory = () => {
    if (!customName.trim()) return;
    const newCat = { name: customName.trim(), icon: "star" };
    setCategories([...categories, newCat]);
    setCustomName("");
  };

  return (
    <Modal visible animationType="slide" transparent>
      <Pressable className="flex-1 bg-black/50" onPress={onClose} />
      <View className="bg-bg rounded-t-3xl px-4 pb-8 pt-4 border-t border-cardBorder">
        {/* Handle */}
        <View className="w-10 h-1 bg-textMuted rounded-full self-center mb-4" />

        {/* Header */}
        <View className="flex-row items-center mb-4">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${appTheme.primary}1A` }}
          >
            <Ionicons name="folder-open" size={20} color={appTheme.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Categories</Text>
            <Text className="text-textMuted text-sm">
              Pick categories for your habit
            </Text>
          </View>
        </View>

        {/* Green accent line */}
        <View
          className="w-1 h-4 rounded-full ml-1 mb-2"
          style={{ backgroundColor: appTheme.primary }}
        />

        {/* Common Categories */}
        <Text className="text-textMuted font-bold text-xs mb-3 tracking-wider">
          COMMON CATEGORIES
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                onPress={() => onSelect(cat.name)}
                className="flex-row items-center px-4 py-2.5 rounded-xl border"
                style={{
                  backgroundColor: isActive
                    ? `${appTheme.primary}1A`
                    : appTheme.surface,
                  borderColor: isActive
                    ? appTheme.primary
                    : appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isActive ? appTheme.primary : "#9ca3af"}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{
                    color: isActive
                      ? appTheme.textPrimary
                      : appTheme.textSecondary,
                  }}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Category */}
        <Text className="text-textMuted font-bold text-xs mb-3 tracking-wider">
          CUSTOM CATEGORIES
        </Text>

        <View
          className="flex-row items-center rounded-2xl border px-3 py-2 mb-2"
          style={{
            backgroundColor: appTheme.surface,
            borderColor: appTheme.cardBorder,
          }}
        >
          <TouchableOpacity
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${appTheme.primary}1A` }}
          >
            <Ionicons name="star" size={18} color={appTheme.primary} />
          </TouchableOpacity>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="New category name..."
            placeholderTextColor={appTheme.textMuted}
            className="flex-1 text-base"
            style={{ color: appTheme.textPrimary }}
            onSubmitEditing={addCustomCategory}
          />
          <TouchableOpacity
            onPress={addCustomCategory}
            className="w-10 h-10 rounded-xl items-center justify-center border"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color={appTheme.primary} />
          </TouchableOpacity>
        </View>

        <Text className="text-textMuted text-xs ml-1 mb-6">
          Tap icon to change
        </Text>

        {/* Done Button */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          className="rounded-2xl overflow-hidden"
        >
          <LinearGradient
            colors={[appTheme.primaryLight, appTheme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-4 items-center justify-center rounded-2xl"
          >
            <Text className="text-black text-lg font-bold">Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
