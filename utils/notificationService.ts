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

// LÍMITE MÁXIMO DE NOTIFICACIONES (iOS/Android)
const MAX_NOTIFICATIONS = 64;

// DÍAS MÁXIMOS PARA PROGRAMAR NOTIFICACIONES
const MAX_DAYS_AHEAD = 1; // Solo hoy (se reprograma cada noche a las 23:59)

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

// Verificar si una fecha está dentro del rango de programación (solo hoy)
function isWithinScheduleRange(date: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999); // Final del día en zona horaria local
  
  return date >= now && date <= endOfToday;
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

  // Solo programar si está dentro del rango (solo hoy)
  if (!isWithinScheduleRange(notificationDate)) {
    return null;
  }

  try {
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

    return notificationId;
  } catch (error) {
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


// Obtener información detallada de las notificaciones programadas
export async function getNotificationsDiagnostics() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const { status } = await Notifications.getPermissionsAsync();

    // Agrupar por tipo
    const byType = {
      appointments: scheduled.filter((n) => n.content.data?.appointmentId),
      exercises: scheduled.filter((n) => n.content.data?.exerciseId),
      medications: scheduled.filter((n) => n.content.data?.medicationId),
      other: scheduled.filter(
        (n) =>
          !n.content.data?.appointmentId &&
          !n.content.data?.exerciseId &&
          !n.content.data?.medicationId
      ),
    };

    // Encontrar la próxima notificación
    const now = Date.now();
    const upcoming = scheduled
      .map((n) => {
        let triggerDate: Date | null = null;
        if (n.trigger && "date" in n.trigger && n.trigger.date) {
          triggerDate = new Date(n.trigger.date);
        } else if (n.trigger && "hour" in n.trigger && "minute" in n.trigger) {
          const next = new Date();
          next.setHours(
            n.trigger.hour as number,
            n.trigger.minute as number,
            0,
            0
          );
          if (next.getTime() < now) {
            next.setDate(next.getDate() + 1);
          }
          triggerDate = next;
        }
        return { notification: n, triggerDate };
      })
      .filter((item) => item.triggerDate && item.triggerDate.getTime() > now)
      .sort((a, b) => {
        if (!a.triggerDate || !b.triggerDate) return 0;
        return a.triggerDate.getTime() - b.triggerDate.getTime();
      });

    return {
      total: scheduled.length,
      maxAllowed: MAX_NOTIFICATIONS,
      permissionStatus: status,
      byType: {
        appointments: byType.appointments.length,
        exercises: byType.exercises.length,
        medications: byType.medications.length,
        other: byType.other.length,
      },
      nextNotification: upcoming.length > 0 ? upcoming[0] : null,
      allScheduled: scheduled,
    };
  } catch (error) {
    console.error("Error al obtener diagnósticos:", error);
    return null;
  }
}


// Cancelar TODAS las notificaciones (útil para limpiar)
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error al cancelar todas las notificaciones:", error);
  }
}


// Programar notificaciones para ejercicios (solo hoy)
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Programar solo para hoy
  for (const scheduledTime of scheduledTimes) {
    try {
      const [hours, mins] = scheduledTime.split(":").map(Number);

      // Establecer la hora del ejercicio
      const exerciseDateTime = new Date(today);
      exerciseDateTime.setHours(hours, mins, 0, 0);

      // Calcular el momento de la notificación
      const notificationDate = new Date(
        exerciseDateTime.getTime() - minutes * 60 * 1000
      );

      // Solo programar si es en el futuro
      if (notificationDate > now) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `🐾 Hora de ejercicio: ${dogName}`,
            body: `${exerciseType} programado a las ${scheduledTime}`,
            data: { exerciseId, scheduledTime, date: today.toISOString() },
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
        `Error al programar notificación de ejercicio para ${scheduledTime}:`,
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


// Programar notificaciones para medicamentos (solo hoy)
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calcular fecha final del medicamento si tiene duración limitada
  let medicationEndDate: Date | null = null;
  if (durationDays > 0) {
    medicationEndDate = new Date(startDate);
    medicationEndDate.setDate(medicationEndDate.getDate() + durationDays);
    medicationEndDate.setHours(23, 59, 59, 999); // Incluir todo el último día
  }

  // Verificar que el medicamento esté activo hoy
  if (today < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) {
    return []; // Antes de la fecha de inicio
  }

  if (medicationEndDate && today > medicationEndDate) {
    return []; // Después de la fecha final
  }

  // Programar solo para hoy
  for (const scheduledTime of scheduledTimes) {
    try {
      const [hours, mins] = scheduledTime.split(":").map(Number);

      // Establecer la hora de la dosis
      const medicationDateTime = new Date(today);
      medicationDateTime.setHours(hours, mins, 0, 0);

      // Calcular el momento de la notificación
      const notificationDate = new Date(
        medicationDateTime.getTime() - minutes * 60 * 1000
      );

      // Solo programar si es en el futuro
      if (notificationDate > now) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 Medicamento: ${dogName}`,
            body: `${medicationName} - ${dosage} a las ${scheduledTime}`,
            data: {
              medicationId,
              scheduledTime,
              date: today.toISOString(),
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
        `Error al programar notificación de medicamento para ${scheduledTime}:`,
        error
      );
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


// Programar una tarea diaria para reprogramar notificaciones (ejecutar cada noche a las 23:59)
export async function scheduleDailyNotificationRefresh(): Promise<string | null> {
  try {
    // Cancelar cualquier tarea diaria anterior
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const dailyRefresh = allScheduled.find(
      (n) => n.content.data?.type === "daily-refresh"
    );
    if (dailyRefresh) {
      await Notifications.cancelScheduledNotificationAsync(
        dailyRefresh.identifier
      );
    }

    // Programar notificación silenciosa a las 23:59 para activar reprogramación
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Actualizando notificaciones",
        body: "Reprogramando recordatorios",
        data: { type: "daily-refresh" },
        sound: false, // Sin sonido
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 23,
        minute: 59,
        repeats: true, // Repetir diariamente
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Zona horaria local explícita
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Error al programar refresco diario:", error);
    return null;
  }
}

// Reprogramar todas las notificaciones de medicamentos y ejercicios
// Esta función debe llamarse:
// 1. Al iniciar la app
// 2. Cuando se reciba la notificación de refresco diario
// 3. Cuando el usuario agregue/edite medicamentos o ejercicios
export async function refreshAllRecurringNotifications(
  medications: Array<{
    id: string;
    dogName: string;
    medicationName: string;
    dosage: string;
    startDate: Date;
    startTime: string;
    scheduledTimes: string[];
    durationDays: number;
    notificationTime: NotificationTime;
  }>,
  exercises: Array<{
    id: string;
    dogName: string;
    exerciseType: string;
    scheduledTimes: string[];
    notificationTime: NotificationTime;
  }>
): Promise<void> {
  try {
    // Cancelar todas las notificaciones existentes de medicamentos y ejercicios
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    const medicationNotifications = allScheduled.filter(
      (n) => n.content.data?.medicationId
    );
    const exerciseNotifications = allScheduled.filter(
      (n) => n.content.data?.exerciseId
    );

    // Cancelar notificaciones antiguas
    for (const notification of [...medicationNotifications, ...exerciseNotifications]) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    // Reprogramar medicamentos
    for (const med of medications) {
      await scheduleMedicationNotifications(
        med.id,
        med.startDate,
        med.startTime,
        med.scheduledTimes,
        med.durationDays,
        med.dogName,
        med.medicationName,
        med.dosage,
        med.notificationTime
      );
    }

    // Reprogramar ejercicios
    for (const ex of exercises) {
      await scheduleExerciseNotifications(
        ex.id,
        ex.scheduledTimes,
        ex.dogName,
        ex.exerciseType,
        ex.notificationTime
      );
    }

    // Verificar límite de notificaciones
    const newScheduled = await Notifications.getAllScheduledNotificationsAsync();
    if (newScheduled.length > MAX_NOTIFICATIONS) {
      console.warn(
        `⚠️ ADVERTENCIA: ${newScheduled.length} notificaciones programadas exceden el límite de ${MAX_NOTIFICATIONS}`
      );
    }
  } catch (error) {
    console.error("Error al refrescar notificaciones recurrentes:", error);
  }
}

// Verificar y limpiar notificaciones obsoletas
// Retorna true si se necesita reprogramar
export async function checkAndCleanObsoleteNotifications(): Promise<boolean> {
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999); // Final del día en zona horaria local

    let needsRefresh = false;

    // Buscar notificaciones de medicamentos y ejercicios fuera del rango
    for (const notification of allScheduled) {
      if (!notification.content.data?.medicationId && !notification.content.data?.exerciseId) {
        continue; // No es de medicamento ni ejercicio
      }

      let triggerDate: Date | null = null;
      
      if (notification.trigger && "date" in notification.trigger && notification.trigger.date) {
        triggerDate = new Date(notification.trigger.date as number);
      }

      // Si la notificación está fuera del rango (no es de hoy) o ya pasó
      if (triggerDate && (triggerDate < now || triggerDate >= endOfToday)) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        needsRefresh = true;
      }
    }

    return needsRefresh;
  } catch (error) {
    console.error("Error al verificar notificaciones obsoletas:", error);
    return false;
  }
}
