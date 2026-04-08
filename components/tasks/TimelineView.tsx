import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { subDays, format, isToday } from "date-fns";
import { formatDate } from "@/utils/dates";
import { useTaskStore } from "@/store/useTaskStore";
import TaskItem from "./TaskItem";

export default function TimelineView() {
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState("");

  // Generate last 14 days
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(today, -7 + i); // 7 days in future, today, 6 days past
      return {
        date,
        dateStr: formatDate(date),
        display: format(date, "MMM d"),
        dayName: format(date, "EEE"),
        isToday: isToday(date),
      };
    }).reverse();
  }, []);

  const handleAddTask = (dateStr: string) => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), dateStr);
    setNewTaskText("");
  };

  return (
    <View className="px-4">
      {dates.map((d) => {
        const dateTasks = tasks.filter((t) => t.date === d.dateStr);
        const isExpanded = expandedDate === d.dateStr;
        const hasActiveTasks = dateTasks.some((t) => !t.completed);

        return (
          <View key={d.dateStr} className="mb-1">
            <TouchableOpacity
              onPress={() =>
                setExpandedDate(isExpanded ? null : d.dateStr)
              }
              className="flex-row items-center py-3"
              activeOpacity={0.7}
            >
              {/* Dot */}
              <View
                className={`w-3 h-3 rounded-full mr-3 ${
                  d.isToday
                    ? "bg-primary"
                    : hasActiveTasks
                    ? "bg-textMuted"
                    : "bg-surface border border-cardBorder"
                }`}
              />

              {/* Date */}
              <Text
                className={`font-semibold flex-1 ${
                  d.isToday ? "text-white" : "text-textMuted"
                }`}
              >
                {d.display}{" "}
                <Text className="text-textMuted font-normal">
                  {d.dayName}
                </Text>
              </Text>

              {/* Expand / Add */}
              {isExpanded ? (
                <Ionicons name="chevron-down" size={18} color="#6b7280" />
              ) : (
                <TouchableOpacity
                  onPress={() => setExpandedDate(d.dateStr)}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <View className="ml-6 mb-3">
                {/* Existing Tasks */}
                {dateTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}

                {/* Add Task Input */}
                <View className="flex-row items-center bg-surface rounded-xl border border-primary/30 px-3 py-2 mt-1">
                  <TouchableOpacity
                    onPress={() => handleAddTask(d.dateStr)}
                    className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center mr-2"
                  >
                    <Ionicons name="add" size={16} color="#22c55e" />
                  </TouchableOpacity>
                  <TextInput
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    placeholder="Add a task..."
                    placeholderTextColor="#6b7280"
                    className="flex-1 text-white text-base"
                    onSubmitEditing={() => handleAddTask(d.dateStr)}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}