import { useHabitStore } from "@/store/useHabitStore";
import { eachDayOfInterval, format, getDay, subMonths } from "date-fns";
import React, { useEffect, useMemo, useRef } from "react";
import { ScrollView, Text, View } from "react-native";

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
  const { logs } = useHabitStore();
  const scrollViewRef = useRef<ScrollView>(null);

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

  const CELL_SIZE = 9;
  const GAP = 2;
  const ROW_LABELS = ["M", "", "W", "", "F", "", "S"];

  return (
    <View className="mt-2">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
        className="outline-none"
      >
        <View className="outline-none border-none">
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
        </View>
      </ScrollView>
    </View>
  );
}
