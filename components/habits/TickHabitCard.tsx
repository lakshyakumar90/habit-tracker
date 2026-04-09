import HabitCard from "@/components/habits/HabitCard";
import { Habit } from "@/types";
import React from "react";

interface TickHabitCardProps {
  habit: Habit;
}

function TickHabitCard({ habit }: TickHabitCardProps) {
  return <HabitCard habit={habit} variant="tick" />;
}

export default React.memo(TickHabitCard);
