import CustomSwitch from "@/components/common/CustomSwitch";
import CustomBottomSheet from "@/components/ui/BottomSheet";
import { AppTheme, getAppTheme, THEME_OPTIONS } from "@/constants/appThemes";
import { settingsRepository } from "@/services/settingsRepository";
import { disableCloudSync, enableCloudSync } from "@/services/syncRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  CELEBRATION_SOUND_OPTIONS,
  CelebrationSoundKey,
  playSoundPreview,
  preloadAppSounds,
  stopSoundPreview,
  TICK_SOUND_OPTIONS,
  TickSoundKey,
} from "@/utils/sound";
import { FULL_VERSION } from "@/utils/version";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type SheetType =
  | "theme"
  | "reminders"
  | "sound"
  | "celebration-sound"
  | "tick-sound"
  | "volume";

type ReminderSummary = {
  id: string;
  habitId: string;
  habitName: string;
  habitColor: string;
  time: string;
  enabled: boolean;
};

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <Text className="font-bold text-sm mb-2 ml-1" style={{ color }}>
      {title}
    </Text>
  );
}

function SectionCard({
  appTheme,
  children,
}: {
  appTheme: AppTheme;
  children: React.ReactNode;
}) {
  return (
    <View
      className="rounded-2xl border px-4 mb-6"
      style={{
        backgroundColor: appTheme.card,
        borderColor: appTheme.cardBorder,
      }}
    >
      {children}
    </View>
  );
}

function ToggleRow({
  appTheme,
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
}: {
  appTheme: AppTheme;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View
      className="flex-row items-center justify-between py-3"
      style={
        !isLast
          ? { borderBottomWidth: 1, borderColor: appTheme.cardBorder }
          : undefined
      }
    >
      <View className="flex-1 pr-3">
        <Text
          className="font-medium text-base"
          style={{ color: appTheme.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-sm mt-0.5"
            style={{ color: appTheme.textMuted }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <CustomSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SettingRow({
  appTheme,
  icon,
  title,
  subtitle,
  value,
  onPress,
  disabled,
  isLast = false,
}: {
  appTheme: AppTheme;
  icon: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      className="flex-row items-center py-4"
      style={{
        ...(isLast
          ? {}
          : { borderBottomWidth: 1, borderColor: appTheme.cardBorder }),
        opacity: disabled ? 0.6 : 1,
      }}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${appTheme.primary}15` }}
      >
        <Ionicons name={icon as never} size={20} color={appTheme.primary} />
      </View>
      <View className="flex-1">
        <Text
          className="font-medium text-base"
          style={{ color: appTheme.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-sm mt-0.5"
            style={{ color: appTheme.textMuted }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text className="text-sm mr-2" style={{ color: appTheme.textMuted }}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={appTheme.textMuted} />
    </TouchableOpacity>
  );
}

function SelectionRow({
  appTheme,
  title,
  subtitle,
  value,
  onPress,
  isLast = false,
}: {
  appTheme: AppTheme;
  title: string;
  subtitle?: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-3"
      style={
        !isLast
          ? { borderBottomWidth: 1, borderColor: appTheme.cardBorder }
          : undefined
      }
      activeOpacity={0.7}
    >
      <View className="flex-1 pr-3">
        <Text
          className="font-medium text-base"
          style={{ color: appTheme.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-sm mt-0.5"
            style={{ color: appTheme.textMuted }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center">
        <Text className="text-sm mr-2" style={{ color: appTheme.primary }}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={appTheme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function SheetTitle({
  appTheme,
  title,
  subtitle,
}: {
  appTheme: AppTheme;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="items-center mb-6">
      <Text
        className="font-bold text-lg"
        style={{ color: appTheme.textPrimary }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          className="text-sm mt-1 text-center"
          style={{ color: appTheme.textMuted }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const formatReminderTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
};

const getMinutesFromTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute))
    return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
};

const getCelebrationSoundLabel = (value: CelebrationSoundKey) =>
  CELEBRATION_SOUND_OPTIONS.find((option) => option.key === value)?.label ??
  value;
const getTickSoundLabel = (value: TickSoundKey) =>
  TICK_SOUND_OPTIONS.find((option) => option.key === value)?.label ?? value;

export default function SettingsScreen() {
  const theme = useSettingsStore((state) => state.theme);
  const remindersEnabled = useSettingsStore((state) => state.remindersEnabled);
  const celebrationsEnabled = useSettingsStore(
    (state) => state.celebrationsEnabled,
  );
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);
  const confettiEnabled = useSettingsStore((state) => state.confettiEnabled);
  const tickSoundEnabled = useSettingsStore((state) => state.tickSoundEnabled);
  const tickSound = useSettingsStore((state) => state.tickSound);
  const celebrationSound = useSettingsStore((state) => state.celebrationSound);
  const celebrationVolume = useSettingsStore(
    (state) => state.celebrationVolume,
  );
  const cloudSyncEnabled = useSettingsStore((state) => state.cloudSyncEnabled);
  const cloudSyncStatus = useSettingsStore((state) => state.cloudSyncStatus);
  const authUserSummary = useSettingsStore((state) => state.authUserSummary);
  const lastSyncError = useSettingsStore((state) => state.lastSyncError);
  const habits = useHabitStore((state) => state.habits);

  const appTheme = getAppTheme(theme);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentSheet, setCurrentSheet] = useState<SheetType | null>(null);

  // FIX #1: Track whether we're navigating between sheets to prevent
  // the onClose callback from clearing currentSheet during transitions
  const isTransitioningSheet = useRef(false);

  // FIX #4: Use refs for values needed in async callbacks to avoid stale closures
  const celebrationSoundRef = useRef(celebrationSound);
  const celebrationVolumeRef = useRef(celebrationVolume);
  useEffect(() => {
    celebrationSoundRef.current = celebrationSound;
  }, [celebrationSound]);
  useEffect(() => {
    celebrationVolumeRef.current = celebrationVolume;
  }, [celebrationVolume]);

  useEffect(() => {
    void preloadAppSounds();
    return () => {
      void stopSoundPreview();
    };
  }, []);

  // FIX #5: Use a more reliable approach to expand the sheet
  useEffect(() => {
    if (!currentSheet) return;

    // Small delay to ensure the bottom sheet component is mounted and ref is attached
    const timer = setTimeout(() => {
      bottomSheetRef.current?.expand();
    }, 50);

    return () => clearTimeout(timer);
  }, [currentSheet]);

  const reminderItems = useMemo<ReminderSummary[]>(
    () =>
      habits
        .flatMap((habit) =>
          (habit.reminders ?? []).map((reminder) => ({
            id: reminder.id,
            habitId: habit.id,
            habitName: habit.name,
            habitColor: habit.color,
            time: reminder.time,
            enabled: reminder.enabled,
          })),
        )
        .sort((a, b) => {
          if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
          return getMinutesFromTime(a.time) - getMinutesFromTime(b.time);
        }),
    [habits],
  );

  const activeReminderCount = useMemo(
    () => reminderItems.filter((item) => item.enabled).length,
    [reminderItems],
  );

  const sheetSnapPoints = useMemo(() => {
    switch (currentSheet) {
      case "theme":
        return ["42%"];
      case "reminders":
        return ["66%"];
      case "sound":
        return ["52%"];
      case "celebration-sound":
      case "tick-sound":
        return ["50%"];
      case "volume":
        return ["38%"];
      default:
        return ["50%"];
    }
  }, [currentSheet]);

  const openExternal = async (url: string, label: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unavailable", `Unable to open ${label} right now.`);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unavailable", `Unable to open ${label} right now.`);
    }
  };

  // FIX #1: Safe sheet navigation that prevents onClose from clearing state mid-transition
  const navigateSheet = useCallback((target: SheetType) => {
    isTransitioningSheet.current = true;
    void stopSoundPreview();
    bottomSheetRef.current?.close();

    // Wait for the close animation, then open the new sheet
    setTimeout(() => {
      isTransitioningSheet.current = false;
      setCurrentSheet(target);
    }, 300);
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    void stopSoundPreview();
  }, []);

  const handleSheetClose = useCallback(() => {
    // FIX #1: Don't clear state if we're transitioning between sheets
    if (isTransitioningSheet.current) return;
    setCurrentSheet(null);
    void stopSoundPreview();
  }, []);

  // FIX #2: Stop previous sound before playing a new one
  const previewCelebrationSound = useCallback(
    async (
      sound: CelebrationSoundKey,
      volume = celebrationVolumeRef.current,
    ) => {
      await stopSoundPreview();
      await playSoundPreview(sound, volume);
    },
    [],
  );

  const previewTickSound = useCallback(
    async (
      sound: TickSoundKey,
      volume = Math.max(0.1, celebrationVolumeRef.current * 0.7),
    ) => {
      await stopSoundPreview();
      await playSoundPreview(sound, volume);
    },
    [],
  );

  // FIX #4: Use refs to avoid stale closures on rapid taps
  const adjustVolume = useCallback(
    async (delta: number) => {
      const current = celebrationVolumeRef.current;
      const next = Number(Math.min(1, Math.max(0, current + delta)).toFixed(2));
      settingsRepository.updateSetting("celebrationVolume", next);
      await previewCelebrationSound(celebrationSoundRef.current, next);
    },
    [previewCelebrationSound],
  );

  const handleSendFeedback = useCallback(() => {
    void openExternal(
      "mailto:devtinder93@gmail.com?subject=Habit%20Tracker%20Feedback",
      "email app",
    );
  }, []);

  const handleRateApp = useCallback(() => {
    const androidUrl = "market://details?id=com.lakshya.kumar.habittracker";
    const androidFallback =
      "https://play.google.com/store/apps/details?id=com.lakshya.kumar.habittracker";
    const iosFallback = "https://apps.apple.com/";

    if (Platform.OS === "android") {
      Linking.canOpenURL(androidUrl)
        .then((supported) =>
          supported
            ? Linking.openURL(androidUrl)
            : Linking.openURL(androidFallback),
        )
        .catch(() => void openExternal(androidFallback, "Play Store"));
      return;
    }

    void openExternal(iosFallback, "App Store");
  }, []);

  const handleEnableCloudSync = useCallback(async () => {
    try {
      await enableCloudSync();
    } catch {
      Alert.alert(
        "Cloud Sync",
        "We couldn't enable cloud sync. Please try again.",
      );
    }
  }, []);

  const handleDisableCloudSync = useCallback(() => {
    Alert.alert(
      "Turn Off Cloud Sync",
      "This device will return to local-only mode. Your cloud data will stay safely stored in your account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn Off",
          style: "destructive",
          onPress: async () => {
            try {
              await disableCloudSync();
            } catch {
              Alert.alert(
                "Cloud Sync",
                "We couldn't disable cloud sync. Please try again.",
              );
            }
          },
        },
      ],
    );
  }, []);

  const reminderValue = remindersEnabled
    ? activeReminderCount > 0
      ? `${activeReminderCount} active`
      : "On"
    : "Off";
  const themeLabel =
    THEME_OPTIONS.find((option) => option.key === theme)?.label ?? "Dark Green";

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right", "bottom"]}
      style={{ backgroundColor: appTheme.background }}
    >
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={appTheme.textPrimary} />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold ml-4"
          style={{ color: appTheme.textPrimary }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard appTheme={appTheme}>
          <SettingRow
            appTheme={appTheme}
            icon="cloud"
            title="Cloud Sync"
            subtitle={
              cloudSyncEnabled
                ? authUserSummary?.email || "Connected with Google"
                : "Optional Google sign-in and realtime sync"
            }
            value={
              cloudSyncStatus === "migrating"
                ? "Connecting..."
                : cloudSyncEnabled
                  ? "On"
                  : "Off"
            }
            onPress={
              cloudSyncEnabled ? handleDisableCloudSync : handleEnableCloudSync
            }
            disabled={cloudSyncStatus === "migrating"}
          />
          {lastSyncError ? (
            <View
              className="py-3"
              style={{ borderBottomWidth: 1, borderColor: appTheme.cardBorder }}
            >
              <Text className="text-sm text-red-400">{lastSyncError}</Text>
            </View>
          ) : null}
          <SettingRow
            appTheme={appTheme}
            icon="archive"
            title="Archived Habits"
            subtitle="Review or restore habits you've tucked away"
            onPress={() => router.push("/archived-habits")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="color-palette"
            title="Theme"
            value={themeLabel}
            onPress={() => setCurrentSheet("theme")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="notifications"
            title="Reminders"
            subtitle={
              reminderItems.length > 0
                ? `${reminderItems.length} reminders configured across your habits`
                : "No reminder times added yet"
            }
            value={reminderValue}
            onPress={() => setCurrentSheet("reminders")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="volume-high"
            title="Sound"
            subtitle={`Tick: ${getTickSoundLabel(tickSound)} • Celebration: ${getCelebrationSoundLabel(celebrationSound)}`}
            value={soundEnabled ? "On" : "Off"}
            onPress={() => setCurrentSheet("sound")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="grid"
            title="Home Screen Widgets"
            subtitle="Track habits from your home screen"
            onPress={() => router.push("/widgets")}
            isLast
          />
        </SectionCard>

        <SectionTitle title="CELEBRATIONS" color={appTheme.textMuted} />
        <SectionCard appTheme={appTheme}>
          <ToggleRow
            appTheme={appTheme}
            title="Enable Celebrations"
            subtitle="Run celebration effects when weekly milestones are reached"
            value={celebrationsEnabled}
            onValueChange={(value) =>
              settingsRepository.updateSetting("celebrationsEnabled", value)
            }
          />
          <View className="py-3">
            <ToggleRow
              appTheme={appTheme}
              title="Confetti"
              subtitle="Top-center confetti burst"
              value={confettiEnabled}
              onValueChange={(value) =>
                settingsRepository.updateSetting("confettiEnabled", value)
              }
              isLast
            />
            <View className="pt-3">
              <Text className="text-sm" style={{ color: appTheme.textMuted }}>
                Celebration sounds are managed from the Sound sheet.
              </Text>
            </View>
          </View>
        </SectionCard>

        <SectionTitle title="HELP" color={appTheme.textMuted} />
        <SectionCard appTheme={appTheme}>
          <SettingRow
            appTheme={appTheme}
            icon="chatbubble"
            title="Send Feedback"
            onPress={handleSendFeedback}
          />
          <SettingRow
            appTheme={appTheme}
            icon="star"
            title="Rate App"
            onPress={handleRateApp}
          />
          <SettingRow
            appTheme={appTheme}
            icon="bulb"
            title="Roadmap & Ideas"
            subtitle="See what's next & share ideas"
            onPress={() => router.push("/roadmap")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="sparkles"
            title="What's New"
            onPress={() => router.push("/whats-new")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="play-circle"
            title="App Intro"
            subtitle="Replay the welcome tour"
            onPress={() => router.push("/app-intro")}
            isLast
          />
        </SectionCard>

        <SectionTitle title="ABOUT" color={appTheme.textMuted} />
        <SectionCard appTheme={appTheme}>
          <SettingRow
            appTheme={appTheme}
            icon="finger-print"
            title="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="document-text"
            title="Terms of Service"
            onPress={() => router.push("/terms")}
          />
          <View className="flex-row items-center py-4">
            <View
              className="w-10 h-10 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: `${appTheme.primary}1A` }}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={appTheme.primary}
              />
            </View>
            <View className="flex-1">
              <Text
                className="font-medium text-base"
                style={{ color: appTheme.textPrimary }}
              >
                Version
              </Text>
            </View>
            <Text
              className="text-sm mr-2"
              style={{ color: appTheme.textMuted }}
            >
              {FULL_VERSION}
            </Text>
          </View>
        </SectionCard>
      </ScrollView>

      {currentSheet ? (
        <CustomBottomSheet
          bottomSheetRef={bottomSheetRef}
          snapPoints={sheetSnapPoints}
          onClose={handleSheetClose}
        >
          <View className="px-4 py-2">
            {currentSheet === "theme" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Choose Theme"
                  subtitle="Switch the full app look instantly."
                />
                <View className="flex-row flex-wrap justify-center gap-4">
                  {THEME_OPTIONS.map((option) => {
                    const previewTheme = getAppTheme(option.key);
                    return (
                      <TouchableOpacity
                        key={option.key}
                        onPress={() => {
                          settingsRepository.updateSetting("theme", option.key);
                          closeSheet();
                        }}
                        className="w-24 rounded-2xl items-center justify-center border-2 px-3 py-4"
                        style={{
                          backgroundColor: previewTheme.card,
                          borderColor:
                            theme === option.key
                              ? appTheme.primary
                              : previewTheme.cardBorder,
                        }}
                        activeOpacity={0.8}
                      >
                        <View className="flex-row gap-1.5 mb-3">
                          <View
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: previewTheme.primary }}
                          />
                          <View
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: previewTheme.surface }}
                          />
                          <View
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: previewTheme.background }}
                          />
                        </View>
                        <Text
                          className="text-xs font-semibold text-center"
                          style={{ color: previewTheme.textPrimary }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            {/* FIX #3: Wrap reminders in a ScrollView for long lists */}
            {currentSheet === "reminders" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Reminders"
                  subtitle="Toggle notifications and review every reminder set in the app."
                />
                <SectionCard appTheme={appTheme}>
                  <View className="py-1">
                    <ToggleRow
                      appTheme={appTheme}
                      title="Enable Reminders"
                      subtitle="Schedule your habit notifications across the app"
                      value={remindersEnabled}
                      onValueChange={(value) =>
                        settingsRepository.updateSetting(
                          "remindersEnabled",
                          value,
                        )
                      }
                      isLast
                    />
                  </View>
                </SectionCard>
                <ScrollView
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <SectionCard appTheme={appTheme}>
                    {reminderItems.length === 0 ? (
                      <View className="py-4">
                        <Text
                          className="text-sm text-center"
                          style={{ color: appTheme.textMuted }}
                        >
                          No reminder times have been added to any habits yet.
                        </Text>
                      </View>
                    ) : (
                      reminderItems.map((item, index) => (
                        <View
                          key={`${item.habitId}-${item.id}`}
                          className="flex-row items-center justify-between py-3"
                          style={{
                            borderBottomWidth:
                              index === reminderItems.length - 1 ? 0 : 1,
                            borderColor: appTheme.cardBorder,
                          }}
                        >
                          <View className="flex-row items-center flex-1 pr-3">
                            <View
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: item.habitColor }}
                            />
                            <View className="flex-1">
                              <Text
                                className="font-medium text-base"
                                style={{ color: appTheme.textPrimary }}
                              >
                                {item.habitName}
                              </Text>
                              <Text
                                className="text-sm mt-0.5"
                                style={{ color: appTheme.textMuted }}
                              >
                                {formatReminderTime(item.time)}
                              </Text>
                            </View>
                          </View>
                          <View
                            className="px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: item.enabled
                                ? `${appTheme.primary}22`
                                : appTheme.surface,
                            }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{
                                color: item.enabled
                                  ? appTheme.primary
                                  : appTheme.textMuted,
                              }}
                            >
                              {item.enabled ? "On" : "Off"}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </SectionCard>
                </ScrollView>
              </>
            ) : null}

            {currentSheet === "sound" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Sound"
                  subtitle="Pick your feedback sounds and preview them before you leave."
                />
                <SectionCard appTheme={appTheme}>
                  <View className="py-1">
                    <ToggleRow
                      appTheme={appTheme}
                      title="Enable App Sounds"
                      subtitle="Master switch for ticks and celebration audio"
                      value={soundEnabled}
                      onValueChange={(value) =>
                        settingsRepository.updateSetting("soundEnabled", value)
                      }
                    />
                    <ToggleRow
                      appTheme={appTheme}
                      title="Tick Sound"
                      subtitle="Play a sound when a habit is marked done"
                      value={tickSoundEnabled}
                      onValueChange={(value) =>
                        settingsRepository.updateSetting(
                          "tickSoundEnabled",
                          value,
                        )
                      }
                    />
                    <SelectionRow
                      appTheme={appTheme}
                      title="Tick Variety"
                      subtitle="Try the sound used for daily completions"
                      value={getTickSoundLabel(tickSound)}
                      onPress={() => navigateSheet("tick-sound")}
                    />
                    <SelectionRow
                      appTheme={appTheme}
                      title="Celebration Sound"
                      subtitle="Preview the weekly milestone sound"
                      value={getCelebrationSoundLabel(celebrationSound)}
                      onPress={() => navigateSheet("celebration-sound")}
                    />
                    <TouchableOpacity
                      onPress={() => navigateSheet("volume")}
                      className="flex-row items-center justify-between pt-3"
                      activeOpacity={0.7}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className="font-medium text-base"
                          style={{ color: appTheme.textPrimary }}
                        >
                          Volume
                        </Text>
                        <Text
                          className="text-sm mt-0.5"
                          style={{ color: appTheme.textMuted }}
                        >
                          Preview the current celebration sound while adjusting
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text
                          className="text-sm mr-2"
                          style={{ color: appTheme.primary }}
                        >
                          {Math.round(celebrationVolume * 100)}%
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={appTheme.textMuted}
                        />
                      </View>
                    </TouchableOpacity>
                  </View>
                </SectionCard>
              </>
            ) : null}

            {currentSheet === "celebration-sound" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Celebration Sound"
                  subtitle="Tap any option to hear it immediately."
                />
                <SectionCard appTheme={appTheme}>
                  {CELEBRATION_SOUND_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={async () => {
                        settingsRepository.updateSetting(
                          "celebrationSound",
                          option.key,
                        );
                        await previewCelebrationSound(option.key);
                      }}
                      className="flex-row items-center justify-between py-4"
                      style={{
                        borderBottomWidth:
                          index === CELEBRATION_SOUND_OPTIONS.length - 1
                            ? 0
                            : 1,
                        borderColor: appTheme.cardBorder,
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="sparkles"
                          size={18}
                          color={appTheme.primary}
                        />
                        <Text
                          className="font-medium text-base ml-3"
                          style={{ color: appTheme.textPrimary }}
                        >
                          {option.label}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="play-circle"
                          size={18}
                          color={appTheme.textMuted}
                        />
                        {celebrationSound === option.key ? (
                          <Ionicons
                            name="checkmark"
                            size={22}
                            color={appTheme.primary}
                            style={{ marginLeft: 10 }}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </SectionCard>
              </>
            ) : null}

            {currentSheet === "tick-sound" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Tick Variety"
                  subtitle="Tap any option to hear the completion feedback."
                />
                <SectionCard appTheme={appTheme}>
                  {TICK_SOUND_OPTIONS.map((option, index) => (
                    <TouchableOpacity
                      key={option.key}
                      onPress={async () => {
                        settingsRepository.updateSetting(
                          "tickSound",
                          option.key,
                        );
                        await previewTickSound(option.key);
                      }}
                      className="flex-row items-center justify-between py-4"
                      style={{
                        borderBottomWidth:
                          index === TICK_SOUND_OPTIONS.length - 1 ? 0 : 1,
                        borderColor: appTheme.cardBorder,
                      }}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="musical-note"
                          size={18}
                          color={appTheme.primary}
                        />
                        <Text
                          className="font-medium text-base ml-3"
                          style={{ color: appTheme.textPrimary }}
                        >
                          {option.label}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="play-circle"
                          size={18}
                          color={appTheme.textMuted}
                        />
                        {tickSound === option.key ? (
                          <Ionicons
                            name="checkmark"
                            size={22}
                            color={appTheme.primary}
                            style={{ marginLeft: 10 }}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </SectionCard>
              </>
            ) : null}

            {currentSheet === "volume" ? (
              <>
                <SheetTitle
                  appTheme={appTheme}
                  title="Volume"
                  subtitle="Each change replays your current celebration sound."
                />
                <SectionCard appTheme={appTheme}>
                  <View className="items-center py-4">
                    <Text
                      className="text-3xl font-bold"
                      style={{ color: appTheme.textPrimary }}
                    >
                      {Math.round(celebrationVolume * 100)}%
                    </Text>
                    <View
                      className="w-full h-3 rounded-full mt-4 overflow-hidden"
                      style={{ backgroundColor: appTheme.surface }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, celebrationVolume * 100)}%`,
                          backgroundColor: appTheme.primary,
                        }}
                      />
                    </View>
                    <View className="flex-row items-center gap-3 mt-6">
                      <TouchableOpacity
                        onPress={() => void adjustVolume(-0.1)}
                        className="w-12 h-12 rounded-2xl border items-center justify-center"
                        style={{
                          backgroundColor: appTheme.surface,
                          borderColor: appTheme.cardBorder,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={appTheme.textPrimary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          void previewCelebrationSound(celebrationSound)
                        }
                        className="px-5 h-12 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: `${appTheme.primary}22` }}
                        activeOpacity={0.7}
                      >
                        <Text
                          className="font-semibold"
                          style={{ color: appTheme.primary }}
                        >
                          Play Preview
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void adjustVolume(0.1)}
                        className="w-12 h-12 rounded-2xl border items-center justify-center"
                        style={{
                          backgroundColor: appTheme.surface,
                          borderColor: appTheme.cardBorder,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={appTheme.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </SectionCard>
              </>
            ) : null}
          </View>
        </CustomBottomSheet>
      ) : null}
    </SafeAreaView>
  );
}
