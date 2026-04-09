import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TermsScreen() {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

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
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
      >
        <View className="mb-6 border-b border-cardBorder pb-4">
          <Text className="text-white font-bold text-3xl mb-2">
            Terms of Service
          </Text>
          <Text className="text-textMuted text-sm font-medium">
            Last updated: May 12, 2024
          </Text>
        </View>

        <Text className="text-white text-base leading-6 mb-6">
          By accessing and using Habit Tracker, you accept and agree to be bound
          by the terms and provision of this agreement.
        </Text>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            1. Use of the App
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            Habit Tracker is provided "as is" and "as available". We make no
            warranties, either expressed or implied. Your use of this service is
            at your own risk. The app is intended for personal productivity and
            habit tracking.
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            2. Opt-in Cloud Services
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            If you enable Cloud Sync, you agree to allow us to securely store
            your data on our servers to enable cross-device synchronization and
            back-up retrieval functionality. This is entirely optional and can
            be turned off via Settings.
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            3. User Responsibility
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            You are responsible for maintaining the security of your device and
            the confidentiality of your account credentials. You must
            immediately notify us of any unauthorized uses of your account or
            any other breaches of security.
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            4. Modifications
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            We reserve the right to modify these terms at any time. We will
            always update the "Last updated" date at the top of these terms when
            changes are made. Continued use of the app signifies your acceptance
            of any new terms.
          </Text>
        </View>

        <View
          className="border rounded-2xl p-5 mt-4"
          style={{
            backgroundColor: appTheme.card,
            borderColor: appTheme.cardBorder,
          }}
        >
          <Text className="text-white font-semibold text-lg mb-2">
            Need Support?
          </Text>
          <Text className="text-textMuted text-base leading-6">
            For support regarding your account, the app behavior, or these
            terms, contact us at{" "}
            <Text className="font-medium" style={{ color: appTheme.primary }}>
              devtinder93@gmail.com
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
