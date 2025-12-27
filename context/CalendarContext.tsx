import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationTime } from "../components/NotificationSelector";
import {
  scheduleAppointmentNotification,
  cancelAppointmentNotifications,
  requestNotificationPermissions,
} from "../utils/notificationService";

const APPOINTMENTS_STORAGE_KEY = "@appointments_data";

export type AppointmentType =
  | "control"
  | "radiografia"
  | "prequirurgico"
  | "operacion"
  | "fisiatra"
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
  addAppointment: (appointment: Omit<Appointment, "id">) => void;
  updateAppointment: (id: string, appointment: Omit<Appointment, "id">) => void;
  deleteAppointment: (id: string) => void;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDogId: (dogId: string) => Appointment[];
  getUpcomingAppointments: () => Appointment[];
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Solicitar permisos y cargar datos al iniciar
  useEffect(() => {
    requestNotificationPermissions();
    loadAppointments();
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (isLoaded) {
      saveAppointments();
    }
  }, [appointments, isLoaded]);

  const loadAppointments = async () => {
    try {
      const stored = await AsyncStorage.getItem(APPOINTMENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir fechas de string a Date
        const appointmentsWithDates = parsed.map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
        }));
        setAppointments(appointmentsWithDates);

        // Reprogramar notificaciones para citas futuras
        for (const apt of appointmentsWithDates) {
          const appointmentDate = new Date(apt.date);
          if (appointmentDate > new Date()) {
            const notificationId = await scheduleAppointmentNotification(
              apt.id,
              apt.date,
              apt.time,
              apt.dogName,
              appointmentTypeLabels[apt.type],
              apt.notificationTime
            );
            if (notificationId && notificationId !== apt.notificationId) {
              apt.notificationId = notificationId;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveAppointments = async () => {
    try {
      await AsyncStorage.setItem(
        APPOINTMENTS_STORAGE_KEY,
        JSON.stringify(appointments)
      );
    } catch (error) {
      console.error("Error saving appointments:", error);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, "id">) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
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
  };

  const updateAppointment = async (
    id: string,
    updatedAppointment: Omit<Appointment, "id">
  ) => {
    // Cancelar notificación anterior
    const existingAppointment = appointments.find((apt) => apt.id === id);
    if (existingAppointment?.notificationId) {
      await cancelAppointmentNotifications(existingAppointment.notificationId);
    }

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
  };

  const deleteAppointment = async (id: string) => {
    // Cancelar notificación
    const appointment = appointments.find((apt) => apt.id === id);
    if (appointment?.notificationId) {
      await cancelAppointmentNotifications(appointment.notificationId);
    }

    setAppointments(
      appointments.filter((appointment) => appointment.id !== id)
    );
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

  return (
    <CalendarContext.Provider
      value={{
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        getAppointmentById,
        getAppointmentsByDogId,
        getUpcomingAppointments,
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
  fisiatra: "Fisiatra",
  vacuna: "Vacuna",
  desparasitacion: "Desparasitación",
  otro: "Otro",
};

export const appointmentTypeColors: Record<AppointmentType, string> = {
  control: "bg-blue-100",
  radiografia: "bg-purple-100",
  prequirurgico: "bg-orange-100",
  operacion: "bg-red-100",
  fisiatra: "bg-green-100",
  vacuna: "bg-pink-100",
  desparasitacion: "bg-yellow-100",
  otro: "bg-gray-100",
};

export const appointmentTypeIcons: Record<AppointmentType, string> = {
  control: "🏥",
  radiografia: "📸",
  prequirurgico: "📋",
  operacion: "⚕️",
  fisiatra: "💪",
  vacuna: "💉",
  desparasitacion: "💊",
  otro: "📌",
};
