import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
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
      {value && (
        <Text className="text-textMuted text-sm mr-2">{value}</Text>
      )}
      <Ionicons name="chevron-forward" size={18} color="#6b7280" />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const settings = useSettingsStore();

  const handleComingSoon = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} will be available in a future update!`);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">Settings</Text>
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
            title="Cloud Backup"
            subtitle="Backup to Google Drive"
            badge="PRO"
            onPress={() => handleComingSoon("Cloud Backup")}
          />
          <SettingRow 
            icon="archive" 
            title="Archived Habits" 
            onPress={() => handleComingSoon("Archived Habits")}
          />
          <SettingRow
            icon="color-palette"
            title="Theme"
            value={settings.theme === "dark-green" ? "Dark Green" : settings.theme}
            onPress={() => handleComingSoon("Themes")}
          />
          <SettingRow
            icon="notifications"
            title="Reminders"
            value={settings.remindersEnabled ? "On" : "Off"}
            onPress={() =>
              settings.updateSetting(
                "remindersEnabled",
                !settings.remindersEnabled
              )
            }
          />
          <SettingRow
            icon="sparkles"
            title="Celebrations"
            value={
              settings.celebrationsEnabled ? "Sound & Confetti" : "Off"
            }
            onPress={() =>
              settings.updateSetting(
                "celebrationsEnabled",
                !settings.celebrationsEnabled
              )
            }
          />
          <SettingRow
            icon="grid"
            title="Home Screen Widgets"
            subtitle="Track habits from your home screen"
            onPress={() => handleComingSoon("Home Screen Widgets")}
          />
        </View>

        {/* Help */}
        <Text className="text-textMuted font-bold text-sm mb-2 ml-1">
          HELP
        </Text>
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <SettingRow icon="chatbubble" title="Send Feedback" onPress={() => handleComingSoon("Feedback")} />
          <SettingRow icon="star" title="Rate App" onPress={() => handleComingSoon("App rating")} />
          <SettingRow
            icon="bulb"
            title="Roadmap & Ideas"
            subtitle="See what's next & share ideas"
            onPress={() => handleComingSoon("Roadmap")}
          />
          <SettingRow icon="sparkles" title="What's New" onPress={() => handleComingSoon("Changelog")} />
          <SettingRow
            icon="play-circle"
            title="App Intro"
            subtitle="Replay the welcome tour"
            onPress={() => handleComingSoon("App tour")}
          />
        </View>

        {/* About */}
        <Text className="text-textMuted font-bold text-sm mb-2 ml-1">
          ABOUT
        </Text>
        <View className="bg-card rounded-2xl border border-cardBorder px-4 mb-6">
          <SettingRow icon="finger-print" title="Privacy Policy" onPress={() => handleComingSoon("Privacy Policy")} />
          <SettingRow icon="document-text" title="Terms of Service" onPress={() => handleComingSoon("Terms of Service")} />
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
