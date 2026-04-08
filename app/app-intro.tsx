import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  {
    title: "Create your habit",
    text: "Pick a name, icon, frequency, and optional reminders.",
  },
  {
    title: "Check in every day",
    text: "Tap habits from the home screen to keep streaks alive.",
  },
  {
    title: "Track trends",
    text: "Use analytics and weekly views to spot consistency patterns.",
  },
  {
    title: "Back up with cloud sync",
    text: "Enable sync from Settings for multi-device continuity.",
  },
];

export default function AppIntroScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">App Intro</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {STEPS.map((step, index) => (
          <View
            key={step.title}
            className="bg-card rounded-2xl border border-cardBorder p-4 mb-3"
          >
            <Text className="text-primary font-semibold mb-1">
              Step {index + 1}
            </Text>
            <Text className="text-white font-semibold text-base mb-1">
              {step.title}
            </Text>
            <Text className="text-textMuted text-sm">{step.text}</Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => router.replace("/")}
          className="bg-primary rounded-2xl py-3 items-center mt-2"
          activeOpacity={0.8}
        >
          <Text className="text-black font-bold">Start Using App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
