import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
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
  addMedication: (medication: Omit<Medication, "id">) => void;
  updateMedication: (id: string, medication: Omit<Medication, "id">) => void;
  deleteMedication: (id: string) => void;
  getMedicationById: (id: string) => Medication | undefined;
  getMedicationsByDogId: (dogId: string) => Medication[];
  getActiveMedications: () => Medication[];
  toggleMedicationActive: (id: string) => void;
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

  // Solicitar permisos de notificaciones al iniciar
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const addMedication = async (medication: Omit<Medication, "id">) => {
    const medicationId = Date.now().toString();

    // Programar notificaciones para el tratamiento
    const notificationIds = await scheduleMedicationNotifications(
      medicationId,
      medication.startDate,
      medication.startTime,
      medication.scheduledTimes,
      medication.durationDays,
      medication.dogName,
      medication.name,
      medication.dosage,
      medication.notificationTime
    );

    const newMedication: Medication = {
      ...medication,
      id: medicationId,
      notificationIds,
    };
    setMedications([...medications, newMedication]);
  };

  const updateMedication = async (
    id: string,
    updatedMedication: Omit<Medication, "id">
  ) => {
    const existingMedication = medications.find((med) => med.id === id);

    // Cancelar notificaciones anteriores
    if (existingMedication) {
      await cancelMedicationNotifications(existingMedication.notificationIds);
    }

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

    setMedications(
      medications.map((medication) =>
        medication.id === id
          ? { ...updatedMedication, id, notificationIds }
          : medication
      )
    );
  };

  const deleteMedication = async (id: string) => {
    const medication = medications.find((med) => med.id === id);

    // Cancelar notificaciones
    if (medication) {
      await cancelMedicationNotifications(medication.notificationIds);
    }

    setMedications(medications.filter((medication) => medication.id !== id));
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

  const toggleMedicationActive = (id: string) => {
    setMedications(
      medications.map((medication) =>
        medication.id === id
          ? { ...medication, isActive: !medication.isActive }
          : medication
      )
    );
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
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
