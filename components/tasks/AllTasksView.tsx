import { getAppTheme } from "@/constants/appThemes";
import { taskRepository } from "@/services/taskRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
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
  const { tasks, taskLists, selectedListId, setSelectedList } = useTaskStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
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
    taskRepository.addTask(
      newTaskText.trim(),
      getTodayString(),
      activeList?.id,
    );
    setNewTaskText("");
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    taskRepository.addTaskList(newListName);
    setNewListName("");
    setShowNewListInput(false);
  };

  const openInlineListInput = () => {
    setShowNewListInput(true);
    setTimeout(() => listInputRef.current?.focus(), 50);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Task List Tabs + Inline Add */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <View className="flex-row items-center gap-2 pr-2">
          {taskLists.map((list) => {
            const isActive = list.id === activeList?.id;
            return (
              <TouchableOpacity
                key={list.id}
                onPress={() => setSelectedList(list.id)}
                className="px-3 py-2 rounded-xl border"
                style={{
                  backgroundColor: isActive
                    ? `${appTheme.primary}33`
                    : appTheme.surface,
                  borderColor: isActive
                    ? appTheme.primary
                    : appTheme.cardBorder,
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={isActive ? "font-semibold" : ""}
                  style={{
                    color: isActive ? appTheme.primary : appTheme.textSecondary,
                  }}
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {showNewListInput ? (
            <View
              className="flex-row items-center border rounded-xl px-3 py-2 min-w-[170px]"
              style={{
                backgroundColor: appTheme.surface,
                borderColor: `${appTheme.primary}66`,
              }}
            >
              <TextInput
                ref={listInputRef}
                value={newListName}
                onChangeText={setNewListName}
                placeholder="New tab"
                placeholderTextColor={appTheme.textMuted}
                className="flex-1"
                style={{ color: appTheme.textPrimary }}
                onSubmitEditing={handleCreateList}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleCreateList}
                className="ml-2"
                hitSlop={10}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={appTheme.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowNewListInput(false);
                  setNewListName("");
                }}
                className="ml-1"
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={appTheme.textMuted}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="w-8 h-8 rounded-full border items-center justify-center"
              style={{
                backgroundColor: appTheme.surface,
                borderColor: appTheme.cardBorder,
              }}
              onPress={openInlineListInput}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={appTheme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

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
          className="w-7 h-7 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: `${appTheme.primary}33` }}
        >
          <Ionicons name="add" size={16} color={appTheme.primary} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={newTaskText}
          onChangeText={setNewTaskText}
          placeholder="Add a new task..."
          placeholderTextColor={appTheme.textMuted}
          className="flex-1 text-base"
          style={{ color: appTheme.textPrimary }}
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
            color={appTheme.textMuted}
          />
          <Text
            className="font-medium ml-2"
            style={{ color: appTheme.textMuted }}
          >
            Completed{" "}
            <Text style={{ color: `${appTheme.textMuted}99` }}>
              {completedTasks.length}
            </Text>
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
    </ScrollView>
  );
}
