import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-3">
          <Text className="text-white font-semibold mb-2">Data we store</Text>
          <Text className="text-textMuted text-sm">
            Habit data, task data, and app settings are stored locally and
            optionally synced to your account when Cloud Sync is enabled.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-3">
          <Text className="text-white font-semibold mb-2">Authentication</Text>
          <Text className="text-textMuted text-sm">
            Google sign-in is only used when you explicitly enable cloud sync.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4">
          <Text className="text-white font-semibold mb-2">Contact</Text>
          <Text className="text-textMuted text-sm">
            For privacy questions, contact
            lakshyakumar90+habittracker@gmail.com.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
