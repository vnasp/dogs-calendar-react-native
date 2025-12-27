import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
  onNavigateToDogsList: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
  onNavigateToMedications: () => void;
}

export default function HomeScreen({
  onNavigateToDogsList,
  onNavigateToCalendar,
  onNavigateToExercises,
  onNavigateToMedications,
}: HomeScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-blue-600 pt-6 pb-8 px-6 rounded-b-3xl">
          <Text className="text-white text-3xl font-bold mb-2">Hola! 👋</Text>
          <Text className="text-blue-100 text-base">
            Gestiona la salud de tus perritos
          </Text>
        </View>

        {/* Cards de navegación rápida */}
        <View className="px-6 mt-6">
          <Text className="text-gray-800 text-xl font-bold mb-4">
            Accesos rápidos
          </Text>

          <View className="gap-4">
            {/* Mis Perros */}
            <TouchableOpacity
              onPress={onNavigateToDogsList}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">🐕</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Mis Perros
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Gestiona tus mascotas
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Calendario de Salud */}
            <TouchableOpacity
              onPress={onNavigateToCalendar}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">📅</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Calendario
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Vacunas y controles
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Historial Médico */}
            <TouchableOpacity className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">🏥</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Historial Médico
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Consultas y tratamientos
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Recordatorios */}
            <TouchableOpacity className="bg-white rounded-2xl p-6 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-orange-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">🔔</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Recordatorios
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Próximas citas y eventos
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Medicamentos */}
            <TouchableOpacity
              onPress={onNavigateToMedications}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-pink-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">💊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Medicamentos
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Tratamientos y dosis
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>

            {/* Ejercicios */}
            <TouchableOpacity
              onPress={onNavigateToExercises}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-teal-100 rounded-full items-center justify-center mr-4">
                  <Text className="text-3xl">🏃</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-semibold mb-1">
                    Ejercicios
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    Rutinas y actividad física
                  </Text>
                </View>
                <Text className="text-2xl text-gray-400">›</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de recordatorios próximos */}
        <View className="px-6 mt-8 mb-6">
          <Text className="text-gray-800 text-xl font-bold mb-4">
            Próximos eventos
          </Text>

          <View className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">💉</Text>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">
                  Vacuna antirrábica
                </Text>
                <Text className="text-gray-600 text-sm mt-1">
                  15 de enero, 2026
                </Text>
              </View>
            </View>
            <Text className="text-blue-700 text-sm mt-2">Faltan 19 días</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
