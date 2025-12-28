import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDogs } from "../context/DogsContext";
import HeaderAddButton from "../components/HeaderAddButton";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";

interface DogsListScreenProps {
  onNavigateToAddEdit: (dogId?: string) => void;
  onNavigateBack: () => void;
  onNavigateToMedicalHistory: (dogId: string) => void;
}

export default function DogsListScreen({
  onNavigateToAddEdit,
  onNavigateBack,
  onNavigateToMedicalHistory,
}: DogsListScreenProps) {
  const { dogs, deleteDog } = useDogs();

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Eliminar perro", `¿Estás seguro de eliminar a ${name}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteDog(id),
      },
    ]);
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
            <Text className="text-white text-2xl font-bold">Mis Perros</Text>
          </View>
          <HeaderAddButton onPress={() => onNavigateToAddEdit()} />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        {dogs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🐕</Text>
            <Text className="text-gray-500 text-lg text-center mb-2">
              No tienes perros registrados
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              Agrega tu primer perrito para comenzar
            </Text>
          </View>
        ) : (
          <View className="gap-4 pb-6">
            {dogs.map((dog) => (
              <View key={dog.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex-row">
                  {/* Foto */}
                  <View className="w-20 h-20 bg-gray-200 rounded-xl mr-4 overflow-hidden">
                    {dog.photo ? (
                      <Image
                        source={{ uri: dog.photo }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-4xl">🐕</Text>
                      </View>
                    )}
                  </View>

                  {/* Información */}
                  <View className="flex-1">
                    <Text className="text-gray-900 text-xl font-bold mb-1">
                      {dog.name}
                    </Text>
                    <Text className="text-gray-600 text-sm mb-1">
                      {dog.breed}
                    </Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-gray-500 text-sm">
                        {calculateAge(dog.birthDate)} años
                      </Text>
                      <Text className="text-gray-500 text-sm">•</Text>
                      <Text className="text-gray-500 text-sm">
                        {dog.gender === "male" ? "Macho" : "Hembra"}
                      </Text>
                      {dog.isNeutered && (
                        <>
                          <Text className="text-gray-500 text-sm">•</Text>
                          <Text className="text-gray-500 text-sm">
                            {dog.gender === "male"
                              ? "Castrado"
                              : "Esterilizada"}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Botones de acción */}
                <View className="flex-row gap-2 mt-4">
                  <View className="flex-1">
                    <EditButton onPress={() => onNavigateToAddEdit(dog.id)} />
                  </View>
                  <View className="flex-1">
                    <DeleteButton
                      onPress={() => handleDelete(dog.id, dog.name)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
