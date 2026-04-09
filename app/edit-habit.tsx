import CategoryPicker from "@/components/habits/CategoryPicker";
import ColorPicker from "@/components/habits/ColorPicker";
import CompletionTarget from "@/components/habits/CompletionTarget";
import IconPicker from "@/components/habits/IconPicker";
import ReminderTimePickerModal from "@/components/habits/ReminderTimePickerModal";
import { DEFAULT_HABIT_COLOR } from "@/constants/Colors";
import { getAppTheme } from "@/constants/appThemes";
import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { FrequencyType, HabitType, Reminder } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habits = useHabitStore((state) => state.habits);
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const insets = useSafeAreaInsets();

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
  const [showCategories, setShowCategories] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [pickerReminderId, setPickerReminderId] = useState<string | null>(null);
  const [pickerDraftDate, setPickerDraftDate] = useState(new Date());

  useEffect(() => {
    if (id) {
      const existingHabit = habits.find((h) => h.id === id);
      if (existingHabit) {
        setName(existingHabit.name);
        setColor(existingHabit.color);
        setIcon(existingHabit.icon);
        setHabitType(existingHabit.type);
        setFrequency(existingHabit.frequency || "daily");
        setTargetCount(existingHabit.targetCount || 1);
        setCompletionTargetEnabled(
          existingHabit.completionTargetEnabled || false,
        );
        setSelectedDays(existingHabit.days || []);
        setSelectedCategory(existingHabit.category || "");
        setReminders(existingHabit.reminders || []);
      }
    }
  }, [id, habits]);

  const addReminder = () => {
    const reminderId = `${Date.now()}-${reminders.length}`;
    setReminders((current) => [
      ...current,
      {
        id: reminderId,
        time: "09:00",
        enabled: true,
      },
    ]);
    setPickerDraftDate(parseReminderTime("09:00"));
    setPickerReminderId(reminderId);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id ? { ...reminder, ...updates } : reminder,
      ),
    );
  };

  const removeReminder = (id: string) => {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
    if (pickerReminderId === id) {
      setPickerReminderId(null);
    }
  };

  const parseReminderTime = (value: string) => {
    const [hoursText = "9", minutesText = "0"] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);
    const date = new Date();
    date.setHours(Number.isFinite(hours) ? hours : 9);
    date.setMinutes(Number.isFinite(minutes) ? minutes : 0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };

  const formatReminderTime = (value: string) => {
    const [hoursText = "0", minutesText = "0"] = value.split(":");
    const hours = Number(hoursText);
    const minutes = Number(minutesText);
    const safeHours = Number.isFinite(hours)
      ? Math.min(23, Math.max(0, hours))
      : 0;
    const safeMinutes = Number.isFinite(minutes)
      ? Math.min(59, Math.max(0, minutes))
      : 0;
    const period = safeHours >= 12 ? "PM" : "AM";
    const hour12 = safeHours % 12 || 12;
    return `${hour12}:${safeMinutes.toString().padStart(2, "0")} ${period}`;
  };

  const openReminderPicker = (id: string, time: string) => {
    setPickerDraftDate(parseReminderTime(time));
    setPickerReminderId(id);
  };

  const closeReminderPicker = () => {
    setPickerReminderId(null);
  };

  const confirmReminderPicker = (date: Date) => {
    if (!pickerReminderId) return;
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    updateReminder(pickerReminderId, { time: `${hours}:${minutes}` });
    setPickerReminderId(null);
  };

  const handleSave = () => {
    if (!name.trim() || !id) return;

    habitRepository.updateHabit(id, {
      name: name.trim(),
      type: habitType,
      color,
      icon,
      category: selectedCategory,
      frequency,
      targetCount: completionTargetEnabled ? targetCount : 1,
      days: selectedDays,
      reminders,
      completionTargetEnabled,
    });

    router.back();
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right"]}
      style={{ backgroundColor: appTheme.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-6 pt-6 pb-4">
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold ml-4">Edit Habit</Text>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
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
            <View
              className="rounded-2xl border px-4 py-3"
              style={{
                backgroundColor: appTheme.surface,
                borderColor: appTheme.cardBorder,
              }}
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="What habit do you want to build?"
                placeholderTextColor="#6b7280"
                className="text-white text-base"
                autoFocus={false}
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
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
                style={{
                  backgroundColor:
                    habitType === "check"
                      ? `${appTheme.primary}1A`
                      : appTheme.surface,
                  borderColor:
                    habitType === "check"
                      ? appTheme.primary
                      : appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={habitType === "check" ? appTheme.primary : "#6b7280"}
                />
                <Text
                  className="ml-2 font-semibold"
                  style={{
                    color:
                      habitType === "check"
                        ? appTheme.textPrimary
                        : appTheme.textMuted,
                  }}
                >
                  Checkmark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setHabitType("time")}
                className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
                style={{
                  backgroundColor:
                    habitType === "time"
                      ? `${appTheme.primary}1A`
                      : appTheme.surface,
                  borderColor:
                    habitType === "time"
                      ? appTheme.primary
                      : appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="timer"
                  size={20}
                  color={habitType === "time" ? appTheme.primary : "#6b7280"}
                />
                <Text
                  className="ml-2 font-semibold"
                  style={{
                    color:
                      habitType === "time"
                        ? appTheme.textPrimary
                        : appTheme.textMuted,
                  }}
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
            <View
              className="flex-1 h-px bg-cardBorder"
              style={{ borderStyle: "dashed" }}
            />
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
              <View
                className="rounded-2xl border p-4"
                style={{
                  backgroundColor: appTheme.surface,
                  borderColor: appTheme.cardBorder,
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${appTheme.primary}1A` }}
                >
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={appTheme.primary}
                  />
                </View>
                <View className="ml-3 mt-2">
                  <Text className="text-white font-semibold">Reminders</Text>
                  <Text className="text-textMuted text-sm">
                    Stay consistent by setting one or more reminder times
                  </Text>
                </View>

                <View className="mt-3 gap-2">
                  {reminders.map((reminder) => (
                    <View
                      key={reminder.id}
                      className="rounded-xl border p-3"
                      style={{
                        backgroundColor: appTheme.card,
                        borderColor: appTheme.cardBorder,
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          className="flex-row items-center flex-1"
                          onPress={() =>
                            openReminderPicker(reminder.id, reminder.time)
                          }
                          activeOpacity={0.7}
                        >
                          <View
                            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                            style={{ backgroundColor: `${appTheme.primary}1A` }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={18}
                              color={appTheme.primary}
                            />
                          </View>
                          <View>
                            <Text className="text-textMuted text-xs">
                              Reminder time
                            </Text>
                            <Text className="text-white text-lg font-semibold mt-0.5">
                              {formatReminderTime(reminder.time)}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <Switch
                          value={reminder.enabled}
                          onValueChange={(value) =>
                            updateReminder(reminder.id, { enabled: value })
                          }
                          trackColor={{
                            false: "#4b5563",
                            true: appTheme.primary,
                          }}
                          thumbColor="#f3f4f6"
                        />

                        <TouchableOpacity
                          onPress={() => removeReminder(reminder.id)}
                          className="ml-3"
                          hitSlop={10}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#f87171"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={addReminder}
                    className="rounded-2xl py-4 items-center justify-center flex-row"
                    style={{ backgroundColor: appTheme.primary }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#0b0b0b" />
                    <Text
                      className="font-bold text-base ml-2"
                      style={{ color: "#0b0b0b" }}
                    >
                      Add Reminder
                    </Text>
                  </TouchableOpacity>

                  {reminders.length > 0 && (
                    <View
                      className="rounded-xl border px-3 py-3 flex-row items-center"
                      style={{
                        backgroundColor: `${appTheme.primary}12`,
                        borderColor: `${appTheme.primary}33`,
                      }}
                    >
                      <Ionicons
                        name="bulb-outline"
                        size={16}
                        color={appTheme.primary}
                      />
                      <Text
                        className="ml-2 text-sm"
                        style={{ color: appTheme.textMuted }}
                      >
                        Users with reminders are more consistent.
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Categories */}
              <TouchableOpacity
                onPress={() => setShowCategories(true)}
                className="rounded-2xl border p-4 flex-row items-center"
                style={{
                  backgroundColor: appTheme.surface,
                  borderColor: appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${appTheme.primary}1A` }}
                >
                  <Ionicons
                    name="folder-open"
                    size={20}
                    color={appTheme.primary}
                  />
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
        <View
          className="px-4"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={!name.trim()}
            activeOpacity={0.8}
            className="rounded-2xl overflow-hidden"
          >
            <LinearGradient
              colors={
                name.trim()
                  ? [appTheme.primaryLight, appTheme.primary]
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
                Save Changes
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

      <ReminderTimePickerModal
        visible={!!pickerReminderId}
        value={pickerDraftDate}
        onCancel={closeReminderPicker}
        onConfirm={confirmReminderPicker}
      />
    </SafeAreaView>
  );
}
