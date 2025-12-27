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
import {
  scheduleMedicationNotifications,
  cancelMedicationNotifications,
  requestNotificationPermissions,
} from "../utils/notificationService";

export interface Medication {
  id: string;
  dogId: string;
  dogName: string;
  name: string; // Nombre del medicamento
  dosage: string; // Dosis (ej: "150 mg" o "1 comprimido")
  frequencyHours: number; // Cada cuántas horas (8, 12, 24, etc.)
  durationDays: number; // Duración del tratamiento en días
  startDate: Date; // Fecha de inicio
  startTime: string; // Hora de inicio (HH:mm)
  scheduledTimes: string[]; // Horarios calculados del día
  endDate: Date; // Fecha de fin (calculada automáticamente)
  notes?: string;
  isActive: boolean;
  notificationTime: NotificationTime;
  notificationIds: string[];
}

interface MedicationContextType {
  medications: Medication[];
  loading: boolean;
  addMedication: (medication: Omit<Medication, "id">) => Promise<void>;
  updateMedication: (
    id: string,
    medication: Omit<Medication, "id">
  ) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  getMedicationById: (id: string) => Medication | undefined;
  getMedicationsByDogId: (dogId: string) => Medication[];
  getActiveMedications: () => Medication[];
  toggleMedicationActive: (id: string) => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(
  undefined
);

// Función para calcular horarios del día basado en frecuencia
export function calculateMedicationTimes(
  startTime: string,
  frequencyHours: number
): string[] {
  const times: string[] = [];
  const timesPerDay = Math.floor(24 / frequencyHours);

  const [startHour, startMinute] = startTime.split(":").map(Number);
  let currentMinutes = startHour * 60 + startMinute;

  for (let i = 0; i < timesPerDay; i++) {
    const hour = Math.floor(currentMinutes / 60) % 24;
    const minute = currentMinutes % 60;
    times.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    );
    currentMinutes += frequencyHours * 60;
  }

  return times;
}

// Función para calcular fecha de fin
export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

export function MedicationProvider({ children }: { children: ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Solicitar permisos y cargar datos al iniciar
  useEffect(() => {
    requestNotificationPermissions();
    if (user) {
      loadMedications();
    } else {
      setMedications([]);
      setLoading(false);
    }
  }, [user]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("medications")
        .select("*, dogs(name)")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const medicationsWithDates = await Promise.all(
        (data || []).map(async (med: any) => {
          const medication: Medication = {
            id: med.id,
            dogId: med.dog_id,
            dogName: med.dogs?.name || "",
            name: med.name,
            dosage: med.dosage,
            frequencyHours: med.frequency_hours,
            durationDays: med.duration_days,
            startDate: new Date(med.start_date),
            startTime: med.start_time,
            scheduledTimes: med.times || [],
            endDate: new Date(med.end_date),
            notes: med.notes,
            isActive: med.is_active,
            notificationTime: med.notification_time as NotificationTime,
            notificationIds: med.notification_ids || [],
          };

          // Reprogramar notificaciones para medicamentos activos
          if (medication.isActive && medication.endDate > new Date()) {
            const notificationIds = await scheduleMedicationNotifications(
              medication.id,
              medication.startDate,
              medication.startTime,
              medication.scheduledTimes,
              medication.durationDays,
              medication.dogName,
              medication.name,
              medication.dosage,
              medication.notificationTime
            );
            if (notificationIds.length > 0) {
              medication.notificationIds = notificationIds;
            }
          }

          return medication;
        })
      );

      setMedications(medicationsWithDates);
    } catch (error) {
      console.error("Error loading medications:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Omit<Medication, "id">) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { data, error } = await supabase
        .from("medications")
        .insert({
          user_id: user.id,
          dog_id: medication.dogId,
          name: medication.name,
          dosage: medication.dosage,
          frequency_hours: medication.frequencyHours,
          duration_days: medication.durationDays,
          start_date: medication.startDate.toISOString().split("T")[0],
          start_time: medication.startTime,
          times: medication.scheduledTimes,
          end_date: medication.endDate.toISOString().split("T")[0],
          notes: medication.notes,
          is_active: medication.isActive,
          notification_time: medication.notificationTime,
        })
        .select()
        .single();

      if (error) throw error;

      const newMedication: Medication = {
        id: data.id,
        dogId: data.dog_id,
        dogName: medication.dogName,
        name: data.name,
        dosage: data.dosage,
        frequencyHours: data.frequency_hours,
        durationDays: data.duration_days,
        startDate: new Date(data.start_date),
        startTime: data.start_time,
        scheduledTimes: data.times || [],
        endDate: new Date(data.end_date),
        notes: data.notes,
        isActive: data.is_active,
        notificationTime: data.notification_time as NotificationTime,
        notificationIds: [],
      };

      // Programar notificaciones para el tratamiento
      const notificationIds = await scheduleMedicationNotifications(
        newMedication.id,
        newMedication.startDate,
        newMedication.startTime,
        newMedication.scheduledTimes,
        newMedication.durationDays,
        newMedication.dogName,
        newMedication.name,
        newMedication.dosage,
        newMedication.notificationTime
      );

      if (notificationIds.length > 0) {
        newMedication.notificationIds = notificationIds;
        // Actualizar notification_ids en la base de datos
        await supabase
          .from("medications")
          .update({ notification_ids: notificationIds })
          .eq("id", newMedication.id);
      }

      setMedications([...medications, newMedication]);
    } catch (error) {
      console.error("Error adding medication:", error);
      throw error;
    }
  };

  const updateMedication = async (
    id: string,
    updatedMedication: Omit<Medication, "id">
  ) => {
    try {
      // Cancelar notificaciones anteriores
      const existingMedication = medications.find((med) => med.id === id);
      if (existingMedication) {
        await cancelMedicationNotifications(existingMedication.notificationIds);
      }

      const { error } = await supabase
        .from("medications")
        .update({
          dog_id: updatedMedication.dogId,
          name: updatedMedication.name,
          dosage: updatedMedication.dosage,
          frequency_hours: updatedMedication.frequencyHours,
          duration_days: updatedMedication.durationDays,
          start_date: updatedMedication.startDate.toISOString().split("T")[0],
          start_time: updatedMedication.startTime,
          times: updatedMedication.scheduledTimes,
          end_date: updatedMedication.endDate.toISOString().split("T")[0],
          notes: updatedMedication.notes,
          is_active: updatedMedication.isActive,
          notification_time: updatedMedication.notificationTime,
        })
        .eq("id", id);

      if (error) throw error;

      // Programar nuevas notificaciones
      const notificationIds = await scheduleMedicationNotifications(
        id,
        updatedMedication.startDate,
        updatedMedication.startTime,
        updatedMedication.scheduledTimes,
        updatedMedication.durationDays,
        updatedMedication.dogName,
        updatedMedication.name,
        updatedMedication.dosage,
        updatedMedication.notificationTime
      );

      if (notificationIds.length > 0) {
        // Actualizar notification_ids en la base de datos
        await supabase
          .from("medications")
          .update({ notification_ids: notificationIds })
          .eq("id", id);
      }

      setMedications(
        medications.map((medication) =>
          medication.id === id
            ? { ...updatedMedication, id, notificationIds }
            : medication
        )
      );
    } catch (error) {
      console.error("Error updating medication:", error);
      throw error;
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const medication = medications.find((med) => med.id === id);

      // Cancelar notificaciones
      if (medication) {
        await cancelMedicationNotifications(medication.notificationIds);
      }

      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMedications(medications.filter((medication) => medication.id !== id));
    } catch (error) {
      console.error("Error deleting medication:", error);
      throw error;
    }
  };

  const getMedicationById = (id: string) => {
    return medications.find((medication) => medication.id === id);
  };

  const getMedicationsByDogId = (dogId: string) => {
    return medications.filter((medication) => medication.dogId === dogId);
  };

  const getActiveMedications = () => {
    return medications.filter((medication) => {
      const now = new Date();
      return medication.isActive && medication.endDate >= now;
    });
  };

  const toggleMedicationActive = async (id: string) => {
    try {
      const medication = medications.find((med) => med.id === id);
      if (!medication) return;

      const newActiveState = !medication.isActive;

      const { error } = await supabase
        .from("medications")
        .update({ is_active: newActiveState })
        .eq("id", id);

      if (error) throw error;

      setMedications(
        medications.map((med) =>
          med.id === id ? { ...med, isActive: newActiveState } : med
        )
      );
    } catch (error) {
      console.error("Error toggling medication active:", error);
      throw error;
    }
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        loading,
        addMedication,
        updateMedication,
        deleteMedication,
        getMedicationById,
        getMedicationsByDogId,
        getActiveMedications,
        toggleMedicationActive,
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedication() {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error("useMedication must be used within a MedicationProvider");
  }
  return context;
}
