import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMealTimes, MealTime } from "../context/MealTimesContext";
import { Clock, Save, X, Plus } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Header from "../components/Header";
import HeaderIcon from "../components/HeaderIcon";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";
import PrimaryButton from "../components/PrimaryButton";
import DatePickerDrawer from "../components/DatePickerDrawer";

interface MealTimesSettingsScreenProps {
  onNavigateBack: () => void;
}

export default function MealTimesSettingsScreen({
  onNavigateBack,
}: MealTimesSettingsScreenProps) {
  const { mealTimes, addMealTime, updateMealTime, deleteMealTime } =
    useMealTimes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTime, setEditTime] = useState("");
  const [tempEditTime, setTempEditTime] = useState("");
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [tempNewTime, setTempNewTime] = useState("12:00");
  const [showNewTimePicker, setShowNewTimePicker] = useState(false);

  const handleEdit = (meal: MealTime) => {
    setEditingId(meal.id);
    setEditName(meal.name);
    setEditTime(meal.time);
    setTempEditTime(meal.time);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditTime("");
    setTempEditTime("");
    setShowEditTimePicker(false);
  };

  const handleOpenEditTimePicker = () => {
    setTempEditTime(editTime);
    setShowEditTimePicker(true);
  };

  const handleConfirmEditTime = () => {
    setEditTime(tempEditTime);
    setShowEditTimePicker(false);
  };

  const handleCancelEditTime = () => {
    setShowEditTimePicker(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    if (!editingId) return;

    try {
      const meal = mealTimes.find((m) => m.id === editingId);
      if (!meal) return;

      await updateMealTime(editingId, {
        name: editName.trim(),
        time: editTime,
        order: meal.order,
      });

      setEditingId(null);
      setEditName("");
      setEditTime("");
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar la comida");
    }
  };

  const handleDelete = (meal: MealTime) => {
    if (mealTimes.length <= 1) {
      Alert.alert(
        "No se puede eliminar",
        "Debes tener al menos una comida configurada"
      );
      return;
    }

    Alert.alert(
      "Eliminar comida",
      `¿Estás seguro de eliminar "${meal.name}"?\n\nLos medicamentos que usan esta comida dejarán de programarse en este horario.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMealTime(meal.id);
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la comida");
            }
          },
        },
      ]
    );
  };

  const handleAddNew = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío");
      return;
    }

    try {
      const nextOrder = Math.max(...mealTimes.map((m) => m.order), 0) + 1;

      await addMealTime({
        name: newName.trim(),
        time: newTime,
        order: nextOrder,
      });

      setIsAddingNew(false);
      setNewName("");
      setNewTime("12:00");
      setTempNewTime("12:00");
    } catch (error) {
      Alert.alert("Error", "No se pudo agregar la comida");
    }
  };

  const handleOpenNewTimePicker = () => {
    setTempNewTime(newTime);
    setShowNewTimePicker(true);
  };

  const handleConfirmNewTime = () => {
    setNewTime(tempNewTime);
    setShowNewTimePicker(false);
  };

  const handleCancelNewTime = () => {
    setShowNewTimePicker(false);
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

  const formatDisplayTime = (timeString: string) => {
    // Asegurar que solo se muestren HH:mm (sin segundos)
    return timeString.slice(0, 5);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]">
      <Header
        title="Horarios de Comida"
        onBack={onNavigateBack}
        rightButton={
          <HeaderIcon Icon={Plus} onPress={() => setIsAddingNew(true)} />
        }
      />

      <ScrollView
        className="flex-1 bg-white rounded-t-3xl px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Lista de comidas */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-3">
            Comidas del día ({mealTimes.length})
          </Text>

          {mealTimes.map((meal, index) => (
            <View
              key={meal.id}
              className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
            >
              {editingId === meal.id ? (
                // Modo edición
                <View>
                  <View className="flex-row items-center mb-3">
                    <Text className="text-gray-600 text-xl mr-3">
                      {index + 1}.
                    </Text>
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Nombre de la comida"
                      className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-gray-900"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>

                  <View className="flex-row items-center mb-3">
                    <Clock size={20} color="#6B7280" strokeWidth={2} />
                    <TouchableOpacity
                      onPress={handleOpenEditTimePicker}
                      className="ml-3 bg-gray-50 px-4 py-2 rounded-lg flex-1"
                    >
                      <Text className="text-gray-900 text-lg font-semibold">
                        {editTime}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={handleSaveEdit}
                      className="flex-1 bg-purple-500 py-2 rounded-lg"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-center">
                        <Save size={18} color="white" strokeWidth={2} />
                        <Text className="text-white font-semibold ml-2">
                          Guardar
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      className="flex-1 bg-gray-200 py-2 rounded-lg"
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-center">
                        <X size={18} color="#4B5563" strokeWidth={2} />
                        <Text className="text-gray-700 font-semibold ml-2">
                          Cancelar
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                // Modo vista
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1 text-lg">
                      <Text className="text-gray-600 mr-3">{index + 1}.</Text>
                      <Text className="text-gray-900 font-bold">
                        {meal.name}
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-10">
                      <Clock size={16} color="#6B7280" strokeWidth={2} />
                      <Text className="text-gray-600 ml-2 text-base">
                        {formatDisplayTime(meal.time)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <EditButton onPress={() => handleEdit(meal)} />
                    <DeleteButton onPress={() => handleDelete(meal)} />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Agregar nueva comida */}
        {isAddingNew && (
          <View className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <Text className="text-green-900 font-semibold mb-3">
              Nueva comida
            </Text>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-1">Nombre *</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Ej: Merienda"
                className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="mb-3">
              <Text className="text-gray-700 text-sm mb-1">Hora *</Text>
              <TouchableOpacity
                onPress={handleOpenNewTimePicker}
                className="bg-white px-4 py-3 rounded-xl border border-gray-300"
              >
                <Text className="text-gray-900 text-base">{newTime}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleAddNew}
                className="flex-1 bg-green-300 py-3 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-black font-semibold text-center">
                  Agregar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsAddingNew(false);
                  setNewName("");
                  setNewTime("12:00");
                }}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Time Picker Drawer para edición */}
      <DatePickerDrawer
        visible={showEditTimePicker}
        mode="time"
        value={tempEditTime}
        onConfirm={(value) => {
          setEditTime(value as string);
          setShowEditTimePicker(false);
        }}
        onCancel={() => setShowEditTimePicker(false)}
        title="Seleccionar Hora"
      />

      {/* Time Picker Drawer para nueva comida */}
      <DatePickerDrawer
        visible={showNewTimePicker}
        mode="time"
        value={tempNewTime}
        onConfirm={(value) => {
          setNewTime(value as string);
          setShowNewTimePicker(false);
        }}
        onCancel={() => setShowNewTimePicker(false)}
        title="Seleccionar Hora"
      />
    </SafeAreaView>
  );
}
