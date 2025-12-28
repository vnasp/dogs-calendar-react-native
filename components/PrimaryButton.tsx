import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

interface PrimaryButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function PrimaryButton({
  onPress,
  text,
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`py-4 rounded-lg ${
        disabled || loading ? "bg-gray-400" : "bg-purple-600"
      }`}
    >
      {loading ? (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator color="white" />
          <Text className="text-white text-center font-bold text-lg ml-2">
            Guardando...
          </Text>
        </View>
      ) : (
        <Text className="text-white text-center font-bold text-lg">{text}</Text>
      )}
    </TouchableOpacity>
  );
}
