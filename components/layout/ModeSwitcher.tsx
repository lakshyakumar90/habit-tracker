import { useHabitStore } from "@/store/useHabitStore";
import { ViewMode } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const MODES: { key: ViewMode; icon: string; label: string }[] = [
  { key: "time", icon: "timer-outline", label: "Time" },
  { key: "tick", icon: "checkmark-circle-outline", label: "Tick" },
  { key: "weekly", icon: "grid-outline", label: "Weekly" },
  { key: "tasks", icon: "checkmark-done-outline", label: "Tasks" },
];

export default function ModeSwitcher() {
  const { viewMode, setViewMode } = useHabitStore();

  return (
    <View className="absolute bottom-6 left-4">
      <View
        className="flex-row items-center bg-[#18231d] rounded-[30px] p-2 border border-primary/40 shadow-xl"
        style={{
          shadowColor: "#22c55e",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {MODES.map((mode, index) => {
          const isActive = viewMode === mode.key;
          return (
            <React.Fragment key={mode.key}>
              {index === 3 && <View className="w-px h-6 bg-cardBorder mx-1" />}
              <TouchableOpacity
                onPress={() => setViewMode(mode.key)}
                className={`flex-row items-center justify-center px-4 py-3 min-h-[44px] ${
                  isActive ? "bg-[#4ade80] rounded-full" : "rounded-full"
                }`}
                activeOpacity={0.7}
                style={
                  isActive
                    ? {
                        shadowColor: "#4ade80",
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 5,
                      }
                    : {}
                }
              >
                <Ionicons
                  name={mode.icon as any}
                  size={20}
                  color={isActive ? "black" : "#9ca3af"}
                />
                {isActive && (
                  <Text className="text-black font-bold text-[13px] ml-2">
                    {mode.label}
                  </Text>
                )}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
