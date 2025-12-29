import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { NotificationTime } from "../components/NotificationSelector";

// Configuración de cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Solicitar permisos de notificaciones
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  // Configurar el canal de notificaciones para Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Recordatorios de Citas",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
    });
  }

  return true;
}

// Calcular los minutos antes de la cita basado en NotificationTime
function getMinutesFromNotificationTime(
  notificationTime: NotificationTime
): number | null {
  switch (notificationTime) {
    case "none":
      return null;
    case "15min":
      return 15;
    case "30min":
      return 30;
    case "1hour":
      return 60;
    case "2hours":
      return 120;
    case "1day":
      return 1440; // 24 * 60
    case "2days":
      return 2880; // 48 * 60
    case "1week":
      return 10080; // 7 * 24 * 60
    default:
      return null;
  }
}

// Programar una notificación para una cita
export async function scheduleAppointmentNotification(
  appointmentId: string,
  appointmentDate: Date,
  appointmentTime: string,
  dogName: string,
  appointmentType: string,
  notificationTime: NotificationTime
): Promise<string | null> {
  const minutes = getMinutesFromNotificationTime(notificationTime);

  if (minutes === null) {
    return null;
  }

  // Combinar fecha y hora en la zona horaria local
  const [hours, mins] = appointmentTime.split(":").map(Number);
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, mins, 0, 0);

  // Calcular el momento de la notificación
  const notificationDate = new Date(
    appointmentDateTime.getTime() - minutes * 60 * 1000
  );

  // Solo programar si es en el futuro
  const now = new Date();
  if (notificationDate <= now) {
    console.log(
      `⏰ No se programa notificación para ${appointmentType} - ${dogName}: la fecha ya pasó`,
      {
        notificationDate: notificationDate.toISOString(),
        now: now.toISOString(),
      }
    );
    return null;
  }

  try {
    console.log(
      `📅 Programando notificación para ${appointmentType} - ${dogName}:`,
      {
        appointmentDateTime: appointmentDateTime.toISOString(),
        notificationDate: notificationDate.toISOString(),
        minutesBefore: minutes,
      }
    );

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐕 Recordatorio: ${dogName}`,
        body: `${appointmentType} a las ${appointmentTime}`,
        data: { appointmentId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    console.log(`✅ Notificación programada con ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error("❌ Error al programar notificación:", error);
    return null;
  }
}

// Cancelar una notificación programada
export async function cancelNotification(
  notificationId: string
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error al cancelar notificación:", error);
  }
}

// Cancelar todas las notificaciones de una cita
export async function cancelAppointmentNotifications(
  notificationId?: string
): Promise<void> {
  if (notificationId) {
    await cancelNotification(notificationId);
  }
}

// Obtener todas las notificaciones programadas (útil para debug)
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Programar notificaciones para ejercicios (se repiten diariamente)
export async function scheduleExerciseNotifications(
  exerciseId: string,
  scheduledTimes: string[], // Array de horarios en formato HH:mm
  dogName: string,
  exerciseType: string,
  notificationTime: NotificationTime
): Promise<string[]> {
  const minutes = getMinutesFromNotificationTime(notificationTime);

  if (minutes === null || scheduledTimes.length === 0) {
    return [];
  }

  const notificationIds: string[] = [];

  for (const scheduledTime of scheduledTimes) {
    try {
      const [hours, mins] = scheduledTime.split(":").map(Number);

      // Calcular el momento de la notificación
      const now = new Date();
      const exerciseDateTime = new Date();
      exerciseDateTime.setHours(hours, mins, 0, 0);

      const notificationDate = new Date(
        exerciseDateTime.getTime() - minutes * 60 * 1000
      );

      // Si la hora ya pasó hoy, programar para mañana
      if (notificationDate <= now) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🐾 Hora de ejercicio: ${dogName}`,
          body: `${exerciseType} programado a las ${scheduledTime}`,
          data: { exerciseId, scheduledTime },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: notificationDate.getHours(),
          minute: notificationDate.getMinutes(),
          repeats: true, // Repetir diariamente
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Zona horaria local
        },
      });

      notificationIds.push(notificationId);
    } catch (error) {
      console.error(
        `Error al programar notificación para ${scheduledTime}:`,
        error
      );
    }
  }

  return notificationIds;
}

// Cancelar todas las notificaciones de un ejercicio
export async function cancelExerciseNotifications(
  notificationIds: string[]
): Promise<void> {
  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error al cancelar notificación de ejercicio:", error);
    }
  }
}

// Programar notificaciones para medicamentos (durante la duración del tratamiento)
export async function scheduleMedicationNotifications(
  medicationId: string,
  startDate: Date,
  startTime: string,
  scheduledTimes: string[], // Horarios del día en formato HH:mm
  durationDays: number,
  dogName: string,
  medicationName: string,
  dosage: string,
  notificationTime: NotificationTime
): Promise<string[]> {
  const minutes = getMinutesFromNotificationTime(notificationTime);

  if (minutes === null || scheduledTimes.length === 0) {
    return [];
  }

  const notificationIds: string[] = [];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  // Programar notificaciones para cada día del tratamiento
  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);

    for (const scheduledTime of scheduledTimes) {
      try {
        const [hours, mins] = scheduledTime.split(":").map(Number);

        // Establecer la hora de la dosis
        const medicationDateTime = new Date(currentDate);
        medicationDateTime.setHours(hours, mins, 0, 0);

        // Calcular el momento de la notificación
        const notificationDate = new Date(
          medicationDateTime.getTime() - minutes * 60 * 1000
        );

        // Solo programar si es en el futuro
        if (notificationDate > new Date()) {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: `💊 Medicamento: ${dogName}`,
              body: `${medicationName} - ${dosage} a las ${scheduledTime}`,
              data: {
                medicationId,
                scheduledTime,
                date: currentDate.toISOString(),
              },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notificationDate,
            },
          });

          notificationIds.push(notificationId);
        }
      } catch (error) {
        console.error(
          `Error al programar notificación de medicamento para día ${day}, hora ${scheduledTime}:`,
          error
        );
      }
    }
  }

  return notificationIds;
}

// Cancelar todas las notificaciones de un medicamento
export async function cancelMedicationNotifications(
  notificationIds: string[]
): Promise<void> {
  for (const notificationId of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error("Error al cancelar notificación de medicamento:", error);
    }
  }
}
