import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalendar } from "../context/CalendarContext";
import { useMedication } from "../context/MedicationContext";
import { useExercise } from "../context/ExerciseContext";

interface HomeScreenProps {
  onNavigateToDogsList: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
  onNavigateToMedications: () => void;
  onNavigateToSharedAccess: () => void;
}

export default function HomeScreen({
  onNavigateToDogsList,
  onNavigateToCalendar,
  onNavigateToExercises,
  onNavigateToMedications,
  onNavigateToSharedAccess,
}: HomeScreenProps) {
  const { appointments } = useCalendar();
  const { medications } = useMedication();
  const { exercises } = useExercise();

  const now = new Date();

  // Obtener próximas citas
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Obtener medicamentos activos de hoy
  const todayMedications = medications
    .filter((med) => med.isActive && med.durationDays > 0)
    .slice(0, 3);

  // Obtener ejercicios activos de hoy
  const todayExercises = exercises.filter((ex) => ex.isActive).slice(0, 3);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
  };

  const getDaysUntil = (date: Date) => {
    const diffTime = new Date(date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    return `En ${diffDays} días`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 pb-20">
        {/* Header */}
        <View className="bg-cyan-600 pt-6 pb-8 px-6 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1">
              <Text className="text-white text-3xl font-bold mb-2">
                Hola! 👋
              </Text>
              <Text className="text-blue-100 text-base">
                Gestiona la salud de tus perritos
              </Text>
            </View>
            {/* Icono de acceso compartido */}
            <TouchableOpacity
              onPress={onNavigateToSharedAccess}
              className="w-12 h-12 bg-cyan-700 rounded-full items-center justify-center"
            >
              <Text className="text-2xl">👥</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Próximas citas */}
        {upcomingAppointments.length > 0 && (
          <View className="px-6 mt-6">
            <Text className="text-gray-800 text-xl font-bold mb-3">
              📅 Próximas citas
            </Text>
            <View className="gap-3">
              {upcomingAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  onPress={onNavigateToCalendar}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-3">
                      <Text className="text-2xl">📅</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold mb-1">
                        {appointment.dogName} - {appointment.type}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {formatDate(appointment.date)} • {appointment.time}
                      </Text>
                      <Text className="text-green-600 text-sm font-medium mt-1">
                        {getDaysUntil(appointment.date)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Medicamentos de hoy */}
        {todayMedications.length > 0 && (
          <View className="px-6 mt-6">
            <Text className="text-gray-800 text-xl font-bold mb-3">
              💊 Medicamentos activos
            </Text>
            <View className="gap-3">
              {todayMedications.map((medication) => (
                <TouchableOpacity
                  key={medication.id}
                  onPress={onNavigateToMedications}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-pink-100 rounded-xl items-center justify-center mr-3">
                      <Text className="text-2xl">💊</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold mb-1">
                        {medication.dogName} - {medication.name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {medication.dosage} • Cada {medication.frequencyHours}h
                      </Text>
                      <Text className="text-pink-600 text-sm font-medium mt-1">
                        🕒 {medication.scheduledTimes.join(", ")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ejercicios de hoy */}
        {todayExercises.length > 0 && (
          <View className="px-6 mt-6 mb-6">
            <Text className="text-gray-800 text-xl font-bold mb-3">
              🏃 Rutinas de hoy
            </Text>
            <View className="gap-3">
              {todayExercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={onNavigateToExercises}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-teal-100 rounded-xl items-center justify-center mr-3">
                      <Text className="text-2xl">🏃</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold mb-1">
                        {exercise.dogName} - {exercise.type}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {exercise.durationMinutes} min • {exercise.timesPerDay}x
                        al día
                      </Text>
                      <Text className="text-teal-600 text-sm font-medium mt-1">
                        🕒 {exercise.scheduledTimes.join(", ")}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Mensaje si no hay eventos */}
        {upcomingAppointments.length === 0 &&
          todayMedications.length === 0 &&
          todayExercises.length === 0 && (
            <View className="px-6 mt-20 items-center">
              <Text className="text-6xl mb-4">✨</Text>
              <Text className="text-gray-500 text-lg text-center mb-2">
                Todo tranquilo por ahora
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                No hay eventos próximos programados
              </Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}
