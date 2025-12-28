import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Square } from "lucide-react-native";

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete: () => void | Promise<void>;
  isCompleted?: boolean;
  completedBy?: string;
}

export default function SwipeableCard({
  children,
  onComplete,
  isCompleted = false,
  completedBy,
}: SwipeableCardProps) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    try {
      setLoading(true);
      await onComplete();
    } catch (error) {
      console.error("Error completing:", error);
    } finally {
      setLoading(false);
    }
  };

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
          onPress={handleComplete}
          disabled={loading}
          className={`absolute top-2 right-2 w-10 h-10 rounded-lg items-center justify-center ${
            loading ? "bg-gray-200" : "bg-gray-100 active:bg-gray-200"
          }`}
          activeOpacity={0.8}
          style={{ zIndex: 10 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Square
              size={24}
              color="#6b7280"
              strokeWidth={2}
              pointerEvents="none"
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
