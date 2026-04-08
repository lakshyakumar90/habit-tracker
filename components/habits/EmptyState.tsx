import { ViewMode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  mode: ViewMode;
}

const EMPTY_CONFIG: Record<
  string,
  { icon: string; title: string; subtitle: string }
> = {
  time: {
    icon: "timer-outline",
    title: "Log Your Hours",
    subtitle:
      "Reading, exercise, meditation — track time spent on what matters.",
  },
  tick: {
    icon: "checkmark-circle-outline",
    title: "Track Your Habits",
    subtitle: "Start building consistency by adding your first habit.",
  },
  weekly: {
    icon: "grid-outline",
    title: "Weekly Overview",
    subtitle: "Add habits to see your weekly progress at a glance.",
  },
};

export default function EmptyState({ mode }: EmptyStateProps) {
  const config = EMPTY_CONFIG[mode] || EMPTY_CONFIG.tick;

  return (
    <View className="flex-1 items-center justify-center px-8 mt-20">
      {/* Icon Container with Glow */}
      <View
        className="w-36 h-36 rounded-[40px] items-center justify-center mb-10 border border-primary relative"
        style={{
          shadowColor: "#22c55e",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 25,
          elevation: 10,
        }}
      >
        {mode === "time" ? (
          <View className="items-center">
            <View className="w-16 h-16 rounded-[22px] bg-[#1a2e22] items-center justify-center">
              <Ionicons name="timer-outline" size={32} color="#4ade80" />
            </View>
            {/* Dots */}
            <View className="flex-row items-center justify-center gap-1.5 mt-4">
              <View className="w-2 h-2 rounded-full bg-[#4ade80]" />
              <View className="w-2 h-2 rounded-full bg-[#18231d] border border-cardBorder" />
              <View className="w-2 h-2 rounded-full bg-[#18231d] border border-cardBorder" />
              <View className="w-2 h-2 rounded-full bg-[#18231d] border border-cardBorder" />
            </View>
            {/* Play border bubble */}
            <View className="absolute -top-6 -right-6 w-9 h-9 rounded-full border border-[#4ade80] bg-[#0a0f0d] items-center justify-center">
              <Ionicons
                name="play"
                size={16}
                color="#4ade80"
                style={{ marginLeft: 2 }}
              />
            </View>
            {/* Plus Bubble */}
            <TouchableOpacity
              onPress={() => router.push("/add-habit")}
              className="absolute -bottom-5 -right-5 w-12 h-12 rounded-full bg-[#4ade80] items-center justify-center"
              style={{
                shadowColor: "#4ade80",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 15,
                elevation: 10,
              }}
            >
              <Ionicons name="add" size={28} color="black" />
            </TouchableOpacity>
            {/* Outer small bubbles */}
            <View className="absolute top-4 -left-4 w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
            <View className="absolute bottom-4 -left-4 w-1.5 h-1.5 rounded-full bg-[#263529]" />
          </View>
        ) : (
          <View className="w-16 h-16 rounded-3xl bg-surface items-center justify-center">
            <Ionicons name={config.icon as any} size={32} color="#22c55e" />
          </View>
        )}
      </View>

      <Text className="text-white text-2xl font-bold mb-3 text-center">
        {config.title}
      </Text>
      <Text className="text-textMuted text-sm text-center mb-10 leading-5">
        {config.subtitle}
      </Text>

      {/* Add Habit Button */}
      <TouchableOpacity
        onPress={() => router.push("/add-habit")}
        activeOpacity={0.8}
        className="w-full rounded-2xl overflow-hidden"
      >
        <LinearGradient
          colors={["#4ade80", "#22c55e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-row items-center justify-center py-4"
          style={{
            shadowColor: "#22c55e",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <Ionicons name="add" size={24} color="black" />
          <Text className="text-black font-bold text-lg ml-2">Add Habit</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
