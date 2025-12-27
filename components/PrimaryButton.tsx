import React from "react";
import { TouchableOpacity, Text } from "react-native";

interface PrimaryButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
}

export default function PrimaryButton({
  onPress,
  text,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`py-4 rounded-lg ${
        disabled ? "bg-gray-400" : "bg-purple-600"
      }`}
    >
      <Text className="text-white text-center font-bold text-lg">{text}</Text>
    </TouchableOpacity>
  );
}
