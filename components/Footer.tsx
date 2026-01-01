import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Home, Dog, Calendar, Pill, Dumbbell } from "lucide-react-native";

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
    <View
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe"
      style={{ zIndex: 1000, elevation: 1000 }}
    >
      <View className="flex-row">
        <TouchableOpacity
          onPress={onNavigateToHome}
          className="flex-1 items-center py-3"
          activeOpacity={0.7}
        >
          <Home
            size={24}
            color={isActive("home") ? "#0891b2" : "#9CA3AF"}
            strokeWidth={isActive("home") ? 2.5 : 2}
            pointerEvents="none"
          />
          <Text
            className={`text-xs mt-1 ${
              isActive("home") ? "text-cyan-600 font-semibold" : "text-gray-600"
            }`}
          >
            Inicio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToDogsList}
          className="flex-1 items-center py-3"
          activeOpacity={0.7}
        >
          <Dog
            size={24}
            color={isActive("dogsList") ? "#0891b2" : "#9CA3AF"}
            strokeWidth={isActive("dogsList") ? 2.5 : 2}
            pointerEvents="none"
          />
          <Text
            className={`text-xs mt-1 ${
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
          activeOpacity={0.7}
        >
          <Calendar
            size={24}
            color={isActive("calendar") ? "#0891b2" : "#9CA3AF"}
            strokeWidth={isActive("calendar") ? 2.5 : 2}
            pointerEvents="none"
          />
          <Text
            className={`text-xs mt-1 ${
              isActive("calendar")
                ? "text-cyan-600 font-semibold"
                : "text-gray-600"
            }`}
          >
            Citas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNavigateToMedications}
          className="flex-1 items-center py-3"
          activeOpacity={0.7}
        >
          <Pill
            size={24}
            color={isActive("medications") ? "#0891b2" : "#9CA3AF"}
            strokeWidth={isActive("medications") ? 2.5 : 2}
            pointerEvents="none"
          />
          <Text
            className={`text-xs mt-1 ${
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
          activeOpacity={0.7}
        >
          <Dumbbell
            size={24}
            color={isActive("exercises") ? "#0891b2" : "#9CA3AF"}
            strokeWidth={isActive("exercises") ? 2.5 : 2}
            pointerEvents="none"
          />
          <Text
            className={`text-xs mt-1 ${
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
