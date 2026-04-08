import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Terms of Service
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-3">
          <Text className="text-white font-semibold mb-2">Use of app</Text>
          <Text className="text-textMuted text-sm">
            Habit Tracker is provided as-is for personal productivity. You are
            responsible for your own data and device security.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-3">
          <Text className="text-white font-semibold mb-2">Cloud sync</Text>
          <Text className="text-textMuted text-sm">
            Cloud sync is optional and can be turned on or off at any time from
            Settings.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4">
          <Text className="text-white font-semibold mb-2">Support</Text>
          <Text className="text-textMuted text-sm">
            Questions and feature requests can be sent to
            lakshyakumar90+habittracker@gmail.com.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
