import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useExercise,
  ExerciseType,
  exerciseTypeLabels,
  exerciseTypeColors,
  calculateScheduledTimes,
} from "../context/ExerciseContext";
import { useDogs } from "../context/DogsContext";
import NotificationSelector, {
  NotificationTime,
} from "../components/NotificationSelector";
import PrimaryButton from "../components/PrimaryButton";
import ExerciseIcon from "../components/ExerciseIcon";
import { Dog, Clock, ChevronLeft } from "lucide-react-native";

interface AddEditExerciseScreenProps {
  exerciseId?: string;
  onNavigateBack: () => void;
}

export default function AddEditExerciseScreen({
  exerciseId,
  onNavigateBack,
}: AddEditExerciseScreenProps) {
  const { addExercise, updateExercise, getExerciseById } = useExercise();
  const { dogs } = useDogs();
  const isEditing = !!exerciseId;
  const existingExercise = exerciseId ? getExerciseById(exerciseId) : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existingExercise?.dogId || dogs[0]?.id || ""
  );
  const [type, setType] = useState<ExerciseType>(
    existingExercise?.type || "caminata"
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existingExercise?.durationMinutes.toString() || "30"
  );
  const [timesPerDay, setTimesPerDay] = useState(
    existingExercise?.timesPerDay.toString() || "1"
  );
  const [startTime, setStartTime] = useState(
    existingExercise?.startTime || "07:00"
  );
  const [endTime, setEndTime] = useState(existingExercise?.endTime || "21:00");
  const [startDate, setStartDate] = useState(
    existingExercise?.startDate
      ? new Date(existingExercise.startDate)
      : new Date()
  );
  const [isPermanent, setIsPermanent] = useState(
    existingExercise?.isPermanent ?? true
  );
  const [durationWeeks, setDurationWeeks] = useState(
    existingExercise?.durationWeeks?.toString() || "4"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(existingExercise?.notes || "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existingExercise?.notificationTime || "15min"
  );

  // Calcular horarios automáticamente cuando cambian los parámetros
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);

  useEffect(() => {
    const times = parseInt(timesPerDay);
    if (!isNaN(times) && times > 0) {
      const calculated = calculateScheduledTimes(startTime, endTime, times);
      setScheduledTimes(calculated);
    }
  }, [startTime, endTime, timesPerDay]);

  const exerciseTypes: ExerciseType[] = [
    "caminata",
    "cavaletti",
    "natacion",
    "carrera",
    "juego",
    "fisioterapia",
    "otro",
  ];

  const handleSave = () => {
    if (!selectedDogId) {
      Alert.alert("Error", "Por favor selecciona un perro");
      return;
    }

    const duration = parseInt(durationMinutes);
    const times = parseInt(timesPerDay);

    if (isNaN(duration) || duration <= 0) {
      Alert.alert("Error", "Por favor ingresa una duración válida");
      return;
    }

    if (isNaN(times) || times <= 0) {
      Alert.alert("Error", "Por favor ingresa una frecuencia válida");
      return;
    }

    const weeks = parseInt(durationWeeks);
    if (!isPermanent && (isNaN(weeks) || weeks <= 0)) {
      Alert.alert("Error", "Por favor ingresa una duración válida en semanas");
      return;
    }

    // Calcular fecha de fin si no es permanente
    let endDate: Date | undefined;
    if (!isPermanent) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + weeks * 7);
    }

    const selectedDog = dogs.find((dog) => dog.id === selectedDogId);
    if (!selectedDog) {
      Alert.alert("Error", "Perro no encontrado");
      return;
    }

    const exerciseData = {
      dogId: selectedDogId,
      dogName: selectedDog.name,
      type,
      durationMinutes: duration,
      timesPerDay: times,
      startTime,
      endTime,
      scheduledTimes,
      startDate,
      isPermanent,
      durationWeeks: isPermanent ? undefined : weeks,
      endDate,
      notes: notes.trim(),
      isActive: existingExercise?.isActive ?? true,
      notificationTime,
      notificationIds: existingExercise?.notificationIds || [],
    };

    if (isEditing && exerciseId) {
      updateExercise(exerciseId, exerciseData);
    } else {
      addExercise(exerciseData);
    }

    onNavigateBack();
  };

  // Duraciones comunes
  const commonDurations = [10, 15, 20, 30, 45, 60];
  // Frecuencias comunes
  const commonFrequencies = [1, 2, 3, 4, 5, 6];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-cyan-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity onPress={onNavigateBack} className="mr-3">
            <ChevronLeft size={28} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            {isEditing ? "Editar Rutina" : "Nueva Rutina"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {/* Seleccionar Perro */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Perro *</Text>
          <View className="gap-2">
            {dogs.map((dog) => (
              <TouchableOpacity
                key={dog.id}
                onPress={() => setSelectedDogId(dog.id)}
                className={`flex-row items-center p-4 rounded-xl ${
                  selectedDogId === dog.id
                    ? "bg-teal-100 border-2 border-teal-500"
                    : "bg-white"
                }`}
              >
                <Dog
                  size={24}
                  color={selectedDogId === dog.id ? "#0f766e" : "#374151"}
                  strokeWidth={2}
                  className="mr-3"
                />
                <Text
                  className={`text-lg font-semibold ${
                    selectedDogId === dog.id ? "text-teal-700" : "text-gray-900"
                  }`}
                >
                  {dog.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tipo de ejercicio */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Tipo de ejercicio *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {exerciseTypes.map((exerciseType) => (
              <TouchableOpacity
                key={exerciseType}
                onPress={() => setType(exerciseType)}
                className={`px-4 py-3 rounded-xl flex-row items-center ${
                  type === exerciseType
                    ? exerciseTypeColors[exerciseType] +
                      " border-2 border-gray-400"
                    : "bg-white"
                }`}
              >
                <ExerciseIcon
                  type={exerciseType}
                  size={20}
                  color={type === exerciseType ? "#1F2937" : "#4B5563"}
                  strokeWidth={type === exerciseType ? 2.5 : 2}
                />
                <Text
                  className={`font-semibold ml-2 ${
                    type === exerciseType ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {exerciseTypeLabels[exerciseType]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duración */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Duración (minutos) *
          </Text>
          {/* Botones rápidos */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {commonDurations.map((duration) => (
              <TouchableOpacity
                key={duration}
                onPress={() => setDurationMinutes(duration.toString())}
                className={`px-4 py-2 rounded-lg ${
                  durationMinutes === duration.toString()
                    ? "bg-teal-500"
                    : "bg-white"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    durationMinutes === duration.toString()
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Input manual */}
          <TextInput
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            keyboardType="numeric"
            placeholder="Ej: 30"
            className="bg-white px-4 py-3 rounded-xl text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Frecuencia */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Veces por día *
          </Text>
          {/* Botones rápidos */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            {commonFrequencies.map((freq) => (
              <TouchableOpacity
                key={freq}
                onPress={() => setTimesPerDay(freq.toString())}
                className={`px-4 py-2 rounded-lg ${
                  timesPerDay === freq.toString() ? "bg-teal-500" : "bg-white"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    timesPerDay === freq.toString()
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {freq}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Input manual */}
          <TextInput
            value={timesPerDay}
            onChangeText={setTimesPerDay}
            keyboardType="numeric"
            placeholder="Ej: 3"
            className="bg-white px-4 py-3 rounded-xl text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Rango horario */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Rango horario del día
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1">Desde</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="07:00"
                className="bg-white px-4 py-3 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1">Hasta</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="21:00"
                className="bg-white px-4 py-3 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Fecha de inicio */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Fecha de inicio *
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-4 py-3 rounded-xl"
          >
            <Text className="text-gray-900">
              {startDate.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Duración del tratamiento */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Duración del tratamiento
          </Text>
          {/* Toggle permanente */}
          <TouchableOpacity
            onPress={() => setIsPermanent(!isPermanent)}
            className="bg-white px-4 py-3 rounded-xl mb-3 flex-row items-center justify-between"
          >
            <Text className="text-gray-900">Rutina permanente (sin fin)</Text>
            <View
              className={`w-12 h-6 rounded-full ${
                isPermanent ? "bg-teal-500" : "bg-gray-300"
              } flex-row ${isPermanent ? "justify-end" : "justify-start"} px-1`}
            >
              <View className="w-4 h-4 bg-white rounded-full self-center" />
            </View>
          </TouchableOpacity>

          {!isPermanent && (
            <View>
              <Text className="text-gray-600 text-sm mb-2">
                Duración en semanas *
              </Text>
              <TextInput
                value={durationWeeks}
                onChangeText={setDurationWeeks}
                keyboardType="numeric"
                placeholder="Ej: 4"
                className="bg-white px-4 py-3 rounded-xl text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              {!isNaN(parseInt(durationWeeks)) &&
                parseInt(durationWeeks) > 0 && (
                  <Text className="text-gray-500 text-sm mt-2">
                    Finalizará el{" "}
                    {new Date(
                      new Date(startDate).getTime() +
                        parseInt(durationWeeks) * 7 * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                )}
            </View>
          )}
        </View>

        {/* Horarios calculados */}
        {scheduledTimes.length > 0 && (
          <View className="mb-4 bg-blue-50 p-4 rounded-xl">
            <View className="flex-row items-center mb-2">
              <Clock size={20} color="#374151" strokeWidth={2} />
              <Text className="text-gray-700 font-semibold ml-2">
                Horarios programados
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {scheduledTimes.map((time, index) => (
                <View key={index} className="bg-white px-4 py-2 rounded-lg">
                  <Text className="text-blue-600 font-semibold">{time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Selector de notificación */}
        <View className="mb-4">
          <NotificationSelector
            selectedTime={notificationTime}
            onSelectTime={setNotificationTime}
            title="Recordarme antes de cada ejercicio"
          />
        </View>

        {/* Notas */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">
            Notas adicionales
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: Evitar días de lluvia, llevarlo con correa corta..."
            multiline
            numberOfLines={4}
            className="bg-white px-4 py-3 rounded-xl text-gray-900"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {/* Botón guardar */}
        <PrimaryButton
          onPress={handleSave}
          text={isEditing ? "Guardar cambios" : "Crear rutina"}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
