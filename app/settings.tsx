import CustomSwitch from "@/components/common/CustomSwitch";
import { SyncToCloud } from "@/components/SyncToCloud";
import CustomBottomSheet from "@/components/ui/BottomSheet";
import { AppTheme, getAppTheme, THEME_OPTIONS } from "@/constants/appThemes";
import { settingsRepository } from "@/services/settingsRepository";
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
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  InteractionManager,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEET_SNAP_POINTS: Record<SheetType, string[]> = {
  theme: ["42%"],
  reminders: ["66%"],
  sound: ["52%"],
  "celebration-sound": ["50%"],
  "tick-sound": ["50%"],
  volume: ["38%"],
};

const DEFAULT_SNAP = ["50%"];
const SHEET_TRANSITION_DELAY = 300;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatReminderTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
};

const getMinutesFromTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
};

const getCelebrationSoundLabel = (value: CelebrationSoundKey) =>
  CELEBRATION_SOUND_OPTIONS.find((o) => o.key === value)?.label ?? value;

const getTickSoundLabel = (value: TickSoundKey) =>
  TICK_SOUND_OPTIONS.find((o) => o.key === value)?.label ?? value;

// ─── Memoized Sub-Components ──────────────────────────────────────────────────

const SectionTitle = React.memo(({ title, color }: { title: string; color: string }) => (
  <Text className="font-bold text-sm mb-2 ml-1" style={{ color }}>
    {title}
  </Text>
));

const SectionCard = React.memo(
  ({ appTheme, children }: { appTheme: AppTheme; children: React.ReactNode }) => (
    <View
      className="rounded-2xl border px-4 mb-6"
      style={{ backgroundColor: appTheme.card, borderColor: appTheme.cardBorder }}
    >
      {children}
    </View>
  ),
);

const ToggleRow = React.memo(
  ({
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
    onValueChange: (v: boolean) => void;
    isLast?: boolean;
  }) => (
    <View
      className="flex-row items-center justify-between py-3"
      style={
        !isLast ? { borderBottomWidth: 1, borderColor: appTheme.cardBorder } : undefined
      }
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm mt-0.5" style={{ color: appTheme.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <CustomSwitch value={value} onValueChange={onValueChange} />
    </View>
  ),
);

const SettingRow = React.memo(
  ({
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
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      className="flex-row items-center py-4"
      style={{
        ...(isLast ? {} : { borderBottomWidth: 1, borderColor: appTheme.cardBorder }),
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
        <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm mt-0.5" style={{ color: appTheme.textMuted }}>
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
  ),
);

const SelectionRow = React.memo(
  ({
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
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-3"
      style={
        !isLast ? { borderBottomWidth: 1, borderColor: appTheme.cardBorder } : undefined
      }
      activeOpacity={0.7}
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm mt-0.5" style={{ color: appTheme.textMuted }}>
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
  ),
);

const SheetTitle = React.memo(
  ({ appTheme, title, subtitle }: { appTheme: AppTheme; title: string; subtitle?: string }) => (
    <View className="items-center mb-6">
      <Text className="font-bold text-lg" style={{ color: appTheme.textPrimary }}>
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-sm mt-1 text-center" style={{ color: appTheme.textMuted }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  ),
);

// ─── Sheet Content Components (lazy-rendered) ─────────────────────────────────

const ThemeSheet = React.memo(
  ({ appTheme, theme, onClose }: { appTheme: AppTheme; theme: string; onClose: () => void }) => (
    <>
      <SheetTitle appTheme={appTheme} title="Choose Theme" subtitle="Switch the full app look instantly." />
      <View className="flex-row flex-wrap justify-center gap-4">
        {THEME_OPTIONS.map((option) => {
          const previewTheme = getAppTheme(option.key);
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => {
                settingsRepository.updateSetting("theme", option.key);
                onClose();
              }}
              className="w-24 rounded-2xl items-center justify-center border-2 px-3 py-4"
              style={{
                backgroundColor: previewTheme.card,
                borderColor: theme === option.key ? appTheme.primary : previewTheme.cardBorder,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row gap-1.5 mb-3">
                <View className="w-4 h-4 rounded-full" style={{ backgroundColor: previewTheme.primary }} />
                <View className="w-4 h-4 rounded-full" style={{ backgroundColor: previewTheme.surface }} />
                <View className="w-4 h-4 rounded-full" style={{ backgroundColor: previewTheme.background }} />
              </View>
              <Text className="text-xs font-semibold text-center" style={{ color: previewTheme.textPrimary }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  ),
);

const RemindersSheet = React.memo(
  ({
    appTheme,
    remindersEnabled,
    reminderItems,
  }: {
    appTheme: AppTheme;
    remindersEnabled: boolean;
    reminderItems: ReminderSummary[];
  }) => (
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
            onValueChange={(v) => settingsRepository.updateSetting("remindersEnabled", v)}
            isLast
          />
        </View>
      </SectionCard>
      <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <SectionCard appTheme={appTheme}>
          {reminderItems.length === 0 ? (
            <View className="py-4">
              <Text className="text-sm text-center" style={{ color: appTheme.textMuted }}>
                No reminder times have been added to any habits yet.
              </Text>
            </View>
          ) : (
            reminderItems.map((item, index) => (
              <View
                key={`${item.habitId}-${item.id}`}
                className="flex-row items-center justify-between py-3"
                style={{
                  borderBottomWidth: index === reminderItems.length - 1 ? 0 : 1,
                  borderColor: appTheme.cardBorder,
                }}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.habitColor }} />
                  <View className="flex-1">
                    <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
                      {item.habitName}
                    </Text>
                    <Text className="text-sm mt-0.5" style={{ color: appTheme.textMuted }}>
                      {formatReminderTime(item.time)}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: item.enabled ? `${appTheme.primary}22` : appTheme.surface,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: item.enabled ? appTheme.primary : appTheme.textMuted }}
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
  ),
);

const SoundSheet = React.memo(
  ({
    appTheme,
    soundEnabled,
    tickSoundEnabled,
    tickSound,
    celebrationSound,
    celebrationVolume,
    navigateSheet,
  }: {
    appTheme: AppTheme;
    soundEnabled: boolean;
    tickSoundEnabled: boolean;
    tickSound: TickSoundKey;
    celebrationSound: CelebrationSoundKey;
    celebrationVolume: number;
    navigateSheet: (target: SheetType) => void;
  }) => (
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
            onValueChange={(v) => settingsRepository.updateSetting("soundEnabled", v)}
          />
          <ToggleRow
            appTheme={appTheme}
            title="Tick Sound"
            subtitle="Play a sound when a habit is marked done"
            value={tickSoundEnabled}
            onValueChange={(v) => settingsRepository.updateSetting("tickSoundEnabled", v)}
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
              <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
                Volume
              </Text>
              <Text className="text-sm mt-0.5" style={{ color: appTheme.textMuted }}>
                Preview the current celebration sound while adjusting
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-sm mr-2" style={{ color: appTheme.primary }}>
                {Math.round(celebrationVolume * 100)}%
              </Text>
              <Ionicons name="chevron-forward" size={18} color={appTheme.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      </SectionCard>
    </>
  ),
);

const CelebrationSoundSheet = React.memo(
  ({
    appTheme,
    celebrationSound,
    onSelect,
  }: {
    appTheme: AppTheme;
    celebrationSound: CelebrationSoundKey;
    onSelect: (key: CelebrationSoundKey) => void;
  }) => (
    <>
      <SheetTitle appTheme={appTheme} title="Celebration Sound" subtitle="Tap any option to hear it immediately." />
      <SectionCard appTheme={appTheme}>
        {CELEBRATION_SOUND_OPTIONS.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            className="flex-row items-center justify-between py-4"
            style={{
              borderBottomWidth: index === CELEBRATION_SOUND_OPTIONS.length - 1 ? 0 : 1,
              borderColor: appTheme.cardBorder,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={18} color={appTheme.primary} />
              <Text className="font-medium text-base ml-3" style={{ color: appTheme.textPrimary }}>
                {option.label}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="play-circle" size={18} color={appTheme.textMuted} />
              {celebrationSound === option.key ? (
                <Ionicons name="checkmark" size={22} color={appTheme.primary} style={{ marginLeft: 10 }} />
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </SectionCard>
    </>
  ),
);

const TickSoundSheet = React.memo(
  ({
    appTheme,
    tickSound,
    onSelect,
  }: {
    appTheme: AppTheme;
    tickSound: TickSoundKey;
    onSelect: (key: TickSoundKey) => void;
  }) => (
    <>
      <SheetTitle appTheme={appTheme} title="Tick Variety" subtitle="Tap any option to hear the completion feedback." />
      <SectionCard appTheme={appTheme}>
        {TICK_SOUND_OPTIONS.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => onSelect(option.key)}
            className="flex-row items-center justify-between py-4"
            style={{
              borderBottomWidth: index === TICK_SOUND_OPTIONS.length - 1 ? 0 : 1,
              borderColor: appTheme.cardBorder,
            }}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="musical-note" size={18} color={appTheme.primary} />
              <Text className="font-medium text-base ml-3" style={{ color: appTheme.textPrimary }}>
                {option.label}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="play-circle" size={18} color={appTheme.textMuted} />
              {tickSound === option.key ? (
                <Ionicons name="checkmark" size={22} color={appTheme.primary} style={{ marginLeft: 10 }} />
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </SectionCard>
    </>
  ),
);

const VolumeSheet = React.memo(
  ({
    appTheme,
    celebrationVolume,
    onAdjust,
    onPreview,
  }: {
    appTheme: AppTheme;
    celebrationVolume: number;
    onAdjust: (delta: number) => void;
    onPreview: () => void;
  }) => (
    <>
      <SheetTitle appTheme={appTheme} title="Volume" subtitle="Each change replays your current celebration sound." />
      <SectionCard appTheme={appTheme}>
        <View className="items-center py-4">
          <Text className="text-3xl font-bold" style={{ color: appTheme.textPrimary }}>
            {Math.round(celebrationVolume * 100)}%
          </Text>
          <View className="w-full h-3 rounded-full mt-4 overflow-hidden" style={{ backgroundColor: appTheme.surface }}>
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
              onPress={() => onAdjust(-0.1)}
              className="w-12 h-12 rounded-2xl border items-center justify-center"
              style={{ backgroundColor: appTheme.surface, borderColor: appTheme.cardBorder }}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={20} color={appTheme.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onPreview}
              className="px-5 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${appTheme.primary}22` }}
              activeOpacity={0.7}
            >
              <Text className="font-semibold" style={{ color: appTheme.primary }}>
                Play Preview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onAdjust(0.1)}
              className="w-12 h-12 rounded-2xl border items-center justify-center"
              style={{ backgroundColor: appTheme.surface, borderColor: appTheme.cardBorder }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={20} color={appTheme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </SectionCard>
    </>
  ),
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const theme = useSettingsStore((s) => s.theme);
  const remindersEnabled = useSettingsStore((s) => s.remindersEnabled);
  const celebrationsEnabled = useSettingsStore((s) => s.celebrationsEnabled);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const confettiEnabled = useSettingsStore((s) => s.confettiEnabled);
  const tickSoundEnabled = useSettingsStore((s) => s.tickSoundEnabled);
  const tickSound = useSettingsStore((s) => s.tickSound);
  const celebrationSound = useSettingsStore((s) => s.celebrationSound);
  const celebrationVolume = useSettingsStore((s) => s.celebrationVolume);
  const habits = useHabitStore((s) => s.habits);

  const appTheme = useMemo(() => getAppTheme(theme), [theme]);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentSheet, setCurrentSheet] = useState<SheetType | null>(null);
  const isTransitioningSheet = useRef(false);

  const celebrationSoundRef = useRef(celebrationSound);
  const celebrationVolumeRef = useRef(celebrationVolume);
  useEffect(() => { celebrationSoundRef.current = celebrationSound; }, [celebrationSound]);
  useEffect(() => { celebrationVolumeRef.current = celebrationVolume; }, [celebrationVolume]);

  useEffect(() => {
    void preloadAppSounds();
    return () => { void stopSoundPreview(); };
  }, []);

  useEffect(() => {
    if (!currentSheet) return;
    const handle = InteractionManager.runAfterInteractions(() => {
      bottomSheetRef.current?.expand();
    });
    return () => handle.cancel();
  }, [currentSheet]);

  // ─── Derived data ───────────────────────────────────────────────────────────

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
    () => reminderItems.filter((i) => i.enabled).length,
    [reminderItems],
  );

  const sheetSnapPoints = useMemo(
    () => (currentSheet ? SHEET_SNAP_POINTS[currentSheet] ?? DEFAULT_SNAP : DEFAULT_SNAP),
    [currentSheet],
  );

  // ─── Callbacks ──────────────────────────────────────────────────────────────

  const navigateSheet = useCallback((target: SheetType) => {
    isTransitioningSheet.current = true;
    void stopSoundPreview();
    bottomSheetRef.current?.close();
    setTimeout(() => {
      isTransitioningSheet.current = false;
      setCurrentSheet(target);
    }, SHEET_TRANSITION_DELAY);
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetRef.current?.close();
    void stopSoundPreview();
  }, []);

  const handleSheetClose = useCallback(() => {
    if (isTransitioningSheet.current) return;
    setCurrentSheet(null);
    void stopSoundPreview();
  }, []);

  const previewCelebrationSound = useCallback(
    async (sound: CelebrationSoundKey, volume = celebrationVolumeRef.current) => {
      await stopSoundPreview();
      await playSoundPreview(sound, volume);
    },
    [],
  );

  const previewTickSound = useCallback(
    async (sound: TickSoundKey, volume = Math.max(0.1, celebrationVolumeRef.current * 0.7)) => {
      await stopSoundPreview();
      await playSoundPreview(sound, volume);
    },
    [],
  );

  const adjustVolume = useCallback(
    async (delta: number) => {
      const next = Number(Math.min(1, Math.max(0, celebrationVolumeRef.current + delta)).toFixed(2));
      settingsRepository.updateSetting("celebrationVolume", next);
      await previewCelebrationSound(celebrationSoundRef.current, next);
    },
    [previewCelebrationSound],
  );

  const handleSelectCelebrationSound = useCallback(
    async (key: CelebrationSoundKey) => {
      settingsRepository.updateSetting("celebrationSound", key);
      await previewCelebrationSound(key);
    },
    [previewCelebrationSound],
  );

  const handleSelectTickSound = useCallback(
    async (key: TickSoundKey) => {
      settingsRepository.updateSetting("tickSound", key);
      await previewTickSound(key);
    },
    [previewTickSound],
  );

  const handleVolumePreview = useCallback(() => {
    void previewCelebrationSound(celebrationSoundRef.current);
  }, [previewCelebrationSound]);

  const handleVolumeAdjust = useCallback(
    (delta: number) => { void adjustVolume(delta); },
    [adjustVolume],
  );

  const handleSendFeedback = useCallback(() => {
    void Linking.openURL("mailto:devtinder93@gmail.com?subject=Habit%20Tracker%20Feedback").catch(() =>
      Alert.alert("Unavailable", "Unable to open email app right now."),
    );
  }, []);

  const handleRateApp = useCallback(() => {
    const androidUrl = "market://details?id=com.lakshya.kumar.habittracker";
    const androidFallback = "https://play.google.com/store/apps/details?id=com.lakshya.kumar.habittracker";
    const iosFallback = "https://apps.apple.com/";

    if (Platform.OS === "android") {
      Linking.canOpenURL(androidUrl)
        .then((ok) => Linking.openURL(ok ? androidUrl : androidFallback))
        .catch(() => Linking.openURL(androidFallback).catch(() => {}));
      return;
    }
    void Linking.openURL(iosFallback).catch(() => {});
  }, []);

  // ─── Derived display values ─────────────────────────────────────────────────

  const reminderValue = remindersEnabled
    ? activeReminderCount > 0
      ? `${activeReminderCount} active`
      : "On"
    : "Off";

  const themeLabel = useMemo(
    () => THEME_OPTIONS.find((o) => o.key === theme)?.label ?? "Dark Green",
    [theme],
  );

  const soundSubtitle = useMemo(
    () => `Tick: ${getTickSoundLabel(tickSound)} • Celebration: ${getCelebrationSoundLabel(celebrationSound)}`,
    [tickSound, celebrationSound],
  );

  const reminderSubtitle = useMemo(
    () =>
      reminderItems.length > 0
        ? `${reminderItems.length} reminders configured across your habits`
        : "No reminder times added yet",
    [reminderItems.length],
  );

  // ─── Sheet content renderer ─────────────────────────────────────────────────

  const renderSheetContent = useMemo(() => {
    if (!currentSheet) return null;

    switch (currentSheet) {
      case "theme":
        return <ThemeSheet appTheme={appTheme} theme={theme} onClose={closeSheet} />;
      case "reminders":
        return (
          <RemindersSheet
            appTheme={appTheme}
            remindersEnabled={remindersEnabled}
            reminderItems={reminderItems}
          />
        );
      case "sound":
        return (
          <SoundSheet
            appTheme={appTheme}
            soundEnabled={soundEnabled}
            tickSoundEnabled={tickSoundEnabled}
            tickSound={tickSound}
            celebrationSound={celebrationSound}
            celebrationVolume={celebrationVolume}
            navigateSheet={navigateSheet}
          />
        );
      case "celebration-sound":
        return (
          <CelebrationSoundSheet
            appTheme={appTheme}
            celebrationSound={celebrationSound}
            onSelect={handleSelectCelebrationSound}
          />
        );
      case "tick-sound":
        return (
          <TickSoundSheet
            appTheme={appTheme}
            tickSound={tickSound}
            onSelect={handleSelectTickSound}
          />
        );
      case "volume":
        return (
          <VolumeSheet
            appTheme={appTheme}
            celebrationVolume={celebrationVolume}
            onAdjust={handleVolumeAdjust}
            onPreview={handleVolumePreview}
          />
        );
      default:
        return null;
    }
  }, [
    currentSheet,
    appTheme,
    theme,
    remindersEnabled,
    reminderItems,
    soundEnabled,
    tickSoundEnabled,
    tickSound,
    celebrationSound,
    celebrationVolume,
    closeSheet,
    navigateSheet,
    handleSelectCelebrationSound,
    handleSelectTickSound,
    handleVolumeAdjust,
    handleVolumePreview,
  ]);

  // ─── Render ─────────────────────────────────────────────────────────────────

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
        <Text className="text-xl font-bold ml-4" style={{ color: appTheme.textPrimary }}>
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
          <View className="py-3">
            <SyncToCloud />
          </View>
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
            subtitle={reminderSubtitle}
            value={reminderValue}
            onPress={() => setCurrentSheet("reminders")}
          />
          <SettingRow
            appTheme={appTheme}
            icon="volume-high"
            title="Sound"
            subtitle={soundSubtitle}
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
            onValueChange={(v) => settingsRepository.updateSetting("celebrationsEnabled", v)}
          />
          <View className="py-3">
            <ToggleRow
              appTheme={appTheme}
              title="Confetti"
              subtitle="Top-center confetti burst"
              value={confettiEnabled}
              onValueChange={(v) => settingsRepository.updateSetting("confettiEnabled", v)}
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
          <SettingRow appTheme={appTheme} icon="chatbubble" title="Send Feedback" onPress={handleSendFeedback} />
          <SettingRow appTheme={appTheme} icon="star" title="Rate App" onPress={handleRateApp} />
          <SettingRow
            appTheme={appTheme}
            icon="bulb"
            title="Roadmap & Ideas"
            subtitle="See what's next & share ideas"
            onPress={() => router.push("/roadmap")}
          />
          <SettingRow appTheme={appTheme} icon="sparkles" title="What's New" onPress={() => router.push("/whats-new")} />
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
              <Ionicons name="information-circle" size={20} color={appTheme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-base" style={{ color: appTheme.textPrimary }}>
                Version
              </Text>
            </View>
            <Text className="text-sm mr-2" style={{ color: appTheme.textMuted }}>
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
          <View className="px-4 py-2">{renderSheetContent}</View>
        </CustomBottomSheet>
      ) : null}
    </SafeAreaView>
  );
}