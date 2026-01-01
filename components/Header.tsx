import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { ChevronLeft } from "lucide-react-native";

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  rightButton?: React.ReactNode;
  subtitle?: string;
  leftButton?: React.ReactNode; // Para Logo u otros elementos a la izquierda
}

export default function Header({
  title,
  onBack,
  rightButton,
  subtitle,
  leftButton,
}: HeaderProps) {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      <View className="bg-[#10B981] pt-6 pb-6 px-6">
        {/* Patrón con leftButton (Logo) y rightButton */}
        {leftButton && !onBack && (
          <View className="flex-row items-center justify-between mb-3">
            {leftButton}
            {rightButton}
          </View>
        )}

        {/* Patrón con onBack button */}
        {onBack && (
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={onBack}
              className="mr-3 p-2 -ml-2"
              activeOpacity={0.7}
            >
              <ChevronLeft
                size={32}
                color="white"
                strokeWidth={2.5}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {title && (
              <Text className="text-white text-2xl font-bold flex-1">
                {title}
              </Text>
            )}
            {rightButton}
          </View>
        )}

        {/* Título o subtítulo standalone */}
        {title && !onBack && !leftButton && (
          <Text className="text-white text-2xl font-bold">{title}</Text>
        )}
        {subtitle && (
          <Text className="text-white text-xl font-bold">{subtitle}</Text>
        )}
      </View>
    </>
  );
}
