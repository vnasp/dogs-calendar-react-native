import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSharedAccess } from "../context/SharedAccessContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function SharedAccessScreen({ navigation }: any) {
  const {
    sentInvitations,
    receivedInvitations,
    activeShares,
    loading,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    revokeAccess,
  } = useSharedAccess();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa un email");
      return;
    }

    try {
      setSending(true);
      await sendInvitation(email.trim());
      setEmail("");
    } catch (error) {
      // Error handled in context
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptInvitation(id);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleReject = async (id: string) => {
    Alert.alert(
      "Rechazar invitación",
      "¿Estás seguro de rechazar esta invitación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rechazar",
          style: "destructive",
          onPress: () => rejectInvitation(id),
        },
      ]
    );
  };

  const handleRevoke = async (id: string) => {
    Alert.alert(
      "Revocar acceso",
      "¿Estás seguro de revocar el acceso compartido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revocar",
          style: "destructive",
          onPress: () => revokeAccess(id),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]">
      <Header title="Acceso Compartido" onBack={() => navigation.goBack()} />

      <ScrollView className="flex-1 bg-white rounded-t-3xl px-4 pt-6">
        {/* Enviar invitación */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-neutral-800 mb-3">
            Invitar a alguien
          </Text>
          <TextInput
            className="bg-neutral-50 rounded-xl px-4 py-3 mb-3 text-neutral-800 border border-gray-300"
            placeholder="Email de la persona"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 ${
              sending ? "bg-indigo-300" : "bg-indigo-500"
            }`}
            onPress={handleSendInvitation}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold">
                Enviar invitación
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Invitaciones recibidas */}
        {receivedInvitations.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-neutral-800 mb-3">
              Invitaciones recibidas
            </Text>
            {receivedInvitations.map((invitation) => (
              <View
                key={invitation.id}
                className="bg-blue-50 rounded-xl p-4 mb-3 border border-blue-200"
              >
                <Text className="text-neutral-800 font-medium mb-1">
                  Invitación de acceso
                </Text>
                <Text className="text-neutral-600 text-sm mb-3">
                  Alguien quiere compartir sus datos contigo
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-[#0F7D63] rounded-lg py-2"
                    onPress={() => handleAccept(invitation.id)}
                  >
                    <Text className="text-white text-center font-semibold">
                      Aceptar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-500 rounded-lg py-2"
                    onPress={() => handleReject(invitation.id)}
                  >
                    <Text className="text-white text-center font-semibold">
                      Rechazar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Invitaciones enviadas (pendientes) */}
        {sentInvitations.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-neutral-800 mb-3">
              Invitaciones enviadas
            </Text>
            {sentInvitations.map((invitation) => (
              <View
                key={invitation.id}
                className="bg-amber-50 rounded-xl p-4 mb-3 border border-amber-200"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-neutral-800 font-medium">
                      {invitation.sharedWithEmail}
                    </Text>
                    <Text className="text-amber-600 text-sm">Pendiente</Text>
                  </View>
                  <TouchableOpacity
                    className="bg-red-500 rounded-lg px-4 py-2"
                    onPress={() => handleRevoke(invitation.id)}
                  >
                    <Text className="text-white text-sm font-semibold">
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accesos activos */}
        {activeShares.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-neutral-800 mb-3">
              Accesos activos
            </Text>
            {activeShares.map((share) => (
              <View
                key={share.id}
                className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-neutral-800 font-medium">
                      {share.sharedWithEmail || "Usuario con acceso"}
                    </Text>
                    <Text className="text-green-600 text-sm">Activo</Text>
                  </View>
                  <TouchableOpacity
                    className="bg-red-500 rounded-lg px-4 py-2"
                    onPress={() => handleRevoke(share.id)}
                  >
                    <Text className="text-white text-sm font-semibold">
                      Revocar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Sin datos */}
        {sentInvitations.length === 0 &&
          receivedInvitations.length === 0 &&
          activeShares.length === 0 && (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-neutral-400 text-center">
                No tienes invitaciones ni accesos compartidos
              </Text>
            </View>
          )}

        <View className="h-6" />
      </ScrollView>
      <Footer
        currentScreen="sharedAccess"
        onNavigateToHome={() => navigation.navigate()}
        onNavigateToDogsList={() => navigation.navigate()}
        onNavigateToCalendar={() => navigation.navigate()}
        onNavigateToMedications={() => navigation.navigate()}
        onNavigateToExercises={() => navigation.navigate()}
      />
    </SafeAreaView>
  );
}
