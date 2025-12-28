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
      className="border border-purple-500 py-2 px-4 rounded-xl flex-row items-center justify-center"
    >
      <Trash2 size={18} color="#a855f7" strokeWidth={2} />
      <Text className="text-purple-500 font-semibold ml-2">Eliminar</Text>
    </TouchableOpacity>
  );
}
