import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Square } from "lucide-react-native";

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete: () => void;
  isCompleted?: boolean;
  completedBy?: string;
}

export default function SwipeableCard({
  children,
  onComplete,
  isCompleted = false,
  completedBy,
}: SwipeableCardProps) {
  if (isCompleted) {
    return (
      <View className="relative">
        <View className="bg-white rounded-2xl p-4 shadow-sm border-2 border-green-300">
          {children}
          <View className="absolute top-2 right-2 bg-green-500 rounded-full px-3 py-1 flex-row items-center">
            <Check
              size={14}
              color="white"
              strokeWidth={3}
              pointerEvents="none"
            />
            <Text className="text-white text-xs font-semibold ml-1">
              {completedBy || "Completado"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="relative">
      <View
        className="bg-white rounded-2xl p-4 shadow-sm"
        pointerEvents="box-none"
      >
        <View pointerEvents="auto">{children}</View>
        {/* Botón de completar en la esquina superior derecha */}
        <TouchableOpacity
          onPress={onComplete}
          className="absolute top-2 right-2 w-10 h-10 bg-gray-100 rounded-lg items-center justify-center active:bg-gray-200"
          activeOpacity={0.8}
          style={{ zIndex: 10 }}
        >
          <Square
            size={24}
            color="#6b7280"
            strokeWidth={2}
            pointerEvents="none"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
