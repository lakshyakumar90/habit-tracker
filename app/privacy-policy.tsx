import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

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
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
      >
        <View className="mb-6 border-b border-cardBorder pb-4">
          <Text className="text-white font-bold text-3xl mb-2">
            Privacy Policy
          </Text>
          <Text className="text-textMuted text-sm font-medium">
            Last updated: May 12, 2024
          </Text>
        </View>

        <Text className="text-white text-base leading-6 mb-6">
          Your privacy is important to us. It is Habit Tracker's policy to
          respect your privacy regarding any information we may collect from you
          across our application.
        </Text>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            1. Information We Collect
          </Text>
          <View className="ml-4 space-y-4">
            <Text className="text-white text-base font-semibold mb-1">
              Log Data
            </Text>
            <Text className="text-textMuted text-base leading-6 mb-4">
              When you access our servers via Cloud Sync, we may automatically
              log the standard data provided by your web browser or device. It
              may include your device's Internet Protocol (IP) address, your
              device type and version, the time and date of your visit, the time
              spent on each page, and other details.
            </Text>

            <Text className="text-white text-base font-semibold mb-1">
              Local Data
            </Text>
            <Text className="text-textMuted text-base leading-6">
              By default, all your habits, routines, and app settings are stored
              locally on your device. If you use the Cloud Sync feature, this
              data is encrypted in transit and stored securely on our servers to
              synchronize your progress across devices.
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            2. Authentication Providers
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            We use third-party authentication services, such as Google Sign-In,
            to securely verify your identity when using optional Cloud features.
            We do not have access to your passwords. We only receive basic
            profile information (like your email and name).
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="text-white font-bold text-xl mb-3 flex-row items-center border-l-4 pl-3 bg-bg"
            style={{ borderLeftColor: appTheme.primary }}
          >
            3. Security
          </Text>
          <Text className="text-textMuted text-base leading-6 mb-2 ml-4">
            We take security seriously and utilize accepted industry standards
            to protect your personal information, though no method of
            transmission over the Internet, or method of electronic storage is
            100% secure.
          </Text>
        </View>

        <View
          className="rounded-2xl p-5 border mt-4"
          style={{
            backgroundColor: appTheme.card,
            borderColor: appTheme.cardBorder,
          }}
        >
          <Text className="text-white font-semibold text-lg mb-2">
            Have a question?
          </Text>
          <Text className="text-textMuted text-base leading-6">
            If you have any questions or suggestions about our Privacy Policy,
            do not hesitate to contact us at{" "}
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
