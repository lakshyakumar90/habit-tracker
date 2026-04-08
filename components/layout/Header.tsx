import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { router } from "expo-router";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function Header() {
  const today = new Date();

  return (
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-xl font-bold">
          Today, {format(today, "do MMM")}
        </Text>
        <View className="flex-row items-center gap-1">
          <TouchableOpacity
            className="relative p-2"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Themes are coming in a future update!",
              )
            }
          >
            <Ionicons name="color-wand" size={24} color="#6b7280" />
            <View className="absolute bottom-1.5 right-1 bg-bg p-0.5 rounded-full">
              <Ionicons name="lock-closed" size={10} color="#22c55e" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="relative p-2"
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Cloud Sync is coming in a future update!",
              )
            }
          >
            <Ionicons name="cloud-outline" size={24} color="#6b7280" />
            <View className="absolute bottom-1.5 right-1 bg-bg p-0.5 rounded-full">
              <Ionicons name="lock-closed" size={10} color="#22c55e" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
