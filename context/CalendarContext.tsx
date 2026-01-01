import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { supabase, formatLocalDate } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { NotificationTime } from "../components/NotificationSelector";
import { Completion } from "./MedicationContext";
import {
  scheduleAppointmentNotification,
  cancelAppointmentNotifications,
  requestNotificationPermissions,
} from "../utils/notificationService";

export type AppointmentType =
  | "control"
  | "examenes"
  | "operacion"
  | "fisioterapia"
  | "vacuna"
  | "desparasitacion"
  | "otro";

export type RecurrencePattern =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "none";

export interface Appointment {
  id: string;
  dogId: string;
  dogName: string;
  date: Date;
  time: string;
  type: AppointmentType;
  customTypeDescription?: string; // Descripción personalizada cuando type es "otro"
  notes?: string;
  notificationTime: NotificationTime;
  notificationId?: string;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
  recurrenceParentId?: string; // ID de la cita padre si es una recurrencia
}

interface CalendarContextType {
  appointments: Appointment[];
  loading: boolean;
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (
    id: string,
    appointment: Omit<Appointment, "id">
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDogId: (dogId: string) => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  markAppointmentCompleted: (
    appointmentId: string,
    scheduledTime: string
  ) => Promise<void>;
  getTodayCompletions: (
    appointmentId: string,
    scheduledTime: string
  ) => Promise<Completion | null>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Solicitar permisos y cargar datos al iniciar
  useEffect(() => {
    requestNotificationPermissions();
    if (user) {
      loadAppointments();
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [user]);

  // Función helper para crear citas recurrentes
  const createRecurringAppointments = async (
    parentId: string,
    startDate: Date,
    endDate: Date,
    pattern: RecurrencePattern,
    appointmentData: {
      dogId: string;
      dogName: string;
      time: string;
      type: AppointmentType;
      customTypeDescription?: string;
      notes?: string;
      notificationTime: NotificationTime;
    }
  ) => {
    if (!user) return;

    const appointmentsToCreate = [];
    let currentDate = new Date(startDate);

    // Calcular el incremento según el patrón
    const getNextDate = (date: Date): Date => {
      const next = new Date(date);
      switch (pattern) {
        case "daily":
          next.setDate(next.getDate() + 1);
          break;
        case "weekly":
          next.setDate(next.getDate() + 7);
          break;
        case "biweekly":
          next.setDate(next.getDate() + 14);
          break;
        case "monthly":
          next.setMonth(next.getMonth() + 1);
          break;
      }
      return next;
    };

    // Generar todas las fechas de recurrencia
    currentDate = getNextDate(currentDate); // Empezar desde la siguiente ocurrencia
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      appointmentsToCreate.push({
        user_id: user.id,
        dog_id: appointmentData.dogId,
        type: appointmentData.type,
        title:
          appointmentData.customTypeDescription &&
          appointmentData.type === "otro"
            ? appointmentData.customTypeDescription
            : appointmentTypeLabels[appointmentData.type],
        date: dateString,
        time: appointmentData.time,
        notes: appointmentData.notes,
        notification_time: appointmentData.notificationTime,
        custom_type_description: appointmentData.customTypeDescription,
        recurrence_pattern: "none", // Las instancias recurrentes no se repiten
        recurrence_parent_id: parentId,
      });

      currentDate = getNextDate(currentDate);
    }

    // Insertar todas las citas recurrentes
    if (appointmentsToCreate.length > 0) {
      const { error } = await supabase
        .from("appointments")
        .insert(appointmentsToCreate);

      if (error) throw error;
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);

      if (!user) {
        setAppointments([]);
        return;
      }

      // Obtener IDs de usuarios que han compartido acceso conmigo
      const { data: sharedAccess, error: sharedError } = await supabase
        .from("shared_access")
        .select("owner_id")
        .eq("shared_with_email", user.email)
        .eq("status", "accepted");

      if (sharedError) throw sharedError;

      const sharedOwnerIds = (sharedAccess || []).map((s: any) => s.owner_id);
      const allUserIds = [user.id, ...sharedOwnerIds];

      // Obtener IDs de perros de todos los usuarios con acceso
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select("id")
        .in("user_id", allUserIds);

      if (dogsError) throw dogsError;

      const dogIds = (dogsData || []).map((d: any) => d.id);

      if (dogIds.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Obtener citas de esos perros
      const { data, error } = await supabase
        .from("appointments")
        .select("*, dogs(name)")
        .in("dog_id", dogIds)
        .order("date", { ascending: true });

      if (error) throw error;

      const appointmentsWithDates = await Promise.all(
        (data || []).map(async (apt: any) => {
          // Parsear la fecha en la zona horaria local
          // apt.date viene en formato YYYY-MM-DD desde Supabase
          const dateParts = apt.date.split("-");
          const appointmentDate = new Date(
            parseInt(dateParts[0]),
            parseInt(dateParts[1]) - 1,
            parseInt(dateParts[2])
          );

          // Parsear recurrence_end_date si existe
          let recurrenceEndDate: Date | undefined;
          if (apt.recurrence_end_date) {
            const endParts = apt.recurrence_end_date.split("-");
            recurrenceEndDate = new Date(
              parseInt(endParts[0]),
              parseInt(endParts[1]) - 1,
              parseInt(endParts[2])
            );
          }

          const appointment: Appointment = {
            id: apt.id,
            dogId: apt.dog_id,
            dogName: apt.dogs?.name || "",
            date: appointmentDate,
            time: apt.time,
            type: apt.type as AppointmentType,
            customTypeDescription: apt.custom_type_description,
            notes: apt.notes,
            notificationTime: apt.notification_time as NotificationTime,
            recurrencePattern:
              (apt.recurrence_pattern as RecurrencePattern) || "none",
            recurrenceEndDate,
            recurrenceParentId: apt.recurrence_parent_id,
          };

          // Reprogramar notificaciones para citas futuras
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const aptDateOnly = new Date(appointmentDate);
          aptDateOnly.setHours(0, 0, 0, 0);

          if (aptDateOnly >= today) {
            const notificationId = await scheduleAppointmentNotification(
              apt.id,
              appointment.date,
              appointment.time,
              appointment.dogName,
              appointmentTypeLabels[appointment.type],
              appointment.notificationTime
            );
            if (notificationId) {
              appointment.notificationId = notificationId;
            }
          }

          return appointment;
        })
      );

      setAppointments(appointmentsWithDates);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    try {
      if (!user) throw new Error("No user authenticated");

      // Formatear la fecha para guardar en la BD (YYYY-MM-DD en zona horaria local)
      const year = appointment.date.getFullYear();
      const month = String(appointment.date.getMonth() + 1).padStart(2, "0");
      const day = String(appointment.date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Formatear recurrence_end_date si existe
      let recurrenceEndDateString: string | undefined;
      if (appointment.recurrenceEndDate) {
        const endYear = appointment.recurrenceEndDate.getFullYear();
        const endMonth = String(
          appointment.recurrenceEndDate.getMonth() + 1
        ).padStart(2, "0");
        const endDay = String(appointment.recurrenceEndDate.getDate()).padStart(
          2,
          "0"
        );
        recurrenceEndDateString = `${endYear}-${endMonth}-${endDay}`;
      }

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          dog_id: appointment.dogId,
          type: appointment.type,
          title:
            appointment.customTypeDescription && appointment.type === "otro"
              ? appointment.customTypeDescription
              : appointmentTypeLabels[appointment.type],
          date: dateString,
          time: appointment.time,
          notes: appointment.notes,
          notification_time: appointment.notificationTime,
          custom_type_description: appointment.customTypeDescription,
          recurrence_pattern: appointment.recurrencePattern || "none",
          recurrence_end_date: recurrenceEndDateString,
          recurrence_parent_id: appointment.recurrenceParentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Si es una cita recurrente, crear las instancias futuras
      if (
        appointment.recurrencePattern &&
        appointment.recurrencePattern !== "none" &&
        appointment.recurrenceEndDate
      ) {
        await createRecurringAppointments(
          data.id,
          appointment.date,
          appointment.recurrenceEndDate,
          appointment.recurrencePattern,
          {
            dogId: appointment.dogId,
            dogName: appointment.dogName,
            time: appointment.time,
            type: appointment.type,
            customTypeDescription: appointment.customTypeDescription,
            notes: appointment.notes,
            notificationTime: appointment.notificationTime,
          }
        );
      }

      // Recargar todas las citas para incluir las recurrentes
      await loadAppointments();
    } catch (error) {
      console.error("Error adding appointment:", error);
      throw error;
    }
  };

  const updateAppointment = async (
    id: string,
    updatedAppointment: Omit<Appointment, "id">
  ) => {
    try {
      // Cancelar notificación anterior
      const existingAppointment = appointments.find((apt) => apt.id === id);
      if (existingAppointment?.notificationId) {
        await cancelAppointmentNotifications(
          existingAppointment.notificationId
        );
      }

      // Formatear la fecha para guardar en la BD (YYYY-MM-DD en zona horaria local)
      const year = updatedAppointment.date.getFullYear();
      const month = String(updatedAppointment.date.getMonth() + 1).padStart(
        2,
        "0"
      );
      const day = String(updatedAppointment.date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Formatear recurrence_end_date si existe
      let recurrenceEndDateString: string | undefined;
      if (updatedAppointment.recurrenceEndDate) {
        const endYear = updatedAppointment.recurrenceEndDate.getFullYear();
        const endMonth = String(
          updatedAppointment.recurrenceEndDate.getMonth() + 1
        ).padStart(2, "0");
        const endDay = String(
          updatedAppointment.recurrenceEndDate.getDate()
        ).padStart(2, "0");
        recurrenceEndDateString = `${endYear}-${endMonth}-${endDay}`;
      }

      const { error } = await supabase
        .from("appointments")
        .update({
          dog_id: updatedAppointment.dogId,
          type: updatedAppointment.type,
          title:
            updatedAppointment.customTypeDescription &&
            updatedAppointment.type === "otro"
              ? updatedAppointment.customTypeDescription
              : appointmentTypeLabels[updatedAppointment.type],
          date: dateString,
          time: updatedAppointment.time,
          notes: updatedAppointment.notes,
          notification_time: updatedAppointment.notificationTime,
          custom_type_description: updatedAppointment.customTypeDescription,
          recurrence_pattern: updatedAppointment.recurrencePattern || "none",
          recurrence_end_date: recurrenceEndDateString,
        })
        .eq("id", id);

      if (error) throw error;

      // Si cambió la recurrencia, eliminar las citas recurrentes anteriores y crear nuevas
      if (existingAppointment && !existingAppointment.recurrenceParentId) {
        // Solo si es una cita padre (no una instancia recurrente)
        // Eliminar citas recurrentes hijas anteriores
        await supabase
          .from("appointments")
          .delete()
          .eq("recurrence_parent_id", id);

        // Crear nuevas citas recurrentes si aplica
        if (
          updatedAppointment.recurrencePattern &&
          updatedAppointment.recurrencePattern !== "none" &&
          updatedAppointment.recurrenceEndDate
        ) {
          await createRecurringAppointments(
            id,
            updatedAppointment.date,
            updatedAppointment.recurrenceEndDate,
            updatedAppointment.recurrencePattern,
            {
              dogId: updatedAppointment.dogId,
              dogName: updatedAppointment.dogName,
              time: updatedAppointment.time,
              type: updatedAppointment.type,
              customTypeDescription: updatedAppointment.customTypeDescription,
              notes: updatedAppointment.notes,
              notificationTime: updatedAppointment.notificationTime,
            }
          );
        }
      }

      // Recargar todas las citas
      await loadAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      // Cancelar notificación
      const appointment = appointments.find((apt) => apt.id === id);
      if (appointment?.notificationId) {
        await cancelAppointmentNotifications(appointment.notificationId);
      }

      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAppointments(
        appointments.filter((appointment) => appointment.id !== id)
      );
    } catch (error) {
      console.error("Error deleting appointment:", error);
      throw error;
    }
  };

  const getAppointmentById = (id: string) => {
    return appointments.find((appointment) => appointment.id === id);
  };

  const getAppointmentsByDogId = (dogId: string) => {
    return appointments.filter((appointment) => appointment.dogId === dogId);
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter((appointment) => new Date(appointment.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const markAppointmentCompleted = useCallback(
    async (appointmentId: string, scheduledTime: string) => {
      try {
        if (!user) throw new Error("No user authenticated");

        const { error } = await supabase.from("completions").insert({
          user_id: user.id,
          item_type: "appointment",
          item_id: appointmentId,
          scheduled_time: scheduledTime || null,
          completed_date: formatLocalDate(),
        });

        if (error) throw error;
        await loadAppointments();
      } catch (error) {
        console.error("Error marking appointment as completed:", error);
        throw error;
      }
    },
    [user, loadAppointments]
  );

  const getTodayCompletions = useCallback(
    async (
      appointmentId: string,
      scheduledTime: string
    ): Promise<Completion | null> => {
      try {
        const today = formatLocalDate();
        const query = supabase
          .from("completions")
          .select("*")
          .eq("item_type", "appointment")
          .eq("item_id", appointmentId)
          .eq("completed_date", today);

        // Para appointments, scheduled_time puede ser null
        if (scheduledTime) {
          query.eq("scheduled_time", scheduledTime);
        } else {
          query.is("scheduled_time", null);
        }

        const { data, error } = await query.single();

        if (error && error.code !== "PGRST116") throw error;
        if (!data) return null;

        return {
          id: data.id,
          userId: data.user_id,
          itemType: data.item_type,
          itemId: data.item_id,
          scheduledTime: data.scheduled_time,
          completedDate: data.completed_date,
          completedAt: new Date(data.completed_at),
        };
      } catch (error) {
        console.error("Error getting completions:", error);
        return null;
      }
    },
    []
  );

  return (
    <CalendarContext.Provider
      value={{
        appointments,
        loading,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointmentById,
        getAppointmentsByDogId,
        getUpcomingAppointments,
        markAppointmentCompleted,
        getTodayCompletions,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  control: "Control",
  examenes: "Exámenes",
  operacion: "Operación",
  fisioterapia: "Fisioterapia",
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  otro: "Otro",
};

export const appointmentTypeColors: Record<AppointmentType, string> = {
  control: "bg-blue-100",
  examenes: "bg-purple-100",
  operacion: "bg-red-100",
  fisioterapia: "bg-green-100",
  vacuna: "bg-pink-100",
  desparasitacion: "bg-yellow-100",
  otro: "bg-gray-100",
};

export const appointmentTypeIcons: Record<AppointmentType, string> = {
  control: "🩺",
  examenes: "📋",
  operacion: "🏥",
  fisioterapia: "💪",
  vacuna: "💉",
  desparasitacion: "💊",
  otro: "📝",
};

export const recurrenceLabels: Record<RecurrencePattern, string> = {
  none: "No repetir",
  daily: "Cada día",
  weekly: "Cada semana",
  biweekly: "Cada 2 semanas",
  monthly: "Cada mes",
};
