import * as Notifications from "expo-notifications";

// Script de prueba para notificaciones
export async function testNotifications() {
  // Solicitar permisos
  const { status } = await Notifications.requestPermissionsAsync();
  console.log("Estado permisos:", status);

  if (status !== "granted") {
    console.log("❌ Permisos denegados");
    return;
  }

  // Programar notificación de prueba en 5 segundos
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🐕 Prueba de Notificación",
      body: "Las notificaciones funcionan correctamente!",
      sound: true,
    },
    trigger: {
      seconds: 5,
    },
  });

  console.log("✅ Notificación programada:", notificationId);
  console.log("⏰ Llegará en 5 segundos");

  // Ver todas las notificaciones programadas
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log("📋 Notificaciones programadas:", scheduled.length);
}
