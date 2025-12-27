import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useCalendar,
  appointmentTypeLabels,
  appointmentTypeColors,
  appointmentTypeIcons,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import { notificationLabels } from "../components/NotificationSelector";

interface CalendarListScreenProps {
  onNavigateToAddEdit: (appointmentId?: string) => void;
  onNavigateBack: () => void;
}

export default function CalendarListScreen({
  onNavigateToAddEdit,
  onNavigateBack,
}: CalendarListScreenProps) {
  const { appointments, deleteAppointment } = useCalendar();
  const { dogs } = useDogs();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar cita", "¿Estás seguro de eliminar esta cita?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteAppointment(id),
      },
    ]);
  };

  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    const weekday = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString("es-ES", { month: "long" });
    const year = dateObj.getFullYear();

    // Capitalizar primera letra del día de la semana
    const capitalizedWeekday =
      weekday.charAt(0).toUpperCase() + weekday.slice(1);

    return `${capitalizedWeekday} ${day} ${
      month.charAt(0).toUpperCase() + month.slice(1)
    } ${year}`;
  };

  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...appointments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (filter === "upcoming") {
      return sorted.filter((apt) => new Date(apt.date) >= today);
    } else if (filter === "past") {
      return sorted.filter((apt) => new Date(apt.date) < today).reverse();
    }
    return sorted;
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={onNavigateBack} className="mr-3">
            <Text className="text-white text-2xl">‹</Text>
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold flex-1">
            Calendario
          </Text>
        </View>

        {/* Filtros */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setFilter("upcoming")}
            className={`flex-1 py-2 rounded-lg ${
              filter === "upcoming" ? "bg-white" : "bg-green-500"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "upcoming" ? "text-green-700" : "text-white"
              }`}
            >
              Próximas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("past")}
            className={`flex-1 py-2 rounded-lg ${
              filter === "past" ? "bg-white" : "bg-green-500"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "past" ? "text-green-700" : "text-white"
              }`}
            >
              Pasadas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            className={`flex-1 py-2 rounded-lg ${
              filter === "all" ? "bg-white" : "bg-green-500"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                filter === "all" ? "text-green-700" : "text-white"
              }`}
            >
              Todas
            </Text>
          </TouchableOpacity>
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
              Necesitas tener perros registrados para agendar citas
            </Text>
          </View>
        ) : filteredAppointments.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">📅</Text>
            <Text className="text-gray-500 text-lg text-center mb-2">
              No hay citas{" "}
              {filter === "upcoming"
                ? "próximas"
                : filter === "past"
                ? "pasadas"
                : ""}
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Agenda una nueva cita veterinaria
            </Text>
          </View>
        ) : (
          <View className="gap-4 pb-6">
            {filteredAppointments.map((appointment) => (
              <View
                key={appointment.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <View className="flex-row items-start mb-3">
                  {/* Icono y tipo */}
                  <View
                    className={`w-12 h-12 ${
                      appointmentTypeColors[appointment.type]
                    } rounded-xl items-center justify-center mr-3`}
                  >
                    <Text className="text-2xl">
                      {appointmentTypeIcons[appointment.type]}
                    </Text>
                  </View>

                  {/* Información */}
                  <View className="flex-1">
                    <Text className="text-gray-900 text-lg font-bold mb-1">
                      {appointmentTypeLabels[appointment.type]}
                    </Text>
                    <Text className="text-gray-700 text-base mb-1">
                      🐕 {appointment.dogName}
                    </Text>
                    <View className="flex-row items-center gap-3 mb-1">
                      <Text className="text-gray-600 text-sm">
                        📅 {formatDate(appointment.date)}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        🕐 {appointment.time}
                      </Text>
                    </View>
                    {appointment.notificationTime &&
                      appointment.notificationTime !== "none" && (
                        <Text className="text-blue-600 text-sm mt-1">
                          🔔 {notificationLabels[appointment.notificationTime]}
                        </Text>
                      )}
                    {appointment.notes && (
                      <Text className="text-gray-500 text-sm mt-1">
                        {appointment.notes}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Botones de acción */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => onNavigateToAddEdit(appointment.id)}
                    className="flex-1 bg-green-50 py-3 rounded-xl"
                  >
                    <Text className="text-green-600 text-center font-semibold">
                      Editar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(appointment.id)}
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
        )}
      </ScrollView>

      {/* Botón flotante para agregar */}
      {dogs.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={() => onNavigateToAddEdit()}
            className="w-16 h-16 bg-green-600 rounded-full items-center justify-center shadow-lg"
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
