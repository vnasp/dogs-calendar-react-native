import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { NotificationTime } from "../components/NotificationSelector";
import {
  scheduleExerciseNotifications,
  cancelExerciseNotifications,
  requestNotificationPermissions,
} from "../utils/notificationService";

export type ExerciseType =
  | "caminata"
  | "cavaletti"
  | "natacion"
  | "carrera"
  | "juego"
  | "fisioterapia"
  | "otro";

export interface Exercise {
  id: string;
  dogId: string;
  dogName: string;
  type: ExerciseType;
  durationMinutes: number;
  timesPerDay: number;
  startTime: string; // HH:mm formato 24h
  endTime: string; // HH:mm formato 24h
  scheduledTimes: string[]; // Array de horarios calculados en formato HH:mm
  notes?: string;
  isActive: boolean;
  notificationTime: NotificationTime;
  notificationIds: string[]; // Un ID por cada horario programado
}

interface ExerciseContextType {
  exercises: Exercise[];
  addExercise: (exercise: Omit<Exercise, "id">) => void;
  updateExercise: (id: string, exercise: Omit<Exercise, "id">) => void;
  deleteExercise: (id: string) => void;
  getExerciseById: (id: string) => Exercise | undefined;
  getExercisesByDogId: (dogId: string) => Exercise[];
  toggleExerciseActive: (id: string) => void;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(
  undefined
);

// Función para calcular horarios distribuidos en el día
export function calculateScheduledTimes(
  startTime: string,
  endTime: string,
  timesPerDay: number
): string[] {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const totalMinutes = endMinutes - startMinutes;

  if (timesPerDay === 1) {
    // Si es solo una vez, programar a la mitad del rango
    const midMinutes = startMinutes + Math.floor(totalMinutes / 2);
    const hour = Math.floor(midMinutes / 60);
    const minute = midMinutes % 60;
    return [
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
    ];
  }

  const interval = totalMinutes / (timesPerDay - 1);
  const times: string[] = [];

  for (let i = 0; i < timesPerDay; i++) {
    const minutes = Math.round(startMinutes + interval * i);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    times.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    );
  }

  return times;
}

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Solicitar permisos de notificaciones al iniciar
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const addExercise = async (exercise: Omit<Exercise, "id">) => {
    const exerciseId = Date.now().toString();
    
    // Programar notificaciones para cada horario
    const notificationIds = await scheduleExerciseNotifications(
      exerciseId,
      exercise.scheduledTimes,
      exercise.dogName,
      exerciseTypeLabels[exercise.type],
      exercise.notificationTime
    );

    const newExercise: Exercise = {
      ...exercise,
      id: exerciseId,
      notificationIds,
    };
    setExercises([...exercises, newExercise]);
  };

  const updateExercise = async (
    id: string,
    updatedExercise: Omit<Exercise, "id">
  ) => {
    const existingExercise = exercises.find((ex) => ex.id === id);
    
    // Cancelar notificaciones anteriores
    if (existingExercise) {
      await cancelExerciseNotifications(existingExercise.notificationIds);
    }

    // Programar nuevas notificaciones
    const notificationIds = await scheduleExerciseNotifications(
      id,
      updatedExercise.scheduledTimes,
      updatedExercise.dogName,
      exerciseTypeLabels[updatedExercise.type],
      updatedExercise.notificationTime
    );

    setExercises(
      exercises.map((exercise) =>
        exercise.id === id
          ? { ...updatedExercise, id, notificationIds }
          : exercise
      )
    );
  };

  const deleteExercise = async (id: string) => {
    const exercise = exercises.find((ex) => ex.id === id);
    
    // Cancelar notificaciones
    if (exercise) {
      await cancelExerciseNotifications(exercise.notificationIds);
    }
    
    setExercises(exercises.filter((exercise) => exercise.id !== id));
  };

  const getExerciseById = (id: string) => {
    return exercises.find((exercise) => exercise.id === id);
  };

  const getExercisesByDogId = (dogId: string) => {
    return exercises.filter((exercise) => exercise.dogId === dogId);
  };

  const toggleExerciseActive = (id: string) => {
    setExercises(
      exercises.map((exercise) =>
        exercise.id === id
          ? { ...exercise, isActive: !exercise.isActive }
          : exercise
      )
    );
  };

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        addExercise,
        updateExercise,
        deleteExercise,
        getExerciseById,
        getExercisesByDogId,
        toggleExerciseActive,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error("useExercise must be used within a ExerciseProvider");
  }
  return context;
}

export const exerciseTypeLabels: Record<ExerciseType, string> = {
  caminata: "Caminata",
  cavaletti: "Cavaletti",
  natacion: "Natación",
  carrera: "Carrera",
  juego: "Juego",
  fisioterapia: "Fisioterapia",
  otro: "Otro",
};

export const exerciseTypeIcons: Record<ExerciseType, string> = {
  caminata: "🚶",
  cavaletti: "🏃",
  natacion: "🏊",
  carrera: "🏃‍♂️",
  juego: "🎾",
  fisioterapia: "💪",
  otro: "🔹",
};

export const exerciseTypeColors: Record<ExerciseType, string> = {
  caminata: "bg-blue-100",
  cavaletti: "bg-orange-100",
  natacion: "bg-cyan-100",
  carrera: "bg-red-100",
  juego: "bg-yellow-100",
  fisioterapia: "bg-purple-100",
  otro: "bg-gray-100",
};
