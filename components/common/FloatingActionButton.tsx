import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

interface FABProps {
  onPress: () => void;
}

export default function FloatingActionButton({ onPress }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-[28px] right-4 bg-[#4ade80] w-[52px] h-[52px] items-center justify-center rounded-[20px]"
      activeOpacity={0.8}
      style={{
        shadowColor: "#4ade80",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        elevation: 10,
      }}
    >
      <Ionicons name="add" size={28} color="black" />
    </TouchableOpacity>
  );
}
