import CustomSwitch from "@/components/common/CustomSwitch";
import { THEME_OPTIONS, getAppTheme } from "@/constants/appThemes";
import { settingsRepository } from "@/services/settingsRepository";
import { disableCloudSync, enableCloudSync } from "@/services/syncRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
}

function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-cardBorder">
      <View className="flex-1 pr-3">
        <Text className="text-white font-medium text-base">{title}</Text>
        {subtitle ? (
          <Text className="text-textMuted text-sm mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      <CustomSwitch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function SettingRow({
  icon,
  iconColor = "#22c55e",
  title,
  subtitle,
  value,
  badge,
  onPress,
}: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-cardBorder"
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium text-base">{title}</Text>
        {subtitle && (
          <Text className="text-textMuted text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      {badge && (
        <View className="bg-amber-500 px-2 py-0.5 rounded mr-2">
          <Text className="text-black text-xs font-bold">{badge}</Text>
        </View>
      )}
      {value && <Text className="text-textMuted text-sm mr-2">{value}</Text>}
      <Ionicons name="chevron-forward" size={18} color="#6b7280" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

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

  const handleSendFeedback = () => {
    const mailto =
      "mailto:lakshyakumar90+habittracker@gmail.com?subject=Habit%20Tracker%20Feedback";
    void openExternal(mailto, "email app");
  };

  const handleRateApp = () => {
    const androidUrl = "market://details?id=com.lakshya.kumar.habittracker";
    const androidFallback =
      "https://play.google.com/store/apps/details?id=com.lakshya.kumar.habittracker";
    const iosFallback = "https://apps.apple.com/";

    if (Platform.OS === "android") {
      Linking.canOpenURL(androidUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(androidUrl);
          }
          return Linking.openURL(androidFallback);
        })
        .catch(() => {
          void openExternal(androidFallback, "Play Store");
        });
      return;
    }

    void openExternal(iosFallback, "App Store");
  };

  const handleThemePicker = () => {
    Alert.alert("Choose Theme", "Apply a theme instantly across the app", [
      ...THEME_OPTIONS.map((option) => ({
        text:
          option.key === settings.theme
            ? `${option.label} (Active)`
            : option.label,
        onPress: () => settingsRepository.updateSetting("theme", option.key),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const celebrationSounds: ("sparkle" | "chime" | "pop")[] = [
    "sparkle",
    "chime",
    "pop",
  ];

  const soundIndex = celebrationSounds.indexOf(settings.celebrationSound);

  const handleCycleCelebrationSound = () => {
    const next = celebrationSounds[(soundIndex + 1) % celebrationSounds.length];
    settings.updateSetting("celebrationSound", next);
  };

  const adjustVolume = (delta: number) => {
    const next = Math.min(1, Math.max(0, settings.celebrationVolume + delta));
    settingsRepository.updateSetting(
      "celebrationVolume",
      Number(next.toFixed(2)),
    );
  };

  const handleEnableCloudSync = async () => {
    try {
      await enableCloudSync();
    } catch {
      Alert.alert(
        "Cloud Sync",
        "We couldn't enable cloud sync. Please try again.",
      );
    }
  };

  const handleDisableCloudSync = () => {
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
  };

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right"]}
      style={{ backgroundColor: appTheme.background }}
    >
      {/* Header */}
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Settings */}
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <SettingRow
            icon="cloud"
            title="Cloud Sync"
            subtitle={
              settings.cloudSyncEnabled
                ? settings.authUserSummary?.email || "Connected with Google"
                : "Optional Google sign-in and realtime sync"
            }
            value={
              settings.cloudSyncStatus === "migrating"
                ? "Connecting..."
                : settings.cloudSyncEnabled
                  ? "On"
                  : "Off"
            }
            onPress={
              settings.cloudSyncEnabled
                ? handleDisableCloudSync
                : handleEnableCloudSync
            }
          />
          {!!settings.lastSyncError && (
            <View className="py-3 border-b border-cardBorder">
              <Text className="text-red-400 text-sm">
                {settings.lastSyncError}
              </Text>
            </View>
          )}
          <SettingRow
            icon="archive"
            title="Archived Habits"
            onPress={() => router.push("/archived-habits")}
          />
          <SettingRow
            icon="color-palette"
            title="Theme"
            value={
              THEME_OPTIONS.find((option) => option.key === settings.theme)
                ?.label
            }
            onPress={handleThemePicker}
          />
          <SettingRow
            icon="notifications"
            title="Reminders"
            value={settings.remindersEnabled ? "On" : "Off"}
            onPress={() =>
              settingsRepository.updateSetting(
                "remindersEnabled",
                !settings.remindersEnabled,
              )
            }
          />
          <SettingRow
            icon="volume-high"
            title="Sound"
            value={settings.soundEnabled ? "On" : "Off"}
            onPress={() =>
              settingsRepository.updateSetting(
                "soundEnabled",
                !settings.soundEnabled,
              )
            }
          />
          <SettingRow
            icon="sparkles"
            title="Celebrations"
            value={settings.celebrationsEnabled ? "Sound & Confetti" : "Off"}
            onPress={() =>
              settingsRepository.updateSetting(
                "celebrationsEnabled",
                !settings.celebrationsEnabled,
              )
            }
          />
          <SettingRow
            icon="grid"
            title="Home Screen Widgets"
            subtitle="Track habits from your home screen"
            onPress={() => router.push("/widgets")}
          />
        </View>

        <Text className="text-textMuted font-bold text-sm mb-2 ml-1">
          CELEBRATIONS
        </Text>
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <ToggleRow
            title="Enable Celebrations"
            subtitle="Run celebration effects when weekly milestones are reached"
            value={settings.celebrationsEnabled}
            onValueChange={(value) =>
              settingsRepository.updateSetting("celebrationsEnabled", value)
            }
          />
          <ToggleRow
            title="Confetti"
            subtitle="Top-center confetti burst"
            value={settings.confettiEnabled}
            onValueChange={(value) =>
              settingsRepository.updateSetting("confettiEnabled", value)
            }
          />
          <ToggleRow
            title="Tick Sound"
            subtitle="Play a small sound when habit is marked done"
            value={settings.tickSoundEnabled}
            onValueChange={(value) =>
              settingsRepository.updateSetting("tickSoundEnabled", value)
            }
          />
          <View className="flex-row items-center justify-between py-3 border-b border-cardBorder">
            <View className="flex-1 pr-3">
              <Text className="text-white font-medium text-base">
                Celebration Sound
              </Text>
              <Text className="text-textMuted text-sm mt-0.5">
                Choose milestone sound style
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCycleCelebrationSound}
              className="px-3 py-2 rounded-lg bg-surface border border-cardBorder"
              activeOpacity={0.7}
            >
              <Text className="text-primary font-semibold capitalize">
                {settings.celebrationSound}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1 pr-3">
              <Text className="text-white font-medium text-base">
                Celebration Volume
              </Text>
              <Text className="text-textMuted text-sm mt-0.5">
                Current: {Math.round(settings.celebrationVolume * 100)}%
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => adjustVolume(-0.1)}
                className="w-8 h-8 rounded-lg bg-surface border border-cardBorder items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => adjustVolume(0.1)}
                className="w-8 h-8 rounded-lg bg-surface border border-cardBorder items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Help */}
        <Text className="text-textMuted font-bold text-sm mb-2 ml-1">HELP</Text>
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <SettingRow
            icon="chatbubble"
            title="Send Feedback"
            onPress={handleSendFeedback}
          />
          <SettingRow icon="star" title="Rate App" onPress={handleRateApp} />
          <SettingRow
            icon="bulb"
            title="Roadmap & Ideas"
            subtitle="See what's next & share ideas"
            onPress={() => router.push("/roadmap")}
          />
          <SettingRow
            icon="sparkles"
            title="What's New"
            onPress={() => router.push("/whats-new")}
          />
          <SettingRow
            icon="play-circle"
            title="App Intro"
            subtitle="Replay the welcome tour"
            onPress={() => router.push("/app-intro")}
          />
        </View>

        {/* About */}
        <Text className="text-textMuted font-bold text-sm mb-2 ml-1">
          ABOUT
        </Text>
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <SettingRow
            icon="finger-print"
            title="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
          <SettingRow
            icon="document-text"
            title="Terms of Service"
            onPress={() => router.push("/terms")}
          />
          <View className="flex-row items-center py-4">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="information-circle" size={20} color="#22c55e" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium text-base">Version</Text>
            </View>
            <Text className="text-textMuted text-sm mr-2">1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
