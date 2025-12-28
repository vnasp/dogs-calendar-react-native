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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useCalendar,
  AppointmentType,
  appointmentTypeLabels,
  appointmentTypeColors,
  appointmentTypeIcons,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import { ChevronLeft } from "lucide-react-native";
import PrimaryButton from "../components/PrimaryButton";
import NotificationSelector, {
  NotificationTime,
} from "../components/NotificationSelector";

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
  const [notes, setNotes] = useState(existingAppointment?.notes || "");
  const [notificationTime, setNotificationTime] = useState<NotificationTime>(
    existingAppointment?.notificationTime || "1day"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    "radiografia",
    "prequirurgico",
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

    const selectedDog = dogs.find((dog) => dog.id === selectedDogId);
    if (!selectedDog) {
      Alert.alert("Error", "Perro no encontrado");
      return;
    }

    const appointmentData = {
      dogId: selectedDogId,
      dogName: selectedDog.name,
      date,
      time,
      type,
      notes: notes.trim(),
      notificationTime,
    };

    if (isEditing && appointmentId) {
      await updateAppointment(appointmentId, appointmentData);
    } else {
      await addAppointment(appointmentData);
    }

    onNavigateBack();
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

  const formatTimeForPicker = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
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
            {isEditing ? "Editar Cita" : "Nueva Cita"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-white rounded-t-3xl px-6 pt-6">
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
          <View className="flex-row flex-wrap gap-2">
            {appointmentTypes.map((appointmentType) => (
              <TouchableOpacity
                key={appointmentType}
                onPress={() => setType(appointmentType)}
                className={`px-4 py-3 rounded-xl flex-row items-center ${
                  type === appointmentType
                    ? appointmentTypeColors[appointmentType] +
                      " border-2 border-gray-400"
                    : "bg-white"
                }`}
              >
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

        {/* Fecha */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Fecha *</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-4 py-3 rounded-xl"
          >
            <Text className="text-gray-900 text-base">{formatDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Hora */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Hora *</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            className="bg-white px-4 py-3 rounded-xl"
          >
            <Text className="text-gray-900 text-base">{time}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={formatTimeForPicker(time)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}
        </View>

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
        />
      </ScrollView>
    </SafeAreaView>
  );
}
