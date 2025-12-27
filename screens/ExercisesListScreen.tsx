import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useExercise,
  exerciseTypeLabels,
  exerciseTypeColors,
  exerciseTypeIcons,
} from "../context/ExerciseContext";
import { useDogs } from "../context/DogsContext";
import { notificationLabels } from "../components/NotificationSelector";

interface ExercisesListScreenProps {
  onNavigateToAddEdit: (exerciseId?: string) => void;
  onNavigateBack: () => void;
}

export default function ExercisesListScreen({
  onNavigateToAddEdit,
  onNavigateBack,
}: ExercisesListScreenProps) {
  const { exercises, deleteExercise, toggleExerciseActive } = useExercise();
  const { dogs } = useDogs();

  const handleDelete = (id: string, dogName: string) => {
    Alert.alert(
      "Eliminar rutina",
      `¿Estás seguro de eliminar esta rutina de ${dogName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteExercise(id),
        },
      ]
    );
  };

  // Agrupar ejercicios por perro
  const exercisesByDog = dogs.map((dog) => ({
    dog,
    exercises: exercises.filter((ex) => ex.dogId === dog.id),
  }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-teal-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={onNavigateBack} className="mr-3">
            <Text className="text-white text-2xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            Ejercicios
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {dogs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🐕</Text>
            <Text className="text-gray-500 text-lg text-center mb-2">
              Primero agrega un perro
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Necesitas tener perros registrados para crear rutinas
            </Text>
          </View>
        ) : exercises.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🏃</Text>
            <Text className="text-gray-500 text-lg text-center mb-2">
              No hay rutinas de ejercicio
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Crea una rutina para mantener activo a tu perro
            </Text>
          </View>
        ) : (
          <View className="gap-6 pb-6">
            {exercisesByDog.map(({ dog, exercises: dogExercises }) =>
              dogExercises.length > 0 ? (
                <View key={dog.id}>
                  {/* Nombre del perro */}
                  <View className="flex-row items-center mb-3">
                    <Text className="text-2xl mr-2">🐕</Text>
                    <Text className="text-gray-900 text-xl font-bold">
                      {dog.name}
                    </Text>
                  </View>

                  {/* Rutinas del perro */}
                  <View className="gap-3">
                    {dogExercises.map((exercise) => (
                      <View
                        key={exercise.id}
                        className={`bg-white rounded-2xl p-4 shadow-sm ${
                          !exercise.isActive ? "opacity-60" : ""
                        }`}
                      >
                        <View className="flex-row items-start mb-3">
                          {/* Icono y tipo */}
                          <View
                            className={`w-12 h-12 ${
                              exerciseTypeColors[exercise.type]
                            } rounded-xl items-center justify-center mr-3`}
                          >
                            <Text className="text-2xl">
                              {exerciseTypeIcons[exercise.type]}
                            </Text>
                          </View>

                          {/* Información */}
                          <View className="flex-1">
                            <Text className="text-gray-900 text-lg font-bold mb-1">
                              {exerciseTypeLabels[exercise.type]}
                            </Text>
                            <Text className="text-gray-700 text-base mb-1">
                              ⏱️ {exercise.durationMinutes} minutos
                            </Text>
                            <Text className="text-gray-600 text-sm mb-1">
                              🔄 {exercise.timesPerDay}{" "}
                              {exercise.timesPerDay === 1 ? "vez" : "veces"} al
                              día
                            </Text>
                            {exercise.scheduledTimes &&
                              exercise.scheduledTimes.length > 0 && (
                                <Text className="text-blue-600 text-sm mb-1">
                                  🕒 {exercise.scheduledTimes.join(", ")}
                                </Text>
                              )}
                            {exercise.notificationTime &&
                              exercise.notificationTime !== "none" && (
                                <Text className="text-purple-600 text-sm">
                                  🔔 {notificationLabels[exercise.notificationTime]}
                                </Text>
                              )}
                            {exercise.notes && (
                              <Text className="text-gray-500 text-sm mt-2">
                                {exercise.notes}
                              </Text>
                            )}
                          </View>

                          {/* Switch activo/inactivo */}
                          <Switch
                            value={exercise.isActive}
                            onValueChange={() =>
                              toggleExerciseActive(exercise.id)
                            }
                            trackColor={{ false: "#D1D5DB", true: "#14B8A6" }}
                            thumbColor={
                              exercise.isActive ? "#FFFFFF" : "#F3F4F6"
                            }
                          />
                        </View>

                        {/* Botones de acción */}
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => onNavigateToAddEdit(exercise.id)}
                            className="flex-1 bg-teal-50 py-3 rounded-xl"
                          >
                            <Text className="text-teal-600 text-center font-semibold">
                              Editar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDelete(exercise.id, dog.name)}
                            className="flex-1 bg-red-50 py-3 rounded-xl"
                          >
                            <Text className="text-red-600 text-center font-semibold">
                              Eliminar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null
            )}
          </View>
        )}
      </ScrollView>

      {/* Botón flotante para agregar */}
      {dogs.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={() => onNavigateToAddEdit()}
            className="w-16 h-16 bg-teal-600 rounded-full items-center justify-center shadow-lg"
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
