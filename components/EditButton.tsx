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
      className="border border-purple-500 py-2 px-4 rounded-xl flex-row items-center justify-center"
    >
      <Pencil size={18} color="#a855f7" strokeWidth={2} pointerEvents="none" />
      <Text className="text-purple-500 font-semibold ml-2">Editar</Text>
    </TouchableOpacity>
  );
}
