import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface HeaderAddButtonProps {
  onPress: () => void;
}

export default function HeaderAddButton({ onPress }: HeaderAddButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white px-4 py-2 rounded-lg"
    >
      <Text className="text-cyan-600 font-semibold">+ Agregar</Text>
    </TouchableOpacity>
  );
}
