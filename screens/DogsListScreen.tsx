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
import Logo from "../components/Logo";
import Header from "../components/Header";
import HeaderIcon from "../components/HeaderIcon";
import { Clock, Pencil, Trash2, Plus } from "lucide-react-native";
import EditButton from "../components/EditButton";
import DeleteButton from "../components/DeleteButton";

interface DogsListScreenProps {
  onNavigateToAddEdit: (dogId?: string) => void;
  onNavigateBack: () => void;
  onNavigateToMedicalHistory: (dogId: string) => void;
  onNavigateToMealTimes: () => void;
}

export default function DogsListScreen({
  onNavigateToAddEdit,
  onNavigateBack,
  onNavigateToMedicalHistory,
  onNavigateToMealTimes,
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
    <SafeAreaView
      className="flex-1 bg-[#10B981]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
      >
        <Header
          leftButton={<Logo />}
          rightButton={
            <HeaderIcon Icon={Plus} onPress={() => onNavigateToAddEdit()} />
          }
          subtitle="Mis Perros"
        />

        {/* Contenido con redondeado superior */}
        <View className="flex-1 bg-gray-50 rounded-t-3xl -mt-4 px-6 pt-6">
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
                <View
                  key={dog.id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row">
                    {/* Foto */}
                    <View className="w-20 h-20 bg-gray-200 rounded-xl mr-4 overflow-hidden">
                      {dog.photo ? (
                        <Image
                          source={{ uri: dog.photo }}
                          className="w-full h-full"
                          resizeMode="cover"
                          onError={(e) =>
                            console.log(
                              "Error cargando foto de",
                              dog.name,
                              ":",
                              e.nativeEvent.error
                            )
                          }
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

                    {/* Botones de acción - columna derecha */}
                    <View className="gap-2 ml-3">
                      <EditButton onPress={() => onNavigateToAddEdit(dog.id)} />
                      <DeleteButton
                        onPress={() => handleDelete(dog.id, dog.name)}
                      />
                    </View>
                  </View>

                  {/* Opciones */}
                  <View className="mt-4">
                    <Text className="text-gray-600 text-xs font-semibold uppercase mb-2">
                      Opciones
                    </Text>
                    <View className="gap-2">
                      <TouchableOpacity
                        className="border-2 border-[#0F7D63] p-2 rounded-xl flex-row items-center justify-center"
                        onPress={onNavigateToMealTimes}
                      >
                        <Clock size={20} color="#0F7D63" strokeWidth={2} />
                        <Text className="text-[#0F7D63] font-semibold ml-2">
                          Horarios de Comida
                        </Text>
                      </TouchableOpacity>
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
