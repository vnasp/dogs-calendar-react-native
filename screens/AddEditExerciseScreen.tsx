import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  PanResponder,
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
import Header from "../components/Header";
import DatePickerDrawer from "../components/DatePickerDrawer";
import { Dog, Clock } from "lucide-react-native";

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
  const [customTypeDescription, setCustomTypeDescription] = useState(
    existingExercise?.customTypeDescription || ""
  );
  const [durationMinutes, setDurationMinutes] = useState(
    existingExercise?.durationMinutes?.toString() || "30"
  );
  const [timesPerDay, setTimesPerDay] = useState(
    existingExercise?.timesPerDay?.toString() || "1"
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
  const [saving, setSaving] = useState(false);

  // Gesto de deslizar para regresar
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 80;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          onNavigateBack();
        }
      },
    })
  ).current;

  // Calcular horarios automáticamente cuando cambian los parámetros
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(
    existingExercise?.scheduledTimes || []
  );
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [showTimePickerForIndex, setShowTimePickerForIndex] = useState(false);
  const [hasManualEdits, setHasManualEdits] = useState(
    !!existingExercise?.scheduledTimes?.length
  );

  useEffect(() => {
    // Solo auto-calcular si:
    // 1. No estamos editando un ejercicio existente, O
    // 2. No se han hecho ediciones manuales
    if (!isEditing || !hasManualEdits) {
      const times = parseInt(timesPerDay || "1");
      if (!isNaN(times) && times > 0 && startTime && endTime) {
        const calculated = calculateScheduledTimes(startTime, endTime, times);
        setScheduledTimes(calculated);
      }
    }
  }, [startTime, endTime, timesPerDay, isEditing, hasManualEdits]);

  // Función para recalcular horarios manualmente
  const handleRecalculateTimes = () => {
    const times = parseInt(timesPerDay || "1");
    if (!isNaN(times) && times > 0 && startTime && endTime) {
      const calculated = calculateScheduledTimes(startTime, endTime, times);
      setScheduledTimes(calculated);
      setHasManualEdits(false); // Reset manual edits flag
    }
  };

  const exerciseTypes: ExerciseType[] = [
    "caminata",
    "cavaletti",
    "balanceo",
    "slalom",
    "entrenamiento",
    "otro",
  ];

  const handleSave = async () => {
    if (!selectedDogId) {
      Alert.alert("Error", "Por favor selecciona un perro");
      return;
    }

    if (type === "otro" && !customTypeDescription.trim()) {
      Alert.alert("Error", "Por favor especifica el tipo de ejercicio");
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
      endDate.setDate(endDate.getDate() + weeks * 7 - 1);
    }

    const selectedDog = dogs.find((dog) => dog.id === selectedDogId);
    if (!selectedDog) {
      Alert.alert("Error", "Perro no encontrado");
      return;
    }

    try {
      setSaving(true);
      const exerciseData = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        type,
        customTypeDescription:
          type === "otro" ? customTypeDescription.trim() : undefined,
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
        await updateExercise(exerciseId, exerciseData);
      } else {
        await addExercise(exerciseData);
      }

      onNavigateBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la rutina");
    } finally {
      setSaving(false);
    }
  };

  // Duraciones comunes
  const commonDurations = [10, 15, 20, 30, 45, 60];
  // Frecuencias comunes
  const commonFrequencies = [1, 2, 3, 4, 5, 6];

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]" {...panResponder.panHandlers}>
      <Header
        title={isEditing ? "Editar Rutina" : "Nueva Rutina"}
        onBack={onNavigateBack}
      />

      <ScrollView
        className="flex-1 bg-white rounded-t-3xl px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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

        {/* Campo de tipo personalizado si es "otro" */}
        {type === "otro" && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              ¿Qué tipo de ejercicio es? *
            </Text>
            <TextInput
              value={customTypeDescription}
              onChangeText={setCustomTypeDescription}
              placeholder="Ej: Fisioterapia, Natación, etc."
              className="bg-white px-4 py-3 rounded-xl border border-gray-300 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

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
                className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-600 text-sm mb-1">Hasta</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="21:00"
                className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Horarios calculados - editable */}
        {scheduledTimes.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-700 font-semibold">
                Horarios programados
              </Text>
              <TouchableOpacity
                onPress={handleRecalculateTimes}
                className="bg-gray-200 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-gray-700 text-sm font-medium">
                  Recalcular
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-sm mb-2">
              Toca cada horario para ajustarlo manualmente
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {scheduledTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setEditingTimeIndex(index);
                    setShowTimePickerForIndex(true);
                  }}
                  className="bg-blue-100 px-4 py-3 rounded-xl border border-blue-300 flex-row items-center gap-2"
                >
                  <Clock size={18} color="#2563EB" />
                  <Text className="text-blue-700 font-semibold">{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Fecha de inicio */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Fecha de inicio *
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-4 py-3 rounded-xl border border-gray-300"
          >
            <Text className="text-gray-900">
              {startDate.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </TouchableOpacity>
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
            className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
            placeholderTextColor="#9CA3AF"
            textAlignVertical="top"
          />
        </View>

        {/* Botón guardar */}
        <PrimaryButton
          onPress={handleSave}
          text={isEditing ? "Guardar cambios" : "Crear rutina"}
          loading={saving}
        />
      </ScrollView>

      {/* Date Picker Drawer */}
      <DatePickerDrawer
        visible={showDatePicker}
        mode="date"
        value={startDate}
        onConfirm={(value) => {
          setStartDate(value as Date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        title="Seleccionar Fecha de Inicio"
      />

      {/* Time Picker Drawer para editar horarios individuales */}
      <DatePickerDrawer
        visible={showTimePickerForIndex}
        mode="time"
        value={
          editingTimeIndex !== null ? scheduledTimes[editingTimeIndex] : "12:00"
        }
        onConfirm={(value) => {
          if (editingTimeIndex !== null) {
            const newTimes = [...scheduledTimes];
            newTimes[editingTimeIndex] = value as string;
            // Ordenar los horarios
            newTimes.sort();
            setScheduledTimes(newTimes);
            setHasManualEdits(true); // Marcar que se editó manualmente
          }
          setShowTimePickerForIndex(false);
          setEditingTimeIndex(null);
        }}
        onCancel={() => {
          setShowTimePickerForIndex(false);
          setEditingTimeIndex(null);
        }}
        title="Ajustar Horario"
      />
    </SafeAreaView>
  );
}
