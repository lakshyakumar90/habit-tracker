import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROADMAP_DATA = [
  {
    quarter: "Q2 2024 (Up Next)",
    status: "in-progress",
    items: [
      "Habit templates and starter packs",
      "Native home screen widgets",
      "Calendar integrations for reminders",
    ],
  },
  {
    quarter: "Q3 2024",
    status: "planned",
    items: [
      "CSV export and import",
      "Advanced streak analytics",
      "Gamification and friend challenges",
    ],
  },
  {
    quarter: "Q4 2024",
    status: "future",
    items: ["Interactive web dashboard", "Wear OS & Apple Watch companions"],
  },
];

export default function RoadmapScreen() {
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Roadmap & Ideas
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28, paddingTop: 16 }}
      >
        <Text className="text-white font-bold text-2xl mb-2">Our Vision</Text>
        <Text className="text-textMuted text-base mb-8 leading-6">
          We are constantly building and improving Habit Tracker to give you the
          best experience. Here is a sneak peek at what is coming next!
        </Text>

        {ROADMAP_DATA.map((phase) => (
          <View key={phase.quarter} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-semibold text-lg">
                {phase.quarter}
              </Text>
              {phase.status === "in-progress" && (
                <View
                  className="px-2 py-1 rounded-md"
                  style={{ backgroundColor: `${appTheme.primary}33` }}
                >
                  <Text
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: appTheme.primary }}
                  >
                    IN PROGRESS
                  </Text>
                </View>
              )}
            </View>

            <View
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: appTheme.card,
                borderColor: appTheme.cardBorder,
              }}
            >
              {phase.items.map((item, index) => (
                <View
                  key={item}
                  className={`flex-row items-center p-4 ${
                    index !== phase.items.length - 1
                      ? "border-b border-cardBorder"
                      : ""
                  }`}
                >
                  <Ionicons
                    name={
                      phase.status === "in-progress"
                        ? "hammer-outline"
                        : "calendar-outline"
                    }
                    size={18}
                    color={
                      phase.status === "in-progress" ? appTheme.primary : "#888"
                    }
                  />
                  <Text className="text-white ml-3 flex-1 text-base">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View
          className="mt-4 p-4 rounded-2xl border flex-row items-center"
          style={{
            backgroundColor: `${appTheme.primary}1A`,
            borderColor: `${appTheme.primary}33`,
          }}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color={appTheme.primary}
          />
          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold mb-1">Got an idea?</Text>
            <Text className="text-textMuted text-sm">
              We'd love to hear it. Reach out via email or leave a review!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
