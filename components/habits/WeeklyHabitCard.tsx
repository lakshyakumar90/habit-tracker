import HabitCard from "@/components/habits/HabitCard";
import { Habit } from "@/types";
import React from "react";

interface WeeklyHabitCardProps {
  habit: Habit;
}

function WeeklyHabitCard({ habit }: WeeklyHabitCardProps) {
  return <HabitCard habit={habit} variant="weekly" />;
}

export default React.memo(WeeklyHabitCard);
