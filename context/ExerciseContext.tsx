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
  loading: boolean;
  addExercise: (exercise: Omit<Exercise, "id">) => Promise<void>;
  updateExercise: (id: string, exercise: Omit<Exercise, "id">) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  getExercisesByDogId: (dogId: string) => Exercise[];
  toggleExerciseActive: (id: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Solicitar permisos y cargar datos al iniciar
  useEffect(() => {
    requestNotificationPermissions();
    if (user) {
      loadExercises();
    } else {
      setExercises([]);
      setLoading(false);
    }
  }, [user]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exercises")
        .select("*, dogs(name)")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const exercisesWithData = await Promise.all(
        (data || []).map(async (ex: any) => {
          const exercise: Exercise = {
            id: ex.id,
            dogId: ex.dog_id,
            dogName: ex.dogs?.name || "",
            type: ex.type as ExerciseType,
            durationMinutes: ex.duration_minutes,
            timesPerDay: ex.times_per_day,
            startTime: ex.start_time,
            endTime: ex.end_time,
            scheduledTimes: ex.scheduled_times || [],
            notes: ex.notes,
            isActive: ex.is_active,
            notificationTime: ex.notification_time as NotificationTime,
            notificationIds: ex.notification_ids || [],
          };

          // Reprogramar notificaciones para ejercicios activos
          if (exercise.isActive) {
            const notificationIds = await scheduleExerciseNotifications(
              exercise.id,
              exercise.scheduledTimes,
              exercise.dogName,
              exerciseTypeLabels[exercise.type],
              exercise.notificationTime
            );
            if (notificationIds.length > 0) {
              exercise.notificationIds = notificationIds;
            }
          }

          return exercise;
        })
      );

      setExercises(exercisesWithData);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = async (exercise: Omit<Exercise, "id">) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          user_id: user.id,
          dog_id: exercise.dogId,
          type: exercise.type,
          duration_minutes: exercise.durationMinutes,
          times_per_day: exercise.timesPerDay,
          start_time: exercise.startTime,
          end_time: exercise.endTime,
          scheduled_times: exercise.scheduledTimes,
          notes: exercise.notes,
          is_active: exercise.isActive,
          notification_time: exercise.notificationTime,
        })
        .select()
        .single();

      if (error) throw error;

      const newExercise: Exercise = {
        id: data.id,
        dogId: data.dog_id,
        dogName: exercise.dogName,
        type: data.type as ExerciseType,
        durationMinutes: data.duration_minutes,
        timesPerDay: data.times_per_day,
        startTime: data.start_time,
        endTime: data.end_time,
        scheduledTimes: data.scheduled_times || [],
        notes: data.notes,
        isActive: data.is_active,
        notificationTime: data.notification_time as NotificationTime,
        notificationIds: [],
      };

      // Programar notificaciones para cada horario
      const notificationIds = await scheduleExerciseNotifications(
        newExercise.id,
        newExercise.scheduledTimes,
        newExercise.dogName,
        exerciseTypeLabels[newExercise.type],
        newExercise.notificationTime
      );

      if (notificationIds.length > 0) {
        newExercise.notificationIds = notificationIds;
        // Actualizar notification_ids en la base de datos
        await supabase
          .from("exercises")
          .update({ notification_ids: notificationIds })
          .eq("id", newExercise.id);
      }

      setExercises([...exercises, newExercise]);
    } catch (error) {
      console.error("Error adding exercise:", error);
      throw error;
    }
  };

  const updateExercise = async (
    id: string,
    updatedExercise: Omit<Exercise, "id">
  ) => {
    try {
      // Cancelar notificaciones anteriores
      const existingExercise = exercises.find((ex) => ex.id === id);
      if (existingExercise) {
        await cancelExerciseNotifications(existingExercise.notificationIds);
      }

      const { error } = await supabase
        .from("exercises")
        .update({
          dog_id: updatedExercise.dogId,
          type: updatedExercise.type,
          duration_minutes: updatedExercise.durationMinutes,
          times_per_day: updatedExercise.timesPerDay,
          start_time: updatedExercise.startTime,
          end_time: updatedExercise.endTime,
          scheduled_times: updatedExercise.scheduledTimes,
          notes: updatedExercise.notes,
          is_active: updatedExercise.isActive,
          notification_time: updatedExercise.notificationTime,
        })
        .eq("id", id);

      if (error) throw error;

      // Programar nuevas notificaciones
      const notificationIds = await scheduleExerciseNotifications(
        id,
        updatedExercise.scheduledTimes,
        updatedExercise.dogName,
        exerciseTypeLabels[updatedExercise.type],
        updatedExercise.notificationTime
      );

      if (notificationIds.length > 0) {
        // Actualizar notification_ids en la base de datos
        await supabase
          .from("exercises")
          .update({ notification_ids: notificationIds })
          .eq("id", id);
      }

      setExercises(
        exercises.map((exercise) =>
          exercise.id === id
            ? { ...updatedExercise, id, notificationIds }
            : exercise
        )
      );
    } catch (error) {
      console.error("Error updating exercise:", error);
      throw error;
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      const exercise = exercises.find((ex) => ex.id === id);

      // Cancelar notificaciones
      if (exercise) {
        await cancelExerciseNotifications(exercise.notificationIds);
      }

      const { error } = await supabase.from("exercises").delete().eq("id", id);

      if (error) throw error;

      setExercises(exercises.filter((exercise) => exercise.id !== id));
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  };

  const getExerciseById = (id: string) => {
    return exercises.find((exercise) => exercise.id === id);
  };

  const getExercisesByDogId = (dogId: string) => {
    return exercises.filter((exercise) => exercise.dogId === dogId);
  };

  const toggleExerciseActive = async (id: string) => {
    try {
      const exercise = exercises.find((ex) => ex.id === id);
      if (!exercise) return;

      const newActiveState = !exercise.isActive;

      const { error } = await supabase
        .from("exercises")
        .update({ is_active: newActiveState })
        .eq("id", id);

      if (error) throw error;

      setExercises(
        exercises.map((ex) =>
          ex.id === id ? { ...ex, isActive: newActiveState } : ex
        )
      );
    } catch (error) {
      console.error("Error toggling exercise active:", error);
      throw error;
    }
  };

  return (
    <ExerciseContext.Provider
      value={{
        exercises,
        loading,
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
