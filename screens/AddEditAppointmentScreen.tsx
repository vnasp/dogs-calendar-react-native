import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  PanResponder,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useCalendar,
  AppointmentType,
  RecurrencePattern,
  appointmentTypeLabels,
  appointmentTypeColors,
  appointmentTypeIcons,
  recurrenceLabels,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import NotificationSelector, {
  NotificationTime,
} from "../components/NotificationSelector";
import DatePickerDrawer from "../components/DatePickerDrawer";

interface AddEditAppointmentScreenProps {
  appointmentId?: string;
  onNavigateBack: () => void;
}

export default function AddEditAppointmentScreen({
  appointmentId,
  onNavigateBack,
}: AddEditAppointmentScreenProps) {
  const { addAppointment, updateAppointment, getAppointmentById } =
    useCalendar();
  const { dogs } = useDogs();
  const isEditing = !!appointmentId;
  const existingAppointment = appointmentId
    ? getAppointmentById(appointmentId)
    : undefined;

  const [selectedDogId, setSelectedDogId] = useState(
    existingAppointment?.dogId || dogs[0]?.id || ""
  );
  const [date, setDate] = useState(
    existingAppointment?.date ? new Date(existingAppointment.date) : new Date()
  );
  const [time, setTime] = useState(existingAppointment?.time || "09:00");
  const [type, setType] = useState<AppointmentType>(
    existingAppointment?.type || "control"
  );
  const [customTypeDescription, setCustomTypeDescription] = useState(
    existingAppointment?.customTypeDescription || ""
  );
  const [notes, setNotes] = useState(existingAppointment?.notes || "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existingAppointment?.notificationTime || "1day"
  );
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>(
    existingAppointment?.recurrencePattern || "none"
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    existingAppointment?.recurrenceEndDate
  );

  // Estados para los modales
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurrenceDrawer, setShowRecurrenceDrawer] = useState(false);
  const [tempRecurrencePattern, setTempRecurrencePattern] =
    useState(recurrencePattern);
  const [tempRecurrenceEndDate, setTempRecurrenceEndDate] = useState<
    Date | undefined
  >(recurrenceEndDate);
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] =
    useState(false);
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

  const appointmentTypes: AppointmentType[] = [
    "control",
    "examenes",
    "operacion",
    "fisioterapia",
    "vacuna",
    "desparasitacion",
    "otro",
  ];

  const handleSave = async () => {
    if (!selectedDogId) {
      Alert.alert("Error", "Por favor selecciona un perro");
      return;
    }

    if (type === "otro" && !customTypeDescription.trim()) {
      Alert.alert("Error", "Por favor especifica el tipo de cita");
      return;
    }

    if (recurrencePattern !== "none" && !recurrenceEndDate) {
      Alert.alert(
        "Error",
        "Por favor especifica hasta cuándo se repetirá la cita"
      );
      return;
    }

    const selectedDog = dogs.find((dog) => dog.id === selectedDogId);
    if (!selectedDog) {
      Alert.alert("Error", "Perro no encontrado");
      return;
    }

    try {
      setSaving(true);
      const appointmentData = {
        dogId: selectedDogId,
        dogName: selectedDog.name,
        date,
        time,
        type,
        customTypeDescription:
          type === "otro" ? customTypeDescription.trim() : undefined,
        notes: notes.trim(),
        notificationTime,
        recurrencePattern,
        recurrenceEndDate:
          recurrencePattern !== "none" ? recurrenceEndDate : undefined,
      };

      if (isEditing && appointmentId) {
        await updateAppointment(appointmentId, appointmentData);
      } else {
        await addAppointment(appointmentData);
      }

      onNavigateBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  const formatTimeForPicker = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const formatTimeFromPicker = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleOpenRecurrenceDrawer = () => {
    setTempRecurrencePattern(recurrencePattern);
    setTempRecurrenceEndDate(recurrenceEndDate);
    setShowRecurrenceDrawer(true);
  };

  const handleConfirmRecurrence = () => {
    setRecurrencePattern(tempRecurrencePattern);
    setRecurrenceEndDate(tempRecurrenceEndDate);
    setShowRecurrenceDrawer(false);
  };

  const formatDateDisplay = (date: Date) => {
    const weekday = date.toLocaleDateString("es-ES", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("es-ES", { month: "long" });
    const year = date.getFullYear();
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday} ${day} ${
      month.charAt(0).toUpperCase() + month.slice(1)
    } ${year}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]" {...panResponder.panHandlers}>
      <Header
        title={isEditing ? "Editar Cita" : "Nueva Cita"}
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
                    ? "bg-green-100 border-2 border-green-500"
                    : "bg-white"
                }`}
              >
                <Text className="text-2xl mr-3">🐕</Text>
                <Text
                  className={`text-lg font-semibold ${
                    selectedDogId === dog.id
                      ? "text-green-700"
                      : "text-gray-900"
                  }`}
                >
                  {dog.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tipo de cita */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Tipo de cita *
          </Text>
          <View className="gap-2">
            {appointmentTypes.map((appointmentType) => (
              <TouchableOpacity
                key={appointmentType}
                onPress={() => setType(appointmentType)}
                className={`flex-row items-center p-4 rounded-xl ${
                  type === appointmentType
                    ? appointmentTypeColors[appointmentType] +
                      " border-2 border-green-500"
                    : "bg-white border border-gray-300"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    type === appointmentType
                      ? "border-green-600 bg-green-600"
                      : "border-gray-400"
                  }`}
                >
                  {type === appointmentType && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </View>
                <Text className="text-xl mr-2">
                  {appointmentTypeIcons[appointmentType]}
                </Text>
                <Text
                  className={`font-semibold ${
                    type === appointmentType ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {appointmentTypeLabels[appointmentType]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Campo de tipo personalizado si es "otro" */}
        {type === "otro" && (
          <View className="mb-4">
            <Text className="text-gray-700 font-semibold mb-2">
              ¿Qué tipo de cita es? *
            </Text>
            <TextInput
              value={customTypeDescription}
              onChangeText={setCustomTypeDescription}
              placeholder="Ej: Peluquería, Grooming, etc."
              className="bg-white px-4 py-3 rounded-xl border border-gray-300 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        )}

        {/* Fecha y Hora */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Fecha y hora *
          </Text>
          <View className="gap-2">
            {/* Selector de Fecha */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-white px-4 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-gray-500 text-xs mb-1">Fecha</Text>
              <Text className="text-gray-900 text-base font-semibold">
                {formatDateDisplay(date)}
              </Text>
            </TouchableOpacity>

            {/* Selector de Hora */}
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="bg-white px-4 py-3 rounded-xl border border-gray-300"
            >
              <Text className="text-gray-500 text-xs mb-1">Hora</Text>
              <Text className="text-gray-900 text-base font-semibold">
                {time}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recurrencia */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Repetir cita</Text>
          <TouchableOpacity
            onPress={handleOpenRecurrenceDrawer}
            className="bg-white px-4 py-3 rounded-xl border border-gray-300"
          >
            <Text className="text-gray-900 text-base">
              {recurrenceLabels[recurrencePattern]}
            </Text>
            {recurrencePattern !== "none" && recurrenceEndDate && (
              <Text className="text-gray-600 text-sm mt-1">
                Hasta el {formatDateDisplay(recurrenceEndDate)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Modal Drawer para Recurrencia */}
        <Modal
          visible={showRecurrenceDrawer}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRecurrenceDrawer(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View
              className="bg-white rounded-t-3xl pb-8"
              style={{ maxHeight: "85%" }}
            >
              <View className="p-6 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-900 text-center">
                  Configurar Repetición
                </Text>
              </View>
              <ScrollView
                className="px-6 pt-4"
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={true}
              >
                {/* Patrón de recurrencia */}
                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Frecuencia
                  </Text>
                  <View className="gap-2">
                    {(Object.keys(recurrenceLabels) as RecurrencePattern[]).map(
                      (pattern) => (
                        <TouchableOpacity
                          key={pattern}
                          onPress={() => {
                            setTempRecurrencePattern(pattern);
                            if (pattern === "none") {
                              setTempRecurrenceEndDate(undefined);
                            }
                          }}
                          className={`flex-row items-center p-4 rounded-xl ${
                            tempRecurrencePattern === pattern
                              ? "bg-green-100 border-2 border-green-500"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          <View
                            className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                              tempRecurrencePattern === pattern
                                ? "border-green-600 bg-green-600"
                                : "border-gray-400"
                            }`}
                          >
                            {tempRecurrencePattern === pattern && (
                              <View className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </View>
                          <Text
                            className={`font-semibold ${
                              tempRecurrencePattern === pattern
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {recurrenceLabels[pattern]}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>

                {/* Fecha de fin si hay recurrencia */}
                {tempRecurrencePattern !== "none" && (
                  <View className="mb-4">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Repetir hasta *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowRecurrenceEndDatePicker(true)}
                      className="bg-white px-4 py-3 rounded-xl border border-gray-300"
                    >
                      <Text className="text-gray-900 text-base">
                        {tempRecurrenceEndDate
                          ? formatDateDisplay(tempRecurrenceEndDate)
                          : "Seleccionar fecha de fin"}
                      </Text>
                    </TouchableOpacity>
                    {showRecurrenceEndDatePicker && (
                      <View className="mt-4 mb-4">
                        <DateTimePicker
                          value={tempRecurrenceEndDate || new Date()}
                          mode="date"
                          display="spinner"
                          minimumDate={
                            new Date(date.getTime() + 24 * 60 * 60 * 1000)
                          } // Mínimo 1 día después
                          onChange={(event, selectedDate) => {
                            if (selectedDate) {
                              setTempRecurrenceEndDate(selectedDate);
                              setShowRecurrenceEndDatePicker(false);
                            }
                          }}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Botones */}
                <View className="flex-row gap-3 mt-6 mb-4">
                  <TouchableOpacity
                    onPress={() => {
                      setShowRecurrenceDrawer(false);
                      setShowRecurrenceEndDatePicker(false);
                    }}
                    className="flex-1 bg-gray-200 py-4 rounded-xl"
                    activeOpacity={0.7}
                  >
                    <Text className="text-gray-700 font-semibold text-center text-base">
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <PrimaryButton
                    onPress={handleConfirmRecurrence}
                    text="Confirmar"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Recordatorio */}
        <View className="mb-4">
          <NotificationSelector
            selectedTime={notificationTime}
            onSelectTime={setNotificationTime}
            title="Recordarme"
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
            placeholder="Información adicional sobre la cita..."
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
          text={isEditing ? "Guardar cambios" : "Agendar cita"}
          loading={saving}
        />
      </ScrollView>

      {/* Date Picker Drawer para fecha */}
      <DatePickerDrawer
        visible={showDatePicker}
        mode="date"
        value={date}
        onConfirm={(value) => {
          setDate(value as Date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        title="Seleccionar Fecha"
      />

      {/* Date Picker Drawer para hora */}
      <DatePickerDrawer
        visible={showTimePicker}
        mode="time"
        value={time}
        onConfirm={(value) => {
          setTime(value as string);
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
        title="Seleccionar Hora"
      />
    </SafeAreaView>
  );
}
