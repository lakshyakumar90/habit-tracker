import { habitRepository } from "@/services/habitRepository";
import { useHabitStore } from "@/store/useHabitStore";
import {
  getReadableTextColor,
  lightenHexColor,
  mixHexColors,
} from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import {
  addDays,
  addMonths,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface HabitGridProps {
  habitId: string;
  color: string;
  months?: number;
  monthModalBgColor?: string;
}

export default function HabitGrid({
  habitId,
  color,
  months = 12,
  monthModalBgColor,
}: HabitGridProps) {
  const { logs, habits } = useHabitStore();
  const habit = habits.find((h) => h.id === habitId);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const heatmapBg = mixHexColors(color, "#121823", 0.84);
  const heatmapBorder = mixHexColors(color, "#273447", 0.72);
  const heatmapEmpty = mixHexColors(color, "#1b2534", 0.8);
  const labelColor = lightenHexColor(color, 0.44);
  const modalBg = monthModalBgColor ?? mixHexColors(color, "#121a25", 0.8);
  const modalUiColor = lightenHexColor(color, 0.32);
  const modalSubtleBorder = mixHexColors(color, "#2b3b52", 0.7);
  const modalDayIdleBg = mixHexColors(color, "#182333", 0.78);
  const modalDayTextColor = lightenHexColor(color, 0.44);
  const completedDayTextColor = getReadableTextColor(color);

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
    const gridStart = startOfWeek(start, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({ start, end: today });

    // Build data: 7 rows (Mon=0 ... Sun=6), each row is array of cells
    const rowsMap: { dateStr: string; completed: boolean }[][] = Array.from(
      { length: 7 },
      () => [],
    );

    const labels: { label: string; index: number }[] = [];
    let lastMonth = "";

    allDays.forEach((day) => {
      const weekIndex = differenceInCalendarWeeks(day, gridStart, {
        weekStartsOn: 1,
      });
      const dow = getDay(day); // 0=Sun
      const row = dow === 0 ? 6 : dow - 1; // Mon=0, Sun=6

      const monthStr = format(day, "MMM ''yy");
      if (monthStr !== lastMonth) {
        labels.push({ label: monthStr, index: weekIndex });
        lastMonth = monthStr;
      }

      const dateStr = format(day, "yyyy-MM-dd");
      const key = `${habitId}_${dateStr}`;
      const completed = (logs[key] || 0) > 0;

      while (rowsMap[row].length <= weekIndex) {
        rowsMap[row].push({ dateStr: "", completed: false });
      }
      rowsMap[row][weekIndex] = { dateStr, completed };
    });

    const maxColumns = rowsMap.reduce(
      (max, row) => Math.max(max, row.length),
      0,
    );

    rowsMap.forEach((row) => {
      while (row.length < maxColumns) {
        row.push({ dateStr: "", completed: false });
      }

      for (let column = 0; column < row.length; column++) {
        if (!row[column]) {
          row[column] = { dateStr: "", completed: false };
        }
      }
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
      <View className="overflow-hidden pb-8">
        <View className="items-center py-3">
          <View
            className="w-12 h-1.5 rounded-full"
            style={{ backgroundColor: modalUiColor }}
          />
        </View>

        <View
          className="flex-row items-center justify-between px-5 pb-4 border-b"
          style={{ borderBottomColor: modalSubtleBorder }}
        >
          <Text className="font-bold text-lg" style={{ color: modalUiColor }}>
            {habit?.name}
          </Text>
          <TouchableOpacity onPress={() => setShowCalendar(false)} hitSlop={10}>
            <Ionicons name="close" size={24} color={modalUiColor} />
          </TouchableOpacity>
        </View>

        <View className="p-5">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={24} color={modalUiColor} />
            </TouchableOpacity>
            <Text className="font-bold text-lg" style={{ color: modalUiColor }}>
              {format(currentMonth, "MMMM yyyy")}
            </Text>
            <TouchableOpacity
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              hitSlop={10}
            >
              <Ionicons name="chevron-forward" size={24} color={modalUiColor} />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <Text
                key={i}
                className="flex-1 text-center text-xs font-semibold"
                style={{ color: labelColor }}
              >
                {d}
              </Text>
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
                    className="flex-1 h-12 mx-1 rounded-xl items-center justify-center border"
                    style={[
                      isCompleted
                        ? { backgroundColor: color, borderColor: color }
                        : {
                            backgroundColor: modalDayIdleBg,
                            borderColor: modalSubtleBorder,
                          },
                      !isCurrentMonth
                        ? {
                            backgroundColor: heatmapBg,
                            borderColor: heatmapBorder,
                          }
                        : {},
                    ]}
                    disabled={!isCurrentMonth || isFuture}
                    onPress={() => handleCellPress(dateStr, isCompleted)}
                  >
                    <Text
                      className="font-semibold"
                      style={{
                        color: isCompleted
                          ? completedDayTextColor
                          : isCurrentMonth
                            ? modalDayTextColor
                            : labelColor,
                      }}
                    >
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

  const CELL_SIZE = 12;
  const CELL_GAP = 3;
  const ROW_LABEL_WIDTH = 12;
  const ROW_LABEL_GAP = 3;
  const GRID_LABEL_OFFSET = ROW_LABEL_WIDTH + ROW_LABEL_GAP;
  const ROW_LABELS = ["M", "", "W", "", "F", "", "S"];
  const columnCount = rows[0]?.length ?? 0;
  const intrinsicGridWidth =
    GRID_LABEL_OFFSET +
    columnCount * CELL_SIZE +
    Math.max(0, columnCount - 1) * CELL_GAP;
  const minGridWidth = Math.max(0, containerWidth - 8);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    const width = Math.floor(event.nativeEvent.layout.width);
    if (width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View className="mt-2" onLayout={handleContainerLayout}>
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableWithoutFeedback>
              <View
                className="rounded-t-3xl"
                style={{
                  backgroundColor: modalBg,
                  maxHeight: "90%",
                }}
              >
                {renderModalCalendar()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 4 }}
        className="outline-none"
      >
        <Pressable
          className="outline-none border-none"
          style={{ width: intrinsicGridWidth, minWidth: minGridWidth }}
          onPress={() => {
            setCurrentMonth(new Date());
            setShowCalendar(true);
          }}
        >
          {/* Month labels */}
          <View className="flex-row mb-2 ml-3" style={{ height: 18 }}>
            {monthLabels.map((ml, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 9,
                  position: "absolute",
                  color: labelColor,
                  left: ml.index * (CELL_SIZE + CELL_GAP) + GRID_LABEL_OFFSET,
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
                style={{
                  fontSize: 8,
                  width: ROW_LABEL_WIDTH,
                  marginRight: ROW_LABEL_GAP,
                  textAlign: "center",
                  color: labelColor,
                }}
              >
                {ROW_LABELS[rowIndex]}
              </Text>
              {row.map((cell, colIndex) => (
                <View
                  key={`${rowIndex}-${colIndex}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    marginRight: CELL_GAP,
                    marginBottom: CELL_GAP,
                    borderRadius: 3,
                    backgroundColor: cell.dateStr
                      ? cell.completed
                        ? color
                        : heatmapEmpty
                      : "transparent",
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
