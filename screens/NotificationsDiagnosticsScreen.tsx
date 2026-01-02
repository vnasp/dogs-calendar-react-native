import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import {
  getNotificationsDiagnostics,
  cancelAllNotifications,
  requestNotificationPermissions,
  checkAndCleanObsoleteNotifications,
} from "../utils/notificationService";
import * as Notifications from "expo-notifications";
import {
  Bell,
  BellOff,
  Calendar,
  Pill,
  Dumbbell,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react-native";

interface NotificationsDiagnosticsScreenProps {
  onNavigateBack: () => void;
}

export default function NotificationsDiagnosticsScreen({
  onNavigateBack,
}: NotificationsDiagnosticsScreenProps) {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsDiagnostics();
      setDiagnostics(data);
    } catch (error) {
      console.error("Error loading diagnostics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDiagnostics();
  };

  const handleClearAll = () => {
    Alert.alert(
      "⚠️ Eliminar todas las notificaciones",
      "Esto cancelará TODAS las notificaciones programadas. Tendrás que volver a crear o editar tus citas, medicamentos y ejercicios para reprogramarlas.\n\n¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todas",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert(
                "✅ Eliminadas",
                "Todas las notificaciones han sido canceladas"
              );
              loadDiagnostics();
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudieron cancelar las notificaciones"
              );
            }
          },
        },
      ]
    );
  };

  const handleRequestPermissions = async () => {
    const granted = await requestNotificationPermissions();
    if (granted) {
      Alert.alert(
        "✅ Permisos concedidos",
        "Las notificaciones están habilitadas"
      );
      loadDiagnostics();
    } else {
      Alert.alert(
        "❌ Permisos denegados",
        "Ve a Configuración → PewosApp → Notificaciones y actívalas manualmente"
      );
    }
  };

  const handleCleanObsoleteNotifications = () => {
    Alert.alert(
      "🔄 Limpiar notificaciones obsoletas",
      `Esto eliminará notificaciones que ya pasaron o que no son de hoy.\n\n¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          onPress: async () => {
            try {
              const cleaned = await checkAndCleanObsoleteNotifications();
              if (cleaned) {
                Alert.alert(
                  "✅ Limpieza completa",
                  "Se eliminaron notificaciones obsoletas.\n\nLas notificaciones se reprograman automáticamente cada día."
                );
              } else {
                Alert.alert(
                  "✅ Sin cambios",
                  "No se encontraron notificaciones obsoletas."
                );
              }

              // Recargar diagnósticos
              setTimeout(() => loadDiagnostics(), 1000);
            } catch (error) {
              Alert.alert("Error", "No se pudieron limpiar las notificaciones");
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `En ${days} ${days === 1 ? "día" : "días"}`;
    if (hours > 0) return `En ${hours} ${hours === 1 ? "hora" : "horas"}`;
    if (minutes > 0)
      return `En ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    return "Ahora";
  };

  if (loading || !diagnostics) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <Header title="Diagnóstico de Notificaciones" onBack={onNavigateBack} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Cargando diagnósticos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const permissionGranted = diagnostics.permissionStatus === "granted";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header title="Diagnóstico de Notificaciones" onBack={onNavigateBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estado de Permisos */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              {permissionGranted ? (
                <CheckCircle size={24} color="#10B981" />
              ) : (
                <XCircle size={24} color="#EF4444" />
              )}
              <Text className="text-lg font-semibold ml-2">
                Estado de Permisos
              </Text>
            </View>
            {!permissionGranted && (
              <TouchableOpacity
                onPress={handleRequestPermissions}
                className="bg-blue-500 px-3 py-1 rounded-lg"
              >
                <Text className="text-white text-xs font-semibold">
                  Activar
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text
            className={`text-base ${
              permissionGranted ? "text-green-600" : "text-red-600"
            }`}
          >
            {permissionGranted ? "✅ Habilitadas" : "❌ Deshabilitadas"}
          </Text>
          {!permissionGranted && (
            <Text className="text-gray-500 text-sm mt-2">
              Las notificaciones están deshabilitadas. Ve a Configuración →
              PewosApp → Notificaciones
            </Text>
          )}
        </View>

        {/* Resumen General */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Bell size={24} color="#3B82F6" />
            <Text className="text-lg font-semibold ml-2">Resumen General</Text>
          </View>
          <View className="space-y-2">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Total programadas</Text>
              <Text
                className={`text-lg font-bold ${
                  diagnostics.total > diagnostics.maxAllowed
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {diagnostics.total} / {diagnostics.maxAllowed}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <Calendar size={16} color="#8B5CF6" />
                <Text className="text-gray-600 ml-2">Citas</Text>
              </View>
              <Text className="font-semibold">
                {diagnostics.byType.appointments}
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <View className="flex-row items-center">
                <Pill size={16} color="#EC4899" />
                <Text className="text-gray-600 ml-2">Medicamentos</Text>
              </View>
              <Text className="font-semibold">
                {diagnostics.byType.medications}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <View className="flex-row items-center">
                <Dumbbell size={16} color="#10B981" />
                <Text className="text-gray-600 ml-2">Ejercicios</Text>
              </View>
              <Text className="font-semibold">
                {diagnostics.byType.exercises}
              </Text>
            </View>
          </View>
        </View>

        {/* Advertencia de límite excedido */}
        {diagnostics.total > diagnostics.maxAllowed && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-start">
              <AlertTriangle size={20} color="#EF4444" />
              <View className="flex-1 ml-3">
                <Text className="text-red-800 font-semibold mb-1">
                  ⚠️ Límite de notificaciones excedido
                </Text>
                <Text className="text-red-700 text-sm">
                  Tienes {diagnostics.total} notificaciones programadas, pero el
                  límite es {diagnostics.maxAllowed}.{"\n\n"}Las notificaciones
                  solo se programan para hoy y mañana. Si tienes demasiadas,
                  algunas pueden no mostrarse.
                  {"\n\n"}Considera reducir el número de medicamentos o
                  ejercicios activos.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Próxima Notificación */}
        {diagnostics.nextNotification && (
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-2">
              <Clock size={20} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                Próxima Notificación
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              {diagnostics.nextNotification.triggerDate
                ? formatDate(diagnostics.nextNotification.triggerDate)
                : "Desconocido"}
            </Text>
            <Text className="text-blue-100 text-sm">
              {diagnostics.nextNotification.notification.content.title}
            </Text>
            <Text className="text-blue-100 text-xs mt-1">
              {diagnostics.nextNotification.notification.content.body}
            </Text>
          </View>
        )}

        {/* Advertencias */}
        {diagnostics.total === 0 && (
          <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-start">
              <AlertTriangle size={20} color="#F59E0B" />
              <View className="flex-1 ml-3">
                <Text className="text-yellow-800 font-semibold mb-1">
                  Sin notificaciones programadas
                </Text>
                <Text className="text-yellow-700 text-sm">
                  No tienes notificaciones programadas. Esto puede ser porque:
                  {"\n"}• No has creado citas, medicamentos o ejercicios
                  {"\n"}• Todas las notificaciones están configuradas como
                  "Ninguna"
                  {"\n"}• Las fechas ya pasaron
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Información del sistema */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <Bell size={20} color="#3B82F6" />
            <View className="flex-1 ml-3">
              <Text className="text-blue-800 font-semibold mb-1">
                ℹ️ Sistema de notificaciones optimizado
              </Text>
              <Text className="text-blue-700 text-sm">
                Para respetar el límite de {diagnostics.maxAllowed}{" "}
                notificaciones:
                {"\n"}• Se programan solo para HOY
                {"\n"}• Las notificaciones se reprograman automáticamente cada
                noche a las 23:59
                {"\n"}• Esto asegura que siempre tengas recordatorios sin
                exceder el límite
              </Text>
            </View>
          </View>
        </View>

        {/* Información sobre Notificaciones Locales */}
        <View className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <Bell size={20} color="#6B7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-800 font-semibold mb-1">
                Sobre Notificaciones Locales
              </Text>
              <Text className="text-gray-700 text-sm">
                Las notificaciones locales se programan en TU dispositivo cuando
                abres la app. Si alguien más crea una cita, NO recibirás la
                notificación hasta que abras la app.
                {"\n\n"}
                💡 Consejo: Abre la app regularmente para actualizar las
                notificaciones.
              </Text>
            </View>
          </View>
        </View>

        {/* Acciones */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
          >
            <RefreshCw size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Actualizar Información
            </Text>
          </TouchableOpacity>

          {(diagnostics.byType.medications > 0 ||
            diagnostics.byType.exercises > 0) && (
            <TouchableOpacity
              onPress={handleCleanObsoleteNotifications}
              className="bg-orange-500 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
            >
              <RefreshCw size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Limpiar Notificaciones Obsoletas
              </Text>
            </TouchableOpacity>
          )}

          {diagnostics.total > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center shadow-sm"
            >
              <Trash2 size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Eliminar Todas las Notificaciones
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón para ver detalles técnicos */}
        <TouchableOpacity
          onPress={() => {
            console.log("📊 Diagnósticos completos:", diagnostics);
            Alert.alert(
              "Detalles técnicos",
              `Revisa la consola de desarrollo para ver todos los detalles.\n\nTotal: ${diagnostics.total}\nPermisos: ${diagnostics.permissionStatus}`
            );
          }}
          className="mt-4 p-3 border border-gray-300 rounded-xl"
        >
          <Text className="text-gray-600 text-center text-sm">
            Ver detalles técnicos en consola
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
