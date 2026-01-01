import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { Pencil } from "lucide-react-native";

interface EditButtonProps {
  onPress: () => void;
}

export default function EditButton({ onPress }: EditButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="border border-[#10B981] p-2 rounded-xl flex-row items-center justify-center"
    >
      <Pencil size={18} color="#10B981" strokeWidth={2} pointerEvents="none" />
    </TouchableOpacity>
  );
}
