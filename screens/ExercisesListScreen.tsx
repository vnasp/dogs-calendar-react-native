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
} from "../context/ExerciseContext";
import { useDogs } from "../context/DogsContext";
import { notificationLabels } from "../components/NotificationSelector";
import HeaderAddButton from "../components/HeaderAddButton";
import ExerciseIcon from "../components/ExerciseIcon";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";
import {
  ChevronLeft,
  Dog,
  Dumbbell,
  Clock,
  Repeat,
  Bell,
  Timer,
} from "lucide-react-native";

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
      <View className="bg-cyan-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={onNavigateBack} className="mr-3">
            <ChevronLeft size={28} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            Ejercicios
          </Text>
          {dogs.length > 0 && (
            <HeaderAddButton onPress={() => onNavigateToAddEdit()} />
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {dogs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Dog size={80} color="#9CA3AF" strokeWidth={1.5} />
            <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
              Primero agrega un perro
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Necesitas tener perros registrados para crear rutinas
            </Text>
          </View>
        ) : exercises.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Dumbbell size={80} color="#9CA3AF" strokeWidth={1.5} />
            <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
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
                    <Dog size={24} color="#1F2937" strokeWidth={2} />
                    <Text className="text-gray-900 text-xl font-bold ml-2">
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
                            <ExerciseIcon
                              type={exercise.type}
                              size={24}
                              color="#1F2937"
                              strokeWidth={2}
                            />
                          </View>

                          {/* Información */}
                          <View className="flex-1">
                            <Text className="text-gray-900 text-lg font-bold mb-1">
                              {exerciseTypeLabels[exercise.type]}
                            </Text>
                            <View className="flex-row items-center mb-1">
                              <Timer
                                size={14}
                                color="#374151"
                                strokeWidth={2}
                              />
                              <Text className="text-gray-700 text-base ml-1">
                                {exercise.durationMinutes} minutos
                              </Text>
                            </View>
                            <View className="flex-row items-center mb-1">
                              <Repeat
                                size={14}
                                color="#4B5563"
                                strokeWidth={2}
                              />
                              <Text className="text-gray-600 text-sm ml-1">
                                {exercise.timesPerDay}{" "}
                                {exercise.timesPerDay === 1 ? "vez" : "veces"}{" "}
                                al día
                              </Text>
                            </View>
                            {exercise.scheduledTimes &&
                              exercise.scheduledTimes.length > 0 && (
                                <View className="flex-row items-center mb-1">
                                  <Clock
                                    size={14}
                                    color="#2563eb"
                                    strokeWidth={2}
                                  />
                                  <Text className="text-blue-600 text-sm ml-1">
                                    {exercise.scheduledTimes.join(", ")}
                                  </Text>
                                </View>
                              )}
                            {exercise.notificationTime &&
                              exercise.notificationTime !== "none" && (
                                <View className="flex-row items-center">
                                  <Bell
                                    size={14}
                                    color="#9333ea"
                                    strokeWidth={2}
                                  />
                                  <Text className="text-purple-600 text-sm ml-1">
                                    {
                                      notificationLabels[
                                        exercise.notificationTime
                                      ]
                                    }
                                  </Text>
                                </View>
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
                          <View className="flex-1">
                            <EditButton
                              onPress={() => onNavigateToAddEdit(exercise.id)}
                            />
                          </View>
                          <View className="flex-1">
                            <DeleteButton
                              onPress={() =>
                                handleDelete(exercise.id, dog.name)
                              }
                            />
                          </View>
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
    </SafeAreaView>
  );
}
