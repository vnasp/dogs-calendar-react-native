import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDogs } from "../context/DogsContext";
import Header from "../components/Header";
import PrimaryButton from "../components/PrimaryButton";
import DatePickerDrawer from "../components/DatePickerDrawer";

interface AddEditDogScreenProps {
  dogId?: string;
  onNavigateBack: () => void;
}

export default function AddEditDogScreen({
  dogId,
  onNavigateBack,
}: AddEditDogScreenProps) {
  const { addDog, updateDog, getDogById } = useDogs();
  const isEditing = !!dogId;
  const existingDog = dogId ? getDogById(dogId) : undefined;

  const [name, setName] = useState(existingDog?.name || "");
  const [photo, setPhoto] = useState(existingDog?.photo || "");
  const [breed, setBreed] = useState(existingDog?.breed || "");
  const [birthDate, setBirthDate] = useState(
    existingDog?.birthDate || new Date()
  );
  const [gender, setGender] = useState<"male" | "female">(
    existingDog?.gender || "male"
  );
  const [isNeutered, setIsNeutered] = useState(
    existingDog?.isNeutered || false
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permisos necesarios",
        "Necesitamos permisos para acceder a tus fotos"
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error en pickImage:", error);
      Alert.alert("Error", "No se pudo abrir el selector de imágenes");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del perro");
      return;
    }
    if (!breed.trim()) {
      Alert.alert("Error", "Por favor ingresa la raza");
      return;
    }

    try {
      setSaving(true);
      const dogData = {
        name: name.trim(),
        photo,
        breed: breed.trim(),
        birthDate,
        gender,
        isNeutered,
      };

      if (isEditing && dogId) {
        await updateDog(dogId, dogData);
      } else {
        await addDog(dogData);
      }

      onNavigateBack();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el perro");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]" {...panResponder.panHandlers}>
      <Header
        title={isEditing ? "Editar Perro" : "Agregar Perro"}
        onBack={onNavigateBack}
      />

      <ScrollView
        className="flex-1 bg-white rounded-t-3xl px-6 pt-6"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Foto */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage}>
            <View className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden items-center justify-center">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={(e) =>
                    console.log("Error cargando imagen:", e.nativeEvent.error)
                  }
                />
              ) : (
                <Text className="text-6xl">📷</Text>
              )}
            </View>
            <Text className="text-blue-600 text-center mt-2 font-semibold">
              {photo ? "Cambiar foto" : "Agregar foto"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Nombre *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Max, Luna, Rocky..."
            className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Raza */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Raza *</Text>
          <TextInput
            value={breed}
            onChangeText={setBreed}
            placeholder="Ej: Labrador, Mestizo, Beagle..."
            className="bg-white px-4 py-3 rounded-xl text-gray-900 border border-gray-300"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Fecha de nacimiento */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">
            Fecha de nacimiento
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            className="bg-white px-4 py-3 rounded-xl border border-gray-300"
          >
            <Text className="text-gray-900">{formatDate(birthDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Género */}
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2">Sexo</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setGender("male")}
              className={`flex-1 py-3 rounded-xl ${
                gender === "male" ? "bg-blue-500" : "bg-white"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  gender === "male" ? "text-white" : "text-gray-700"
                }`}
              >
                🐕 Macho
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGender("female")}
              className={`flex-1 py-3 rounded-xl ${
                gender === "female" ? "bg-pink-500" : "bg-white"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  gender === "female" ? "text-white" : "text-gray-700"
                }`}
              >
                🐕 Hembra
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Esterilizado/Castrado */}
        <View className="mb-6">
          <Text className="text-gray-700 font-semibold mb-2">
            {gender === "male" ? "¿Está castrado?" : "¿Está esterilizada?"}
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setIsNeutered(true)}
              className={`flex-1 py-3 rounded-xl ${
                isNeutered ? "bg-[#0F7D63]" : "bg-white"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  isNeutered ? "text-white" : "text-gray-700"
                }`}
              >
                Sí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsNeutered(false)}
              className={`flex-1 py-3 rounded-xl ${
                !isNeutered ? "bg-gray-400" : "bg-white"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  !isNeutered ? "text-white" : "text-gray-700"
                }`}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón guardar */}
        <PrimaryButton
          onPress={handleSave}
          text={isEditing ? "Guardar cambios" : "Agregar perro"}
          loading={saving}
        />
      </ScrollView>

      {/* Date Picker Drawer */}
      <DatePickerDrawer
        visible={showDatePicker}
        mode="date"
        value={birthDate}
        onConfirm={(value) => {
          setBirthDate(value as Date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        title="Seleccionar Fecha de Nacimiento"
        maximumDate={new Date()}
      />
    </SafeAreaView>
  );
}
