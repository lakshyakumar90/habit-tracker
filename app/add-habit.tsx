import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ColorPicker from "@/components/habits/ColorPicker";
import IconPicker from "@/components/habits/IconPicker";
import CompletionTarget from "@/components/habits/CompletionTarget";
import CategoryPicker from "@/components/habits/CategoryPicker";
import { useHabitStore } from "@/store/useHabitStore";
import { HabitType, FrequencyType } from "@/types";
import { DEFAULT_HABIT_COLOR } from "@/constants/Colors";

export default function AddHabitScreen() {
  const { addHabit } = useHabitStore();

  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_HABIT_COLOR);
  const [icon, setIcon] = useState("paw");
  const [habitType, setHabitType] = useState<HabitType>("check");
  const [frequency, setFrequency] = useState<FrequencyType>("daily");
  const [targetCount, setTargetCount] = useState(1);
  const [completionTargetEnabled, setCompletionTargetEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      type: habitType,
      color,
      icon,
      category: selectedCategory,
      frequency,
      targetCount: completionTargetEnabled ? targetCount : 1,
      days: selectedDays,
      reminders: [],
      completionTargetEnabled,
    });

    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">New Habit</Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Icon Picker */}
          <IconPicker selectedIcon={icon} onSelect={setIcon} color={color} />

          {/* Habit Name */}
          <View className="mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="pencil" size={16} color="#9ca3af" />
              <Text className="text-white font-medium text-base ml-2">
                Habit Name <Text className="text-red-500">*</Text>
              </Text>
            </View>
            <View className="bg-surface rounded-2xl border border-cardBorder px-4 py-3">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What habit do you want to build?"
                placeholderTextColor="#6b7280"
                className="text-white text-base"
                autoFocus
              />
            </View>
          </View>

          {/* Color Picker */}
          <View className="mb-6">
            <ColorPicker selectedColor={color} onSelect={setColor} />
          </View>

          {/* Habit Type */}
          <View className="mb-6">
            <Text className="text-white font-medium text-base mb-3">
              Habit Type
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setHabitType("check")}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                  habitType === "check"
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-cardBorder"
                }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={habitType === "check" ? "#22c55e" : "#6b7280"}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    habitType === "check" ? "text-white" : "text-textMuted"
                  }`}
                >
                  Checkmark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setHabitType("time")}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
                  habitType === "time"
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-cardBorder"
                }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color={habitType === "time" ? "#22c55e" : "#6b7280"}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    habitType === "time" ? "text-white" : "text-textMuted"
                  }`}
                >
                  Time Tracked
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-textMuted text-sm mt-2 ml-1">
              {habitType === "check"
                ? "Mark habit as done for the day with a single tap or set frequency targets."
                : "Track the time you spend on this habit each day."}
            </Text>
          </View>

          {/* Completion Target */}
          {habitType === "check" && (
            <View className="mb-6">
              <CompletionTarget
                enabled={completionTargetEnabled}
                onToggle={setCompletionTargetEnabled}
                frequency={frequency}
                onFrequencyChange={setFrequency}
                targetCount={targetCount}
                onTargetChange={setTargetCount}
                selectedDays={selectedDays}
                onDaysChange={setSelectedDays}
              />
            </View>
          )}

          {/* Advanced Section */}
          <TouchableOpacity
            onPress={() => setShowAdvanced(!showAdvanced)}
            className="flex-row items-center justify-center py-3 mb-4"
            activeOpacity={0.7}
          >
            <View className="flex-1 h-px bg-cardBorder" style={{ borderStyle: "dashed" }} />
            <View className="flex-row items-center mx-4">
              <Text className="text-textMuted font-medium mr-1">Advanced</Text>
              <Ionicons
                name={showAdvanced ? "chevron-up" : "chevron-down"}
                size={16}
                color="#6b7280"
              />
            </View>
            <View className="flex-1 h-px bg-cardBorder" />
          </TouchableOpacity>

          {showAdvanced && (
            <View className="gap-3 mb-6">
              {/* Reminders */}
              <TouchableOpacity
                onPress={() => setShowReminders(true)}
                className="bg-surface rounded-2xl border border-cardBorder p-4 flex-row items-center"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <Ionicons name="notifications" size={20} color="#22c55e" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">Reminders</Text>
                  <Text className="text-textMuted text-sm">
                    Stay on track with notifications
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>

              {/* Categories */}
              <TouchableOpacity
                onPress={() => setShowCategories(true)}
                className="bg-surface rounded-2xl border border-cardBorder p-4 flex-row items-center"
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <Ionicons name="folder-open" size={20} color="#22c55e" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">Categories</Text>
                  <Text className="text-textMuted text-sm">
                    Organize your habits
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={handleSave}
            disabled={!name.trim()}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={
                name.trim()
                  ? ["#4ade80", "#22c55e"]
                  : ["#374151", "#374151"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 items-center justify-center rounded-2xl"
            >
              <Text
                className={`text-lg font-bold ${
                  name.trim() ? "text-black" : "text-textMuted"
                }`}
              >
                Save
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Category Picker Modal */}
      {showCategories && (
        <CategoryPicker
          selectedCategory={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat);
            setShowCategories(false);
          }}
          onClose={() => setShowCategories(false)}
        />
      )}
    </SafeAreaView>
  );
}