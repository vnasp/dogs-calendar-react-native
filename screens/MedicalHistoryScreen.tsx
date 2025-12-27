import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDogs } from "../context/DogsContext";
import { useCalendar } from "../context/CalendarContext";
import { useMedication } from "../context/MedicationContext";
import { useExercise } from "../context/ExerciseContext";

interface MedicalHistoryScreenProps {
  dogId: string;
  onNavigateBack: () => void;
}

export default function MedicalHistoryScreen({
  dogId,
  onNavigateBack,
}: MedicalHistoryScreenProps) {
  const { getDogById } = useDogs();
  const { getAppointmentsByDogId } = useCalendar();
  const { getMedicationsByDogId } = useMedication();
  const { getExercisesByDogId } = useExercise();

  const dog = getDogById(dogId);
  const appointments = getAppointmentsByDogId(dogId);
  const medications = getMedicationsByDogId(dogId);
  const exercises = getExercisesByDogId(dogId);

  if (!dog) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">Perro no encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-cyan-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={onNavigateBack} className="mr-3">
            <Text className="text-white text-2xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            Historial de {dog.name}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Información del perro */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Text className="text-4xl mr-3">🐕</Text>
            <View className="flex-1">
              <Text className="text-gray-900 text-2xl font-bold">
                {dog.name}
              </Text>
              <Text className="text-gray-600 text-sm">
                {dog.breed} • {dog.gender === "male" ? "Macho" : "Hembra"}
              </Text>
            </View>
          </View>
        </View>

        {/* Resumen */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-green-50 p-4 rounded-xl">
            <Text className="text-green-600 text-2xl font-bold">
              {appointments.length}
            </Text>
            <Text className="text-gray-700 text-sm">Citas</Text>
          </View>
          <View className="flex-1 bg-pink-50 p-4 rounded-xl">
            <Text className="text-pink-600 text-2xl font-bold">
              {medications.length}
            </Text>
            <Text className="text-gray-700 text-sm">Medicamentos</Text>
          </View>
          <View className="flex-1 bg-teal-50 p-4 rounded-xl">
            <Text className="text-teal-600 text-2xl font-bold">
              {exercises.length}
            </Text>
            <Text className="text-gray-700 text-sm">Rutinas</Text>
          </View>
        </View>

        {/* Próximas citas */}
        {appointments.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-3">
              📅 Citas programadas
            </Text>
            <View className="gap-3">
              {appointments
                .filter((apt) => new Date(apt.date) >= new Date())
                .slice(0, 3)
                .map((appointment) => (
                  <View
                    key={appointment.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <Text className="text-gray-900 font-semibold mb-1">
                      {appointment.type}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {formatDate(appointment.date)} • {appointment.time}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Medicamentos activos */}
        {medications.filter((m) => m.isActive).length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-3">
              💊 Medicamentos activos
            </Text>
            <View className="gap-3">
              {medications
                .filter((m) => m.isActive)
                .map((medication) => (
                  <View
                    key={medication.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <Text className="text-gray-900 font-semibold mb-1">
                      {medication.name}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {medication.dosage} • Cada {medication.frequencyHours}h
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Rutinas activas */}
        {exercises.filter((e) => e.isActive).length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-800 text-lg font-bold mb-3">
              🏃 Rutinas activas
            </Text>
            <View className="gap-3">
              {exercises
                .filter((e) => e.isActive)
                .map((exercise) => (
                  <View
                    key={exercise.id}
                    className="bg-white rounded-xl p-4 shadow-sm"
                  >
                    <Text className="text-gray-900 font-semibold mb-1">
                      {exercise.type}
                    </Text>
                    <Text className="text-gray-600 text-sm">
                      {exercise.durationMinutes} min • {exercise.timesPerDay}x
                      al día
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {appointments.length === 0 &&
          medications.length === 0 &&
          exercises.length === 0 && (
            <View className="items-center justify-center py-20">
              <Text className="text-6xl mb-4">🏥</Text>
              <Text className="text-gray-500 text-lg text-center mb-2">
                Sin historial médico
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Agrega citas, medicamentos o rutinas para comenzar
              </Text>
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}
