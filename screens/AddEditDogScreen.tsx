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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDogs } from "../context/DogsContext";
import { ChevronLeft } from "lucide-react-native";
import PrimaryButton from "../components/PrimaryButton";

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
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre del perro");
      return;
    }
    if (!breed.trim()) {
      Alert.alert("Error", "Por favor ingresa la raza");
      return;
    }

    const dogData = {
      name: name.trim(),
      photo,
      breed: breed.trim(),
      birthDate,
      gender,
      isNeutered,
    };

    if (isEditing && dogId) {
      updateDog(dogId, dogData);
    } else {
      addDog(dogData);
    }

    onNavigateBack();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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
            {isEditing ? "Editar Perro" : "Agregar Perro"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-white rounded-t-3xl px-6 pt-6">
        {/* Foto */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={pickImage}>
            <View className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden items-center justify-center">
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  className="w-full h-full"
                  resizeMode="cover"
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
            className="bg-white px-4 py-3 rounded-xl text-gray-900"
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
            className="bg-white px-4 py-3 rounded-xl text-gray-900"
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
            className="bg-white px-4 py-3 rounded-xl"
          >
            <Text className="text-gray-900">{formatDate(birthDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setBirthDate(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}
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
                isNeutered ? "bg-green-500" : "bg-white"
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
        />
      </ScrollView>
    </SafeAreaView>
  );
}
