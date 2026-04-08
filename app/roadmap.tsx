import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ROADMAP_ITEMS = [
  "Habit templates and starter packs",
  "Native home screen widgets",
  "Calendar integrations for reminders",
  "CSV export and import",
  "Advanced streak analytics",
];

export default function RoadmapScreen() {
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
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-4">
          <Text className="text-white font-semibold text-base mb-1">
            What we are building next
          </Text>
          <Text className="text-textMuted text-sm">
            These are active priorities and can shift based on usage and
            feedback.
          </Text>
        </View>

        {ROADMAP_ITEMS.map((item) => (
          <View
            key={item}
            className="bg-card rounded-2xl border border-cardBorder p-4 mb-3 flex-row items-start"
          >
            <Ionicons
              name="ellipse"
              size={10}
              color="#22c55e"
              style={{ marginTop: 6 }}
            />
            <Text className="text-white ml-3 flex-1">{item}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
