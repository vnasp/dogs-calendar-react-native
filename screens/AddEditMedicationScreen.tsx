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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useMedication,
  calculateMedicationTimes,
  calculateMedicationTimesFromMeals,
  calculateEndDate,
  ScheduleType,
} from "../context/MedicationContext";
import { useMealTimes } from "../context/MealTimesContext";
import { useDogs } from "../context/DogsContext";
import { Clock, Utensils } from "lucide-react-native";
import Header from "../components/Header";
import NotificationSelector, {
  NotificationTime,
} from "../components/NotificationSelector";
import PrimaryButton from "../components/PrimaryButton";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerDrawer from "../components/DatePickerDrawer";

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
  const { mealTimes } = useMealTimes();
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

  // Nuevo: Tipo de programación
  const [scheduleType, setScheduleType] = useState<ScheduleType>(
    existingMedication?.scheduleType || "hours"
  );

  // Para scheduleType="hours"
  const [frequencyHours, setFrequencyHours] = useState(
    existingMedication?.frequencyHours?.toString() || "8"
  );
  const [startTime, setStartTime] = useState(
    existingMedication?.startTime || "08:00"
  );

  // Para scheduleType="meals"
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>(
    existingMedication?.mealIds || []
  );

  const [durationDays, setDurationDays] = useState(
    existingMedication?.durationDays.toString() || "30"
  );
  const [startDate, setStartDate] = useState(
    existingMedication?.startDate || new Date()
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
    const duration = parseInt(durationDays);

    // Calcular scheduledTimes según el tipo de programación
    if (scheduleType === "hours") {
      const freq = parseInt(frequencyHours);
      if (!isNaN(freq) && freq > 0 && freq <= 24) {
        const times = calculateMedicationTimes(startTime, freq);
        setScheduledTimes(times);
      }
    } else if (scheduleType === "meals") {
      if (selectedMealIds.length > 0) {
        const times = calculateMedicationTimesFromMeals(
          selectedMealIds,
          mealTimes
        );
        setScheduledTimes(times);
      } else {
        setScheduledTimes([]);
      }
    }

    // Calcular fecha de fin
    if (!isNaN(duration) && duration > 0) {
      const calculatedEndDate = calculateEndDate(startDate, duration);
      setEndDate(calculatedEndDate);
    }
  }, [
    scheduleType,
    startTime,
    frequencyHours,
    selectedMealIds,
    mealTimes,
    durationDays,
    startDate,
  ]);

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

    // Validaciones según tipo de programación
    if (scheduleType === "hours") {
      const freq = parseInt(frequencyHours);
      if (isNaN(freq) || freq <= 0 || freq > 24) {
        Alert.alert(
          "Error",
          "Por favor ingresa una frecuencia válida (1-24 horas)"
        );
        return;
      }
    } else if (scheduleType === "meals") {
      if (selectedMealIds.length === 0) {
        Alert.alert("Error", "Por favor selecciona al menos una comida");
        return;
      }
    }

    const duration = parseInt(durationDays);
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
        scheduleType,
        frequencyHours:
          scheduleType === "hours" ? parseInt(frequencyHours) : undefined,
        startTime: scheduleType === "hours" ? startTime : undefined,
        mealIds: scheduleType === "meals" ? selectedMealIds : undefined,
        durationDays: parseInt(durationDays),
        startDate,
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
    <SafeAreaView className="flex-1 bg-[#10B981]" {...panResponder.panHandlers}>
      <Header
        title={isEditing ? "Editar Medicamento" : "Nuevo Medicamento"}
        onBack={onNavigateBack}
      />

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

          {/* Tipo de programación */}
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              ¿Cómo se programa? *
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setScheduleType("hours")}
                className={`flex-1 p-4 rounded-xl border-2 ${
                  scheduleType === "hours"
                    ? "bg-pink-50 border-pink-500"
                    : "bg-white border-gray-300"
                }`}
                activeOpacity={0.7}
              >
                <View className="items-center">
                  <Clock
                    size={28}
                    color={scheduleType === "hours" ? "#ec4899" : "#6B7280"}
                    strokeWidth={2}
                  />
                  <Text
                    className={`font-semibold mt-2 ${
                      scheduleType === "hours"
                        ? "text-pink-700"
                        : "text-gray-700"
                    }`}
                  >
                    Cada X horas
                  </Text>
                  <Text
                    className={`text-xs mt-1 text-center ${
                      scheduleType === "hours"
                        ? "text-pink-600"
                        : "text-gray-500"
                    }`}
                  >
                    Horario preciso
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setScheduleType("meals")}
                className={`flex-1 p-4 rounded-xl border-2 ${
                  scheduleType === "meals"
                    ? "bg-pink-50 border-pink-500"
                    : "bg-white border-gray-300"
                }`}
                activeOpacity={0.7}
              >
                <View className="items-center">
                  <Utensils
                    size={28}
                    color={scheduleType === "meals" ? "#ec4899" : "#6B7280"}
                    strokeWidth={2}
                  />
                  <Text
                    className={`font-semibold mt-2 ${
                      scheduleType === "meals"
                        ? "text-pink-700"
                        : "text-gray-700"
                    }`}
                  >
                    Con comidas
                  </Text>
                  <Text
                    className={`text-xs mt-1 text-center ${
                      scheduleType === "meals"
                        ? "text-pink-600"
                        : "text-gray-500"
                    }`}
                  >
                    Flexible
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Configuración según tipo - CADA X HORAS */}
          {scheduleType === "hours" && (
            <>
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

              {/* Hora de inicio */}
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">
                  Hora de inicio *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  className="bg-white px-4 py-3 rounded-xl border border-gray-300"
                >
                  <Text className="text-gray-900 text-base">{startTime}</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      const [hours, minutes] = startTime.split(":");
                      const date = new Date();
                      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                      return date;
                    })()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowTimePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        const hours = selectedDate
                          .getHours()
                          .toString()
                          .padStart(2, "0");
                        const minutes = selectedDate
                          .getMinutes()
                          .toString()
                          .padStart(2, "0");
                        setStartTime(`${hours}:${minutes}`);
                      }
                    }}
                  />
                )}
              </View>
            </>
          )}

          {/* Configuración según tipo - CON COMIDAS */}
          {scheduleType === "meals" && (
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">
                Seleccionar comidas *
              </Text>

              {mealTimes.length === 0 ? (
                <View className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <Text className="text-amber-900 font-semibold mb-2">
                    ⚠️ No hay comidas configuradas
                  </Text>
                  <Text className="text-amber-700 text-sm">
                    Configura los horarios de comida en Settings para usar esta
                    opción.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {mealTimes.map((meal, index) => {
                    const isSelected = selectedMealIds.includes(meal.id);
                    return (
                      <TouchableOpacity
                        key={meal.id}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedMealIds(
                              selectedMealIds.filter((id) => id !== meal.id)
                            );
                          } else {
                            setSelectedMealIds([...selectedMealIds, meal.id]);
                          }
                        }}
                        className={`flex-row items-center p-4 rounded-xl border-2 ${
                          isSelected
                            ? "bg-pink-50 border-pink-500"
                            : "bg-white border-gray-300"
                        }`}
                        activeOpacity={0.7}
                      >
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                            isSelected
                              ? "bg-pink-500 border-pink-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Text className="text-white font-bold text-xs">
                              ✓
                            </Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-semibold ${
                              isSelected ? "text-pink-700" : "text-gray-900"
                            }`}
                          >
                            {index + 1}. {meal.name}
                          </Text>
                          <Text
                            className={`text-sm ${
                              isSelected ? "text-pink-600" : "text-gray-600"
                            }`}
                          >
                            {meal.time}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

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
          </View>

          {/* Información calculada */}
          {scheduledTimes.length > 0 && (
            <View className="mb-4 bg-blue-50 p-4 rounded-xl">
              <Text className="text-gray-700 font-semibold mb-2">
                📋 Resumen del tratamiento
              </Text>
              <Text className="text-gray-700 mb-2">
                {scheduleType === "hours" ? "⏰" : "🍽️"} Horarios diarios:{" "}
                {scheduledTimes.join(", ")}
              </Text>
              {durationDays !== "0" ? (
                <>
                  <Text className="text-gray-700 mb-2">
                    📅 Fecha de fin: {formatDate(endDate)}
                  </Text>
                  <Text className="text-blue-600 font-semibold">
                    {scheduledTimes.length}x al día durante {durationDays} días{" "}
                    {scheduleType === "meals" && "• Con comidas"}
                  </Text>
                </>
              ) : (
                <Text className="text-blue-600 font-semibold">
                  {scheduledTimes.length}x al día • Tratamiento continuo
                  {scheduleType === "meals" && " • Con comidas"}
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
    </SafeAreaView>
  );
}
