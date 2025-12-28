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
import { useMedication } from "../context/MedicationContext";
import { useDogs } from "../context/DogsContext";
import { notificationLabels } from "../components/NotificationSelector";
import Logo from "../components/Logo";
import HeaderAddButton from "../components/HeaderAddButton";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";
import {
  ChevronLeft,
  Dog,
  Pill,
  Syringe,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Infinity,
  X,
  Bell,
} from "lucide-react-native";

interface MedicationsListScreenProps {
  onNavigateToAddEdit: (medicationId?: string) => void;
  onNavigateBack: () => void;
}

export default function MedicationsListScreen({
  onNavigateToAddEdit,
  onNavigateBack,
}: MedicationsListScreenProps) {
  const { medications, deleteMedication, toggleMedicationActive } =
    useMedication();
  const { dogs } = useDogs();

  const handleDelete = (
    id: string,
    dogName: string,
    medicationName: string
  ) => {
    Alert.alert(
      "Eliminar medicamento",
      `¿Estás seguro de eliminar ${medicationName} de ${dogName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteMedication(id),
        },
      ]
    );
  };

  // Agrupar medicamentos por perro
  const medicationsByDog = dogs.map((dog) => ({
    dog,
    medications: medications.filter((med) => med.dogId === dog.id),
  }));

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = (endDate: Date) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
          <Text className="text-white text-xl font-bold">Medicamentos</Text>
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
                Necesitas tener perros registrados para agregar medicamentos
              </Text>
            </View>
          ) : medications.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Pill size={80} color="#9CA3AF" strokeWidth={1.5} />
              <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
                No hay medicamentos registrados
              </Text>
              <Text className="text-gray-400 text-sm text-center">
                Agrega un medicamento para hacer seguimiento
              </Text>
            </View>
          ) : (
            <View className="gap-6 pb-6">
              {medicationsByDog.map(({ dog, medications: dogMedications }) =>
                dogMedications.length > 0 ? (
                  <View key={dog.id}>
                    {/* Nombre del perro */}
                    <View className="flex-row items-center mb-3">
                      <Dog size={24} color="#1F2937" strokeWidth={2} />
                      <Text className="text-gray-900 text-xl font-bold ml-2">
                        {dog.name}
                      </Text>
                    </View>

                    {/* Medicamentos del perro */}
                    <View className="gap-3">
                      {dogMedications.map((medication) => {
                        const isContinuous = medication.durationDays === 0;
                        const daysRemaining = getDaysRemaining(
                          medication.endDate
                        );
                        const isExpired = !isContinuous && daysRemaining < 0;
                        const isEndingSoon =
                          !isContinuous &&
                          daysRemaining <= 3 &&
                          daysRemaining >= 0;

                        return (
                          <View
                            key={medication.id}
                            className={`bg-white rounded-2xl p-4 shadow-sm ${
                              !medication.isActive || isExpired
                                ? "opacity-60"
                                : ""
                            }`}
                          >
                            <View className="flex-row items-start mb-3">
                              {/* Icono */}
                              <View className="w-12 h-12 bg-pink-100 rounded-xl items-center justify-center mr-3">
                                <Pill
                                  size={24}
                                  color="#db2777"
                                  strokeWidth={2}
                                />
                              </View>

                              {/* Información */}
                              <View className="flex-1">
                                <Text className="text-gray-900 text-lg font-bold mb-1">
                                  {medication.name}
                                </Text>
                                <View className="flex-row items-center mb-1">
                                  <Syringe
                                    size={14}
                                    color="#374151"
                                    strokeWidth={2}
                                  />
                                  <Text className="text-gray-700 text-base ml-1">
                                    {medication.dosage}
                                  </Text>
                                </View>
                                <View className="flex-row items-center mb-1">
                                  <Clock
                                    size={14}
                                    color="#4B5563"
                                    strokeWidth={2}
                                  />
                                  <Text className="text-gray-600 text-sm ml-1">
                                    Cada {medication.frequencyHours} horas (
                                    {medication.scheduledTimes.length}x al día)
                                  </Text>
                                </View>
                                {medication.scheduledTimes &&
                                  medication.scheduledTimes.length > 0 && (
                                    <View className="flex-row items-center mb-1">
                                      <Clock
                                        size={14}
                                        color="#2563eb"
                                        strokeWidth={2}
                                      />
                                      <Text className="text-blue-600 text-sm ml-1">
                                        {medication.scheduledTimes.join(", ")}
                                      </Text>
                                    </View>
                                  )}
                                {isContinuous ? (
                                  <View className="flex-row items-center mb-1">
                                    <Calendar
                                      size={14}
                                      color="#4B5563"
                                      strokeWidth={2}
                                    />
                                    <Text className="text-gray-600 text-sm ml-1">
                                      Desde {formatDate(medication.startDate)} •
                                      Continuo
                                    </Text>
                                  </View>
                                ) : (
                                  <View className="flex-row items-center mb-1">
                                    <Calendar
                                      size={14}
                                      color="#4B5563"
                                      strokeWidth={2}
                                    />
                                    <Text className="text-gray-600 text-sm ml-1">
                                      {formatDate(medication.startDate)} -{" "}
                                      {formatDate(medication.endDate)}
                                    </Text>
                                  </View>
                                )}
                                {!isContinuous && !isExpired && (
                                  <View className="flex-row items-center">
                                    {isEndingSoon ? (
                                      <AlertTriangle
                                        size={14}
                                        color="#ea580c"
                                        strokeWidth={2}
                                      />
                                    ) : (
                                      <CheckCircle
                                        size={14}
                                        color="#16a34a"
                                        strokeWidth={2}
                                      />
                                    )}
                                    <Text
                                      className={`text-sm font-semibold ml-1 ${
                                        isEndingSoon
                                          ? "text-orange-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {daysRemaining === 0
                                        ? "Último día"
                                        : daysRemaining === 1
                                        ? "1 día restante"
                                        : `${daysRemaining} días restantes`}
                                    </Text>
                                  </View>
                                )}
                                {isContinuous && (
                                  <View className="flex-row items-center">
                                    <Infinity
                                      size={14}
                                      color="#2563eb"
                                      strokeWidth={2}
                                    />
                                    <Text className="text-blue-600 text-sm font-semibold ml-1">
                                      Tratamiento continuo
                                    </Text>
                                  </View>
                                )}
                                {isExpired && (
                                  <View className="flex-row items-center">
                                    <X
                                      size={14}
                                      color="#dc2626"
                                      strokeWidth={2}
                                    />
                                    <Text className="text-red-600 text-sm font-semibold ml-1">
                                      Tratamiento finalizado
                                    </Text>
                                  </View>
                                )}
                                {medication.notificationTime &&
                                  medication.notificationTime !== "none" && (
                                    <View className="flex-row items-center mt-1">
                                      <Bell
                                        size={14}
                                        color="#9333ea"
                                        strokeWidth={2}
                                      />
                                      <Text className="text-purple-600 text-sm ml-1">
                                        {
                                          notificationLabels[
                                            medication.notificationTime
                                          ]
                                        }
                                      </Text>
                                    </View>
                                  )}
                                {medication.notes && (
                                  <Text className="text-gray-500 text-sm mt-2">
                                    {medication.notes}
                                  </Text>
                                )}
                              </View>

                              {/* Switch activo/inactivo */}
                              <Switch
                                value={medication.isActive}
                                onValueChange={() =>
                                  toggleMedicationActive(medication.id)
                                }
                                trackColor={{
                                  false: "#D1D5DB",
                                  true: "#EC4899",
                                }}
                                thumbColor={
                                  medication.isActive ? "#FFFFFF" : "#F3F4F6"
                                }
                              />
                            </View>

                            {/* Botones de acción */}
                            <View className="flex-row gap-2">
                              <View className="flex-1">
                                <EditButton
                                  onPress={() =>
                                    onNavigateToAddEdit(medication.id)
                                  }
                                />
                              </View>
                              <View className="flex-1">
                                <DeleteButton
                                  onPress={() =>
                                    handleDelete(
                                      medication.id,
                                      dog.name,
                                      medication.name
                                    )
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
