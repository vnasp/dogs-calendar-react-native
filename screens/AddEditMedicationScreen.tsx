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
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useMedication,
  calculateMedicationTimes,
  calculateEndDate,
} from "../context/MedicationContext";
import { useDogs } from "../context/DogsContext";
import { ChevronLeft } from "lucide-react-native";
import NotificationSelector, {
  NotificationTime,
} from "../components/NotificationSelector";
import PrimaryButton from "../components/PrimaryButton";
import DateTimePicker from "@react-native-community/datetimepicker";

interface AddEditMedicationScreenProps {
  medicationId?: string;
  onNavigateBack: () => void;
}

export default function AddEditMedicationScreen({
  medicationId,
  onNavigateBack,
}: AddEditMedicationScreenProps) {
  const { addMedication, updateMedication, getMedicationById } =
    useMedication();
  const { dogs } = useDogs();
  const isEditing = !!medicationId;
  const existingMedication = medicationId
    ? getMedicationById(medicationId)
    : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existingMedication?.dogId || dogs[0]?.id || ""
  );
  const [name, setName] = useState(existingMedication?.name || "");
  const [dosage, setDosage] = useState(existingMedication?.dosage || "");
  const [frequencyHours, setFrequencyHours] = useState(
    existingMedication?.frequencyHours.toString() || "8"
  );
  const [durationDays, setDurationDays] = useState(
    existingMedication?.durationDays.toString() || "30"
  );
  const [startDate, setStartDate] = useState(
    existingMedication?.startDate || new Date()
  );
  const [startTime, setStartTime] = useState(
    existingMedication?.startTime || "08:00"
  );
  const [notes, setNotes] = useState(existingMedication?.notes || "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existingMedication?.notificationTime || "15min"
  );

  // Estados para los date pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
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

  // Calcular horarios y fecha de fin automáticamente
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    const freq = parseInt(frequencyHours);
    const duration = parseInt(durationDays);

    if (!isNaN(freq) && freq > 0 && freq <= 24) {
      const times = calculateMedicationTimes(startTime, freq);
      setScheduledTimes(times);
    }

    if (!isNaN(duration) && duration > 0) {
      const calculatedEndDate = calculateEndDate(startDate, duration);
      setEndDate(calculatedEndDate);
    }
  }, [startTime, frequencyHours, durationDays, startDate]);

  const commonFrequencies = [6, 8, 12, 24];
  const commonDurations = [3, 7, 20, 30];

  const handleSave = async () => {
    if (!selectedDogId) {
      Alert.alert("Error", "Por favor selecciona un perro");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del medicamento");
      return;
    }

    if (!dosage.trim()) {
      Alert.alert("Error", "Por favor ingresa la dosis");
      return;
    }

    const freq = parseInt(frequencyHours);
    const duration = parseInt(durationDays);

    if (isNaN(freq) || freq <= 0 || freq > 24) {
      Alert.alert(
        "Error",
        "Por favor ingresa una frecuencia válida (1-24 horas)"
      );
      return;
    }

    if (isNaN(duration) || duration < 0) {
      Alert.alert("Error", "Por favor ingresa una duración válida");
      return;
    }

    const selectedDog = dogs.find((dog) => dog.id === selectedDogId);
    if (!selectedDog) {
      Alert.alert("Error", "Perro no encontrado");
      return;
    }

    try {
      setSaving(true);
      const medicationData = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        name: name.trim(),
        dosage: dosage.trim(),
        frequencyHours: freq,
        durationDays: duration,
        startDate,
        startTime,
        scheduledTimes,
        endDate,
        notes: notes.trim(),
        isActive: existingMedication?.isActive ?? true,
        notificationTime,
        notificationIds: existingMedication?.notificationIds || [],
      };

      if (isEditing && medicationId) {
        await updateMedication(medicationId, medicationData);
      } else {
        await addMedication(medicationData);
      }

      onNavigateBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el medicamento");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "long" });
    const year = date.getFullYear();

    // Capitalizar primera letra del día de la semana
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);

    return `${capitalizedWeekday} ${day} ${
      month.charAt(0).toUpperCase() + month.slice(1)
    } ${year}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-cyan-600" {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#0891b2" />
      {/* Header */}
      <View className="bg-cyan-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <TouchableOpacity
            onPress={onNavigateBack}
            className="mr-3 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <ChevronLeft
              size={32}
              color="white"
              strokeWidth={2.5}
              pointerEvents="none"
            />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            {isEditing ? "Editar Medicamento" : "Nuevo Medicamento"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          className="flex-1 bg-white rounded-t-3xl px-6 pt-6"
          keyboardShouldPersistTaps="handled"
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
                      ? "bg-pink-100 border-2 border-pink-500"
                      : "bg-white"
                  }`}
                >
                  <Text className="text-2xl mr-3">🐕</Text>
                  <Text
                    className={`text-lg font-semibold ${
                      selectedDogId === dog.id
                        ? "text-pink-700"
                        : "text-gray-900"
                    }`}
                  >
                    {dog.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nombre del medicamento */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Nombre del medicamento *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: Pregabalina 150 mg"
              className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Dosis */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">Dosis *</Text>
            <TextInput
              value={dosage}
              onChangeText={setDosage}
              placeholder="Ej: 1 comprimido"
              className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Frecuencia */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Cada cuántas horas *
            </Text>
            {/* Botones rápidos */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {commonFrequencies.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setFrequencyHours(freq.toString())}
                  className={`px-4 py-2 rounded-lg ${
                    frequencyHours === freq.toString()
                      ? "bg-pink-500"
                      : "bg-white"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      frequencyHours === freq.toString()
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    Cada {freq}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Input manual */}
            <TextInput
              value={frequencyHours}
              onChangeText={setFrequencyHours}
              keyboardType="numeric"
              placeholder="Ej: 8"
              className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Duración */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Duración (días) *
            </Text>
            {/* Botones rápidos */}
            <View className="flex-row flex-wrap gap-2 mb-3">
              {commonDurations.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  onPress={() => setDurationDays(duration.toString())}
                  className={`px-4 py-2 rounded-lg ${
                    durationDays === duration.toString()
                      ? "bg-pink-500"
                      : "bg-white"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      durationDays === duration.toString()
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {duration} días
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Botón Siempre */}
              <TouchableOpacity
                onPress={() => setDurationDays("0")}
                className={`px-4 py-2 rounded-lg ${
                  durationDays === "0" ? "bg-pink-500" : "bg-white"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    durationDays === "0" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Siempre
                </Text>
              </TouchableOpacity>
            </View>
            {/* Input manual */}
            <View>
              <Text className="text-gray-600 text-sm mb-2">
                O escribe la cantidad exacta:
              </Text>
              <TextInput
                value={durationDays}
                onChangeText={setDurationDays}
                keyboardType="numeric"
                placeholder="Ej: 5, 30, 45..."
                className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Fecha de inicio */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Fecha de inicio *
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-white px-4 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-gray-900 text-base">
                📅 {formatDate(startDate)}
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

          {/* Hora de inicio */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              Hora de inicio (primera dosis) *
            </Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="bg-white px-4 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-gray-900 text-base">🕐 {startTime}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${startTime}:00`)}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                is24Hour={true}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === "ios");
                  if (selectedTime) {
                    const hours = selectedTime.getHours();
                    const minutes = selectedTime.getMinutes();
                    setStartTime(
                      `${hours.toString().padStart(2, "0")}:${minutes
                        .toString()
                        .padStart(2, "0")}`
                    );
                  }
                }}
              />
            )}
          </View>

          {/* Información calculada */}
          {scheduledTimes.length > 0 && (
            <View className="mb-4 bg-blue-50 p-4 rounded-xl">
              <Text className="text-gray-700 font-semibold mb-2">
                📋 Resumen del tratamiento
              </Text>
              <Text className="text-gray-700 mb-2">
                🕒 Horarios diarios: {scheduledTimes.join(", ")}
              </Text>
              {durationDays !== "0" ? (
                <>
                  <Text className="text-gray-700 mb-2">
                    📅 Fecha de fin: {formatDate(endDate)}
                  </Text>
                  <Text className="text-blue-600 font-semibold">
                    {scheduledTimes.length}x al día durante {durationDays} días
                  </Text>
                </>
              ) : (
                <Text className="text-blue-600 font-semibold">
                  {scheduledTimes.length}x al día • Tratamiento continuo
                </Text>
              )}
            </View>
          )}

          {/* Selector de notificación */}
          <View className="mb-4">
            <NotificationSelector
              selectedTime={notificationTime}
              onSelectTime={setNotificationTime}
              title="Recordarme antes de cada dosis"
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
              placeholder="Ej: Dar con comida, evitar lácteos..."
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
            text={isEditing ? "Guardar cambios" : "Crear medicamento"}
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
