import React, { createContext, useContext, useState, ReactNode } from "react";
import { NotificationTime } from "../components/NotificationSelector";

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

  const addAppointment = (appointment: Omit<Appointment, "id">) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
    };
    setAppointments([...appointments, newAppointment]);
  };

  const updateAppointment = (
    id: string,
    updatedAppointment: Omit<Appointment, "id">
  ) => {
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === id ? { ...updatedAppointment, id } : appointment
      )
    );
  };

  const deleteAppointment = (id: string) => {
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
