import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "../utils/supabase";
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
  | "radiografia"
  | "prequirurgico"
  | "operacion"
  | "fisioterapia"
  | "vacuna"
  | "desparasitacion"
  | "otro";

export interface Appointment {
  id: string;
  dogId: string;
  dogName: string;
  date: Date;
  time: string;
  type: AppointmentType;
  notes?: string;
  notificationTime: NotificationTime;
  notificationId?: string;
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

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select("*, dogs(name)")
        .order("date", { ascending: true });

      if (error) throw error;

      const appointmentsWithDates = await Promise.all(
        (data || []).map(async (apt: any) => {
          const appointment: Appointment = {
            id: apt.id,
            dogId: apt.dog_id,
            dogName: apt.dogs?.name || "",
            date: new Date(apt.date),
            time: apt.time,
            type: apt.type as AppointmentType,
            notes: apt.notes,
            notificationTime: apt.notification_time as NotificationTime,
          };

          // Reprogramar notificaciones para citas futuras
          const appointmentDate = new Date(apt.date);
          if (appointmentDate > new Date()) {
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

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          user_id: user.id,
          dog_id: appointment.dogId,
          type: appointment.type,
          title: appointmentTypeLabels[appointment.type],
          date: appointment.date.toISOString().split("T")[0],
          time: appointment.time,
          notes: appointment.notes,
          notification_time: appointment.notificationTime,
        })
        .select()
        .single();

      if (error) throw error;

      const newAppointment: Appointment = {
        id: data.id,
        dogId: data.dog_id,
        dogName: appointment.dogName,
        date: new Date(data.date),
        time: data.time,
        type: data.type as AppointmentType,
        notes: data.notes,
        notificationTime: data.notification_time as NotificationTime,
      };

      // Programar notificación
      const notificationId = await scheduleAppointmentNotification(
        newAppointment.id,
        newAppointment.date,
        newAppointment.time,
        newAppointment.dogName,
        appointmentTypeLabels[newAppointment.type],
        newAppointment.notificationTime
      );

      if (notificationId) {
        newAppointment.notificationId = notificationId;
      }

      setAppointments([...appointments, newAppointment]);
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

      const { error } = await supabase
        .from("appointments")
        .update({
          dog_id: updatedAppointment.dogId,
          type: updatedAppointment.type,
          title: appointmentTypeLabels[updatedAppointment.type],
          date: updatedAppointment.date.toISOString().split("T")[0],
          time: updatedAppointment.time,
          notes: updatedAppointment.notes,
          notification_time: updatedAppointment.notificationTime,
        })
        .eq("id", id);

      if (error) throw error;

      // Programar nueva notificación
      const notificationId = await scheduleAppointmentNotification(
        id,
        updatedAppointment.date,
        updatedAppointment.time,
        updatedAppointment.dogName,
        appointmentTypeLabels[updatedAppointment.type],
        updatedAppointment.notificationTime
      );

      const finalAppointment = {
        ...updatedAppointment,
        id,
        notificationId: notificationId || undefined,
      };

      setAppointments(
        appointments.map((appointment) =>
          appointment.id === id ? finalAppointment : appointment
        )
      );
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

  const markAppointmentCompleted = async (
    appointmentId: string,
    scheduledTime: string
  ) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { error } = await supabase.from("completions").insert({
        user_id: user.id,
        item_type: "appointment",
        item_id: appointmentId,
        scheduled_time: scheduledTime || null,
        completed_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error marking appointment completed:", error);
      throw error;
    }
  };

  const getTodayCompletions = async (
    appointmentId: string,
    scheduledTime: string
  ): Promise<Completion | null> => {
    try {
      const today = new Date().toISOString().split("T")[0];
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
  };

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
  radiografia: "Radiografía",
  prequirurgico: "Prequirúrgico",
  operacion: "Operación",
  fisioterapia: "Fisioterapia",
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  otro: "Otro",
};

export const appointmentTypeColors: Record<AppointmentType, string> = {
  control: "bg-blue-100",
  radiografia: "bg-purple-100",
  prequirurgico: "bg-orange-100",
  operacion: "bg-red-100",
  fisioterapia: "bg-green-100",
  vacuna: "bg-pink-100",
  desparasitacion: "bg-yellow-100",
  otro: "bg-gray-100",
};
