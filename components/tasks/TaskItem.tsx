import { getAppTheme } from "@/constants/appThemes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Task } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const theme = useSettingsStore((state) => state.theme);
  const appTheme = getAppTheme(theme);

  return (
    <View className="flex-row items-center py-3 px-4">
      <TouchableOpacity
        onPress={onToggle}
        className="w-6 h-6 rounded-full border-2 items-center justify-center mr-3"
        style={{
          backgroundColor: task.completed ? appTheme.primary : "transparent",
          borderColor: task.completed ? appTheme.primary : appTheme.textMuted,
        }}
        activeOpacity={0.7}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={14} color={appTheme.textPrimary} />
        )}
      </TouchableOpacity>

      <Text
        className={`flex-1 text-base ${task.completed ? "line-through" : ""}`}
        style={{
          color: task.completed ? appTheme.textMuted : appTheme.textPrimary,
        }}
      >
        {task.title}
      </Text>

      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={18} color={appTheme.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
