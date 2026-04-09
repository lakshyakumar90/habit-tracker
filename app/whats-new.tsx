import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RELEASE_NOTES = [
  {
    version: "1.0.0",
    notes: [
      "Cloud sync with Google sign-in",
      "Celebrations, sound controls, and confetti effects",
      "Reminder scheduling with multiple reminders per habit",
      "Task timeline and list management",
    ],
  },
];

export default function WhatsNewScreen() {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">What is New</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {RELEASE_NOTES.map((release) => (
          <View
            key={release.version}
            className="rounded-2xl border p-4 mb-4"
            style={{
              backgroundColor: appTheme.card,
              borderColor: appTheme.cardBorder,
            }}
          >
            <Text
              className="font-bold text-base mb-2"
              style={{ color: appTheme.primary }}
            >
              Version {release.version}
            </Text>
            {release.notes.map((note) => (
              <View key={note} className="flex-row items-start mb-2">
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={appTheme.primary}
                  style={{ marginTop: 2 }}
                />
                <Text className="text-white ml-2 flex-1">{note}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
