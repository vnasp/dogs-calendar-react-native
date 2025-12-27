import React from "react";
import { View, Text, ActivityIndicator } from "react-native";

export default function LoadingScreen() {
  return (
    <View className="flex-1 bg-blue-50 items-center justify-center px-6">
      {/* Icono principal */}
      <View className="mb-8">
        <View className="w-32 h-32 bg-blue-500 rounded-full items-center justify-center">
          <Text className="text-6xl">🐕</Text>
        </View>
      </View>

      {/* Título */}
      <Text className="text-3xl font-bold text-blue-900 mb-2">Dogs Health</Text>

      {/* Subtítulo */}
      <Text className="text-lg text-blue-700 mb-8 text-center">
        Control de salud para tus mejores amigos
      </Text>

      {/* Loading indicator */}
      <ActivityIndicator size="large" color="#3B82F6" />

      {/* Texto de carga */}
      <Text className="mt-6 text-blue-600 text-base">Cargando...</Text>

      {/* Decoración inferior */}
      <View className="absolute bottom-12 flex-row items-center gap-2">
        <View className="w-2 h-2 bg-blue-400 rounded-full" />
        <View className="w-2 h-2 bg-blue-500 rounded-full" />
        <View className="w-2 h-2 bg-blue-600 rounded-full" />
      </View>
    </View>
  );
}
