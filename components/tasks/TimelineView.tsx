import { getAppTheme } from "@/constants/appThemes";
import { taskRepository } from "@/services/taskRepository";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTaskStore } from "@/store/useTaskStore";
import { formatDate } from "@/utils/dates";
import { Ionicons } from "@expo/vector-icons";
import { addDays, format, isToday, startOfDay } from "date-fns";
import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import TaskItem from "./TaskItem";

export default function TimelineView() {
  const { tasks, selectedListId } = useTaskStore();
  const settings = useSettingsStore();
  const appTheme = getAppTheme(settings.theme);
  const listRef = useRef<FlatList<any>>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(
    formatDate(new Date()),
  );
  const [showCompletedByDate, setShowCompletedByDate] = useState<
    Record<string, boolean>
  >({});
  const [newTaskText, setNewTaskText] = useState("");

  // Future dates first (1 year), then today, then 7 past days.
  const dates = useMemo(() => {
    const today = startOfDay(new Date());
    const totalDays = 365 + 7 + 1;

    return Array.from({ length: totalDays }, (_, i) => {
      const date = addDays(today, 365 - i);
      return {
        date,
        dateStr: formatDate(date),
        display: format(date, "MMM d, yyyy"),
        dayName: format(date, "EEE"),
        isToday: isToday(date),
      };
    });
  }, []);

  const todayIndex = 365;

  const handleAddTask = (dateStr: string) => {
    if (!newTaskText.trim()) return;
    taskRepository.addTask(newTaskText.trim(), dateStr, selectedListId);
    setNewTaskText("");
  };

  return (
    <FlatList
      ref={listRef}
      data={dates}
      initialScrollIndex={todayIndex}
      keyExtractor={(d) => d.dateStr}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
      getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
      renderItem={({ item: d }) => {
        const dateTasks = tasks.filter(
          (t) => t.date === d.dateStr && t.listId === selectedListId,
        );
        const isExpanded = expandedDate === d.dateStr;
        const activeTasks = dateTasks.filter((t) => !t.completed);
        const completedTasks = dateTasks.filter((t) => t.completed);
        const hasActiveTasks = activeTasks.length > 0;
        const showCompleted = showCompletedByDate[d.dateStr] ?? false;

        return (
          <View key={d.dateStr} className="mb-1">
            <TouchableOpacity
              onPress={() => setExpandedDate(isExpanded ? null : d.dateStr)}
              className="flex-row items-center py-3"
              activeOpacity={0.7}
            >
              {/* Dot */}
              <View
                className="w-3 h-3 rounded-full mr-3 border"
                style={{
                  backgroundColor: d.isToday
                    ? appTheme.primary
                    : hasActiveTasks
                      ? appTheme.textMuted
                      : appTheme.surface,
                  borderColor:
                    d.isToday || hasActiveTasks
                      ? "transparent"
                      : appTheme.cardBorder,
                }}
              />

              {/* Date */}
              <Text
                className="font-semibold flex-1"
                style={{
                  color: d.isToday ? appTheme.textPrimary : appTheme.textMuted,
                }}
              >
                {d.display}{" "}
                <Text style={{ color: appTheme.textMuted, fontWeight: "400" }}>
                  {d.dayName}
                </Text>
              </Text>

              {dateTasks.length > 0 && (
                <Text
                  className="text-xs mr-3"
                  style={{
                    color: hasActiveTasks
                      ? appTheme.textMuted
                      : appTheme.primary,
                  }}
                >
                  {completedTasks.length}/{dateTasks.length}
                </Text>
              )}

              {/* Expand / Add */}
              {isExpanded ? (
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={appTheme.textMuted}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setExpandedDate(d.dateStr)}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={20} color={appTheme.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <View className="ml-6 mb-3">
                {!hasActiveTasks && completedTasks.length > 0 && (
                  <View
                    className="rounded-2xl border px-4 py-3 mb-2"
                    style={{
                      backgroundColor: `${appTheme.primary}1A`,
                      borderColor: `${appTheme.primary}4D`,
                    }}
                  >
                    <Text
                      style={{ color: appTheme.primary, fontWeight: "700" }}
                    >
                      All done! {completedTasks.length} task
                      {completedTasks.length > 1 ? "s" : ""} completed
                    </Text>
                  </View>
                )}

                {/* Active Tasks */}
                {activeTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => taskRepository.toggleTask(task.id)}
                    onDelete={() => taskRepository.deleteTask(task.id)}
                  />
                ))}

                {/* Completed Tasks Section */}
                {completedTasks.length > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setShowCompletedByDate((prev) => ({
                        ...prev,
                        [d.dateStr]: !showCompleted,
                      }))
                    }
                    className="flex-row items-center py-2"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showCompleted ? "chevron-down" : "chevron-forward"}
                      size={15}
                      color={appTheme.textMuted}
                    />
                    <Text
                      className="ml-2 text-sm"
                      style={{ color: appTheme.textMuted }}
                    >
                      Completed {completedTasks.length}
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

                {/* Add Task Input */}
                <View
                  className="flex-row items-center rounded-xl border px-3 py-2 mt-1"
                  style={{
                    backgroundColor: appTheme.surface,
                    borderColor: `${appTheme.primary}4D`,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleAddTask(d.dateStr)}
                    className="w-7 h-7 rounded-full items-center justify-center mr-2"
                    style={{ backgroundColor: `${appTheme.primary}33` }}
                  >
                    <Ionicons name="add" size={16} color={appTheme.primary} />
                  </TouchableOpacity>
                  <TextInput
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    placeholder="Add a task..."
                    placeholderTextColor={appTheme.textMuted}
                    className="flex-1 text-base"
                    style={{ color: appTheme.textPrimary }}
                    onSubmitEditing={() => handleAddTask(d.dateStr)}
                    returnKeyType="done"
                  />
                </View>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}
