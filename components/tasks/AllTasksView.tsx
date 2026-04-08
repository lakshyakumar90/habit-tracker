import { useTaskStore } from "@/store/useTaskStore";
import { getTodayString } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import TaskItem from "./TaskItem";

export default function AllTasksView() {
  const { tasks, addTask, toggleTask, deleteTask } = useTaskStore();
  const [newTaskText, setNewTaskText] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const activeTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText.trim(), getTodayString());
    setNewTaskText("");
  };

  return (
    <View className="px-4">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Text className="text-primary font-bold text-base border-b-2 border-primary pb-1">
          My Tasks
        </Text>
        <TouchableOpacity
          className="ml-3 w-7 h-7 rounded-full bg-surface border border-cardBorder items-center justify-center"
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="add" size={16} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Add Task Input */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity
          onPress={() => {
            if (newTaskText.trim()) {
              handleAddTask();
            } else {
              inputRef.current?.focus();
            }
          }}
          className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center mr-2"
        >
          <Ionicons name="add" size={16} color="#22c55e" />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={newTaskText}
          onChangeText={setNewTaskText}
          placeholder="Add a new task..."
          placeholderTextColor="#6b7280"
          className="flex-1 text-white text-base"
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
      </View>

      {/* Active Tasks */}
      {activeTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => toggleTask(task.id)}
          onDelete={() => deleteTask(task.id)}
        />
      ))}

      {/* Completed Section */}
      {completedTasks.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowCompleted(!showCompleted)}
          className="flex-row items-center py-3 mt-2"
          activeOpacity={0.7}
        >
          <Ionicons
            name={showCompleted ? "chevron-down" : "chevron-forward"}
            size={16}
            color="#6b7280"
          />
          <Text className="text-textMuted font-medium ml-2">
            Completed{" "}
            <Text className="text-textMuted/60">{completedTasks.length}</Text>
          </Text>
        </TouchableOpacity>
      )}

      {showCompleted &&
        completedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={() => toggleTask(task.id)}
            onDelete={() => deleteTask(task.id)}
          />
        ))}
    </View>
  );
}
