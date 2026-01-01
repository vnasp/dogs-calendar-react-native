import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

interface PrimaryButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
}

export default function PrimaryButton({
  onPress,
  text,
  disabled = false,
  loading = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const getButtonStyles = () => {
    if (disabled || loading) {
      return "bg-gray-400 border-gray-400";
    }

    switch (variant) {
      case "primary":
        return "bg-[#10B981] border-[#10B981]";
      case "secondary":
        return "bg-[#49D3CC] border-[#49D3CC]";
      case "outline":
        return "bg-white border-2 border-[#10B981]";
      case "danger":
        return "bg-red-500 border-red-500";
      default:
        return "bg-[#10B981] border-[#10B981]";
    }
  };

  const getTextStyles = () => {
    if (disabled || loading) {
      return "text-white";
    }

    return variant === "outline" ? "text-[#10B981]" : "text-white";
  };

  const getLoadingColor = () => {
    return variant === "outline" ? "#10B981" : "white";
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-1 py-4 rounded-lg ${getButtonStyles()}`}
    >
      {loading ? (
        <View className="flex-row items-center justify-center">
          <ActivityIndicator color={getLoadingColor()} />
          <Text
            className={`text-center font-bold text-lg ml-2 ${getTextStyles()}`}
          >
            Guardando...
          </Text>
        </View>
      ) : (
        <Text className={`text-center font-bold text-lg ${getTextStyles()}`}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}
