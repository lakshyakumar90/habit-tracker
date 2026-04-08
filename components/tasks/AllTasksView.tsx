import { taskRepository } from "@/services/taskRepository";
import { useTaskStore } from "@/store/useTaskStore";
import { getTodayString } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import TaskItem from "./TaskItem";

export default function AllTasksView() {
  const {
    tasks,
    taskLists,
    selectedListId,
    setSelectedList,
  } = useTaskStore();
  const [newTaskText, setNewTaskText] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listInputRef = useRef<TextInput>(null);

  const activeList =
    taskLists.find((list) => list.id === selectedListId) || taskLists[0];
  const scopedTasks = tasks.filter((t) => t.listId === activeList?.id);
  const activeTasks = scopedTasks.filter((t) => !t.completed);
  const completedTasks = scopedTasks.filter((t) => t.completed);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    taskRepository.addTask(newTaskText.trim(), getTodayString(), activeList?.id);
    setNewTaskText("");
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    taskRepository.addTaskList(newListName);
    setNewListName("");
    setShowNewListInput(false);
  };

  return (
    <View className="px-4">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Text className="text-primary font-bold text-base border-b-2 border-primary pb-1">
          {activeList?.name || "My Tasks"}
        </Text>
        <TouchableOpacity
          className="ml-3 w-7 h-7 rounded-full bg-surface border border-cardBorder items-center justify-center"
          onPress={() => {
            setShowNewListInput(true);
            setTimeout(() => listInputRef.current?.focus(), 50);
          }}
        >
          <Ionicons name="add" size={16} color="#22c55e" />
        </TouchableOpacity>
      </View>

      {/* Task List Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3"
      >
        <View className="flex-row gap-2">
          {taskLists.map((list) => {
            const isActive = list.id === activeList?.id;
            return (
              <TouchableOpacity
                key={list.id}
                onPress={() => setSelectedList(list.id)}
                className={`px-3 py-2 rounded-xl border ${
                  isActive
                    ? "bg-primary/20 border-primary"
                    : "bg-surface border-cardBorder"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={
                    isActive
                      ? "text-primary font-semibold"
                      : "text-textSecondary"
                  }
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {showNewListInput && (
        <View className="flex-row items-center mb-4 bg-surface border border-primary/40 rounded-xl px-3 py-2">
          <TextInput
            ref={listInputRef}
            value={newListName}
            onChangeText={setNewListName}
            placeholder="Name this task tab"
            placeholderTextColor="#6b7280"
            className="flex-1 text-white"
            onSubmitEditing={handleCreateList}
          />
          <TouchableOpacity
            onPress={handleCreateList}
            className="ml-2"
            hitSlop={10}
          >
            <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowNewListInput(false);
              setNewListName("");
            }}
            className="ml-2"
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

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
          onToggle={() => taskRepository.toggleTask(task.id)}
          onDelete={() => taskRepository.deleteTask(task.id)}
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
            onToggle={() => taskRepository.toggleTask(task.id)}
            onDelete={() => taskRepository.deleteTask(task.id)}
          />
        ))}
    </View>
  );
}
