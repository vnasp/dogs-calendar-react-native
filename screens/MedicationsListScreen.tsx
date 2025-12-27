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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-cyan-600 pt-6 pb-6 px-6">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={onNavigateBack} className="mr-3">
              <Text className="text-white text-2xl">‹</Text>
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Medicamentos</Text>
          </View>
          {dogs.length > 0 && (
            <TouchableOpacity
              onPress={() => onNavigateToAddEdit()}
              className="bg-white px-4 py-2 rounded-lg"
            >
              <Text className="text-cyan-600 font-semibold">+ Agregar</Text>
            </TouchableOpacity>
          )}
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
              Necesitas tener perros registrados para agregar medicamentos
            </Text>
          </View>
        ) : medications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">💊</Text>
            <Text className="text-gray-500 text-lg text-center mb-2">
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
                    <Text className="text-2xl mr-2">🐕</Text>
                    <Text className="text-gray-900 text-xl font-bold">
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
                              <Text className="text-2xl">💊</Text>
                            </View>

                            {/* Información */}
                            <View className="flex-1">
                              <Text className="text-gray-900 text-lg font-bold mb-1">
                                {medication.name}
                              </Text>
                              <Text className="text-gray-700 text-base mb-1">
                                💉 {medication.dosage}
                              </Text>
                              <Text className="text-gray-600 text-sm mb-1">
                                🕐 Cada {medication.frequencyHours} horas (
                                {medication.scheduledTimes.length}x al día)
                              </Text>
                              {medication.scheduledTimes &&
                                medication.scheduledTimes.length > 0 && (
                                  <Text className="text-blue-600 text-sm mb-1">
                                    🕒 {medication.scheduledTimes.join(", ")}
                                  </Text>
                                )}
                              {isContinuous ? (
                                <Text className="text-gray-600 text-sm mb-1">
                                  📅 Desde {formatDate(medication.startDate)} •
                                  Continuo
                                </Text>
                              ) : (
                                <Text className="text-gray-600 text-sm mb-1">
                                  📅 {formatDate(medication.startDate)} -{" "}
                                  {formatDate(medication.endDate)}
                                </Text>
                              )}
                              {!isContinuous && !isExpired && (
                                <Text
                                  className={`text-sm font-semibold ${
                                    isEndingSoon
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {daysRemaining === 0
                                    ? "⚠️ Último día"
                                    : daysRemaining === 1
                                    ? "⚠️ 1 día restante"
                                    : isEndingSoon
                                    ? `⚠️ ${daysRemaining} días restantes`
                                    : `✓ ${daysRemaining} días restantes`}
                                </Text>
                              )}
                              {isContinuous && (
                                <Text className="text-blue-600 text-sm font-semibold">
                                  ∞ Tratamiento continuo
                                </Text>
                              )}
                              {isExpired && (
                                <Text className="text-red-600 text-sm font-semibold">
                                  ❌ Tratamiento finalizado
                                </Text>
                              )}
                              {medication.notificationTime &&
                                medication.notificationTime !== "none" && (
                                  <Text className="text-purple-600 text-sm mt-1">
                                    🔔{" "}
                                    {
                                      notificationLabels[
                                        medication.notificationTime
                                      ]
                                    }
                                  </Text>
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
                              trackColor={{ false: "#D1D5DB", true: "#EC4899" }}
                              thumbColor={
                                medication.isActive ? "#FFFFFF" : "#F3F4F6"
                              }
                            />
                          </View>

                          {/* Botones de acción */}
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => onNavigateToAddEdit(medication.id)}
                              className="flex-1 bg-pink-50 py-3 rounded-xl"
                            >
                              <Text className="text-pink-600 text-center font-semibold">
                                Editar
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() =>
                                handleDelete(
                                  medication.id,
                                  dog.name,
                                  medication.name
                                )
                              }
                              className="flex-1 bg-red-50 py-3 rounded-xl"
                            >
                              <Text className="text-red-600 text-center font-semibold">
                                Eliminar
                              </Text>
                            </TouchableOpacity>
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
      </ScrollView>
    </SafeAreaView>
  );
}
