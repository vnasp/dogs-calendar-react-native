import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useCalendar,
  appointmentTypeLabels,
  appointmentTypeColors,
} from "../context/CalendarContext";
import { useDogs } from "../context/DogsContext";
import { notificationLabels } from "../components/NotificationSelector";
import Logo from "../components/Logo";
import HeaderAddButton from "../components/HeaderAddButton";
import AppointmentIcon from "../components/AppointmentIcon";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";
import {
  ChevronLeft,
  Dog,
  Calendar as CalendarIcon,
  Clock,
  Bell,
} from "lucide-react-native";

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
        onPress: async () => await deleteAppointment(id),
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
    const todayTime = today.getTime();

    const sorted = [...appointments].sort(
      (a, b) => {
        const aDate = new Date(
          a.date.getFullYear(),
          a.date.getMonth(),
          a.date.getDate()
        );
        const bDate = new Date(
          b.date.getFullYear(),
          b.date.getMonth(),
          b.date.getDate()
        );
        return aDate.getTime() - bDate.getTime();
      }
    );

    if (filter === "upcoming") {
      return sorted.filter((apt) => {
        const aptDate = new Date(
          apt.date.getFullYear(),
          apt.date.getMonth(),
          apt.date.getDate()
        );
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() >= todayTime;
      });
    } else if (filter === "past") {
      return sorted.filter((apt) => {
        const aptDate = new Date(
          apt.date.getFullYear(),
          apt.date.getMonth(),
          apt.date.getDate()
        );
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() < todayTime;
      }).reverse();
    }
    return sorted;
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView
      className="flex-1 bg-cyan-600"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="bg-cyan-600 pt-6 pb-6 px-6">
          <View className="flex-row items-center justify-between mb-3">
            <Logo />
            {dogs.length > 0 && (
              <HeaderAddButton onPress={() => onNavigateToAddEdit()} />
            )}
          </View>
          <Text className="text-white text-xl font-bold mb-4">Calendario</Text>

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

        {/* Contenido con redondeado superior */}
        <View className="flex-1 bg-gray-50 rounded-t-3xl -mt-4 px-6 pt-6">
          {dogs.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Dog size={80} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
                Primero agrega un perro
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Necesitas tener perros registrados para agendar citas
              </Text>
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View className="items-center justify-center py-20">
              <CalendarIcon size={80} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
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
                      <AppointmentIcon
                        type={appointment.type}
                        size={24}
                        color="#1F2937"
                        strokeWidth={2}
                      />
                    </View>

                    {/* Información */}
                    <View className="flex-1">
                      <Text className="text-gray-900 text-lg font-bold mb-1">
                        {appointmentTypeLabels[appointment.type]}
                      </Text>
                      <View className="flex-row items-center mb-1">
                        <Dog size={14} color="#374151" strokeWidth={2} />
                        <Text className="text-gray-700 text-base ml-1">
                          {appointment.dogName}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-3 mb-1">
                        <View className="flex-row items-center">
                          <CalendarIcon
                            size={14}
                            color="#4B5563"
                            strokeWidth={2}
                          />
                          <Text className="text-gray-600 text-sm ml-1">
                            {formatDate(appointment.date)}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Clock size={14} color="#4B5563" strokeWidth={2} />
                          <Text className="text-gray-600 text-sm ml-1">
                            {appointment.time}
                          </Text>
                        </View>
                      </View>
                      {appointment.notificationTime &&
                        appointment.notificationTime !== "none" && (
                          <View className="flex-row items-center mt-1">
                            <Bell size={14} color="#2563eb" strokeWidth={2} />
                            <Text className="text-blue-600 text-sm ml-1">
                              {notificationLabels[appointment.notificationTime]}
                            </Text>
                          </View>
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
                    <View className="flex-1">
                      <EditButton
                        onPress={() => onNavigateToAddEdit(appointment.id)}
                      />
                    </View>
                    <View className="flex-1">
                      <DeleteButton
                        onPress={() => handleDelete(appointment.id)}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
