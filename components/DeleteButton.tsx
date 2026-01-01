import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { Trash2 } from "lucide-react-native";

interface DeleteButtonProps {
  onPress: () => void;
}

export default function DeleteButton({ onPress }: DeleteButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="border border-red-500 p-2 rounded-xl flex-row items-center justify-center"
    >
      <Trash2 size={18} color="#ef4444" strokeWidth={2} pointerEvents="none" />
    </TouchableOpacity>
  );
}
