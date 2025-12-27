import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface FooterProps {
  currentScreen: string;
  onNavigateToHome: () => void;
  onNavigateToDogsList: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToMedications: () => void;
  onNavigateToExercises: () => void;
}

export default function Footer({
  currentScreen,
  onNavigateToHome,
  onNavigateToDogsList,
  onNavigateToCalendar,
  onNavigateToMedications,
  onNavigateToExercises,
}: FooterProps) {
  // No mostrar el footer en pantallas de loading, add/edit, o medical history
  const hideFooterScreens = [
    "loading",
    "addEditDog",
    "addEditAppointment",
    "addEditExercise",
    "addEditMedication",
    "medicalHistory",
  ];

  if (hideFooterScreens.includes(currentScreen)) {
    return null;
  }

  const isActive = (screen: string) => currentScreen === screen;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <View className="flex-row">
        <TouchableOpacity
          onPress={onNavigateToHome}
          className="flex-1 items-center py-3"
        >
          <Text
            className={`text-2xl mb-1 ${
              isActive("home") ? "opacity-100" : "opacity-50"
            }`}
          >
            🏠
          </Text>
          <Text
            className={`text-xs ${
              isActive("home") ? "text-cyan-600 font-semibold" : "text-gray-600"
            }`}
          >
            Inicio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToDogsList}
          className="flex-1 items-center py-3"
        >
          <Text
            className={`text-2xl mb-1 ${
              isActive("dogsList") ? "opacity-100" : "opacity-50"
            }`}
          >
            🐕
          </Text>
          <Text
            className={`text-xs ${
              isActive("dogsList")
                ? "text-cyan-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Perros
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToCalendar}
          className="flex-1 items-center py-3"
        >
          <Text
            className={`text-2xl mb-1 ${
              isActive("calendar") ? "opacity-100" : "opacity-50"
            }`}
          >
            📅
          </Text>
          <Text
            className={`text-xs ${
              isActive("calendar")
                ? "text-cyan-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Calendario
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToMedications}
          className="flex-1 items-center py-3"
        >
          <Text
            className={`text-2xl mb-1 ${
              isActive("medications") ? "opacity-100" : "opacity-50"
            }`}
          >
            💊
          </Text>
          <Text
            className={`text-xs ${
              isActive("medications")
                ? "text-cyan-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Medicamentos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToExercises}
          className="flex-1 items-center py-3"
        >
          <Text
            className={`text-2xl mb-1 ${
              isActive("exercises") ? "opacity-100" : "opacity-50"
            }`}
          >
            🏃
          </Text>
          <Text
            className={`text-xs ${
              isActive("exercises")
                ? "text-cyan-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Ejercicios
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
