import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import { eachDayOfInterval, format, getDay, subMonths, startOfMonth, endOfMonth, isSameMonth, addMonths, isSameDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HabitGridProps {
  habitId: string;
  color: string;
  months?: number;
}

export default function HabitGrid({
  habitId,
  color,
  months = 5,
}: HabitGridProps) {
  const { logs, habits } = useHabitStore();
  const habit = habits.find((h) => h.id === habitId);
  const scrollViewRef = useRef<ScrollView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    // Scroll to the end to show the current month by default
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const { rows, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = subMonths(today, months - 1);
    start.setDate(1);

    const allDays = eachDayOfInterval({ start, end: today });

    // Build data: 7 rows (Mon=0 ... Sun=6), each row is array of cells
    const rowsMap: { dateStr: string; completed: boolean }[][] = Array.from(
      { length: 7 },
      () => [],
    );

    const labels: { label: string; index: number }[] = [];
    let lastMonth = "";
    let weekIndex = 0;
    let prevDow = -1;

    allDays.forEach((day) => {
      const dow = getDay(day); // 0=Sun
      const row = dow === 0 ? 6 : dow - 1; // Mon=0, Sun=6

      // Track week changes for column alignment
      if (dow === 1 || (prevDow > dow && prevDow !== -1)) {
        weekIndex++;
      }
      prevDow = dow;

      const monthStr = format(day, "MMM ''yy");
      if (monthStr !== lastMonth) {
        labels.push({ label: monthStr, index: weekIndex });
        lastMonth = monthStr;
      }

      const dateStr = format(day, "yyyy-MM-dd");
      const key = `${habitId}_${dateStr}`;
      const completed = (logs[key] || 0) > 0;

      // Pad rows to align columns
      while (rowsMap[row].length < weekIndex) {
        rowsMap[row].push({ dateStr: "", completed: false });
      }

      rowsMap[row].push({ dateStr, completed });
    });

    return { rows: rowsMap, monthLabels: labels };
  }, [habitId, logs, months]);

  const handleCellPress = (dateStr: string, completed: boolean) => {
    if (!dateStr) return;
    if (!completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    habitRepository.toggleHabit(habitId, dateStr);
  };

  const renderModalCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const dateFormat = "yyyy-MM-dd";
    const rows: Date[][] = [];

    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      rows.push(days);
      days = [];
    }

    return (
      <View className="bg-card rounded-3xl m-4 border border-cardBorder overflow-hidden">
        <View className="flex-row items-center justify-between p-5 border-b border-cardBorder">
          <Text className="text-white font-bold text-lg">{habit?.name}</Text>
          <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={10}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="p-5">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} hitSlop={10}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg">{format(currentMonth, "MMMM yyyy")}</Text>
            <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} hitSlop={10}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <Text key={i} className="flex-1 text-center text-textMuted text-xs font-semibold">{d}</Text>
            ))}
          </View>

          {rows.map((row, i) => (
            <View key={i} className="flex-row mb-3">
              {row.map((d, j) => {
                const dateStr = format(d, dateFormat);
                const isCompleted = (logs[`${habitId}_${dateStr}`] || 0) > 0;
                const isCurrentMonth = isSameMonth(d, monthStart);
                const isFuture = d > new Date();

                return (
                  <TouchableOpacity
                    key={j}
                    className={`flex-1 h-12 mx-1 rounded-xl items-center justify-center border border-cardBorder ${isCompleted ? '' : 'bg-surface'}`}
                    style={[
                      isCompleted ? { backgroundColor: color, borderColor: color } : {},
                      !isCurrentMonth ? { opacity: 0.3 } : {}
                    ]}
                    disabled={!isCurrentMonth || isFuture}
                    onPress={() => handleCellPress(dateStr, isCompleted)}
                  >
                    <Text className={`font-semibold ${isCompleted ? 'text-black' : 'text-textMuted'}`}>
                      {format(d, "d")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const CELL_SIZE = 9;
  const GAP = 2;
  const ROW_LABELS = ["M", "", "W", "", "F", "", "S"];

  return (
    <View className="mt-2">
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/70 justify-center">
          {renderModalCalendar()}
        </View>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        className="outline-none"
      >
        <Pressable className="outline-none border-none" onPress={() => { setModalVisible(true); setCurrentMonth(new Date()); }}>
          {/* Month labels */}
          <View className="flex-row mb-1 ml-3" style={{ height: 14 }}>
            {monthLabels.map((ml, i) => (
              <Text
                key={i}
                className="text-textMuted"
                style={{
                  fontSize: 8,
                  position: "absolute",
                  left: ml.index * (CELL_SIZE + GAP) + 12,
                }}
              >
                {ml.label}
              </Text>
            ))}
          </View>

          {/* Grid Rows */}
          {rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              className="flex-row items-center border-none outline-none"
            >
              <Text
                className="text-textMuted mr-1"
                style={{ fontSize: 7, width: 10, textAlign: "center" }}
              >
                {ROW_LABELS[rowIndex]}
              </Text>
              {row.map((cell, colIndex) => (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    margin: GAP / 2,
                    borderRadius: 2,
                    backgroundColor: cell.dateStr
                      ? cell.completed
                        ? color
                        : "#1a2420"
                      : "transparent",
                    opacity: cell.completed ? 1 : cell.dateStr ? 0.4 : 0,
                  }}
                  className="outline-none border-none border-transparent"
                />
              ))}
            </View>
          ))}
        </Pressable>
      </ScrollView>
    </View>
  );
}
