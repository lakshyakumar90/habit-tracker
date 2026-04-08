import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Task } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <View className="flex-row items-center py-3 px-4">
      <TouchableOpacity
        onPress={onToggle}
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
          task.completed ? "bg-primary border-primary" : "border-textMuted"
        }`}
        activeOpacity={0.7}
      >
        {task.completed && (
          <Ionicons name="checkmark" size={14} color="white" />
        )}
      </TouchableOpacity>

      <Text
        className={`flex-1 text-base ${
          task.completed
            ? "text-textMuted line-through"
            : "text-white"
        }`}
      >
        {task.title}
      </Text>

      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Ionicons name="close" size={18} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}