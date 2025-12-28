import React, { useRef } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from "react-native";

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete: () => void;
  isCompleted?: boolean;
  completedBy?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = -80;

export default function SwipeableCard({
  children,
  onComplete,
  isCompleted = false,
  completedBy,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Solo activar si desliza horizontalmente
        return Math.abs(gesture.dx) > 10;
      },
      onPanResponderMove: (_, gesture) => {
        // Solo permitir deslizar hacia la izquierda
        if (gesture.dx < 0) {
          pan.setValue(gesture.dx);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < SWIPE_THRESHOLD) {
          // Mantener abierto
          Animated.spring(pan, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: false,
          }).start();
        } else {
          // Volver a cerrar
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleComplete = () => {
    onComplete();
    // Cerrar el swipe después de completar
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: false,
    }).start();
  };

  if (isCompleted) {
    return (
      <View className="relative">
        <View className="bg-white rounded-2xl p-4 shadow-sm border-2 border-green-300">
          {children}
          <View className="absolute top-2 right-2 bg-green-500 rounded-full px-3 py-1 flex-row items-center">
            <Text className="text-white text-xs font-bold mr-1">✓</Text>
            <Text className="text-white text-xs font-semibold">
              {completedBy || "Completado"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="relative">
      {/* Botón de completar detrás */}
      <View className="absolute right-0 top-0 bottom-0 bg-green-500 rounded-2xl flex-row items-center justify-end px-6">
        <TouchableOpacity
          onPress={handleComplete}
          className="flex-row items-center"
        >
          <Text className="text-white text-2xl mr-2">✓</Text>
          <Text className="text-white font-bold">Listo</Text>
        </TouchableOpacity>
      </View>

      {/* Card deslizable */}
      <Animated.View
        {...panResponder.panHandlers}
        style={{
          transform: [{ translateX: pan }],
        }}
      >
        <View className="bg-white rounded-2xl p-4 shadow-sm">{children}</View>
      </Animated.View>
    </View>
  );
}
