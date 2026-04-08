import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WidgetsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold ml-4">
          Home Screen Widgets
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-4">
          <Text className="text-white font-semibold text-base mb-1">
            Current status
          </Text>
          <Text className="text-textMuted text-sm">
            Native widgets require platform-specific extension setup and are
            tracked as a dedicated build milestone.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4 mb-4">
          <Text className="text-white font-semibold text-base mb-2">
            What is planned
          </Text>
          <Text className="text-textMuted text-sm">
            1. Quick habit completion widget.
          </Text>
          <Text className="text-textMuted text-sm">
            2. Today progress widget with streak summary.
          </Text>
          <Text className="text-textMuted text-sm">
            3. Configurable widget size and habit selection.
          </Text>
        </View>

        <View className="bg-card rounded-2xl border border-cardBorder p-4">
          <Text className="text-white font-semibold text-base mb-2">
            Platform notes
          </Text>
          {Platform.OS === "android" ? (
            <Text className="text-textMuted text-sm">
              Android widget support will be shipped with a native app widget
              provider in a production build.
            </Text>
          ) : Platform.OS === "ios" ? (
            <Text className="text-textMuted text-sm">
              iOS widget support will be shipped through a WidgetKit extension
              in the iOS production build.
            </Text>
          ) : (
            <Text className="text-textMuted text-sm">
              Widgets are not supported on web builds.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
