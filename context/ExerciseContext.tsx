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
  scheduleExerciseNotifications,
  cancelExerciseNotifications,
  requestNotificationPermissions,
} from "../utils/notificationService";

export type ExerciseType =
  | "caminata"
  | "cavaletti"
  | "balanceo"
  | "slalom"
  | "entrenamiento"
  | "otro";

export interface Exercise {
  id: string;
  dogId: string;
  dogName: string;
  type: ExerciseType;
  customTypeDescription?: string; // Descripción personalizada cuando type es "otro"
  durationMinutes: number;
  timesPerDay: number;
  startTime: string; // HH:mm formato 24h
  endTime: string; // HH:mm formato 24h
  scheduledTimes: string[]; // Array de horarios calculados en formato HH:mm
  startDate: Date; // Fecha de inicio del tratamiento
  isPermanent: boolean; // Si es permanente o tiene duración limitada
  durationWeeks?: number; // Duración en semanas (solo si no es permanente)
  endDate?: Date; // Fecha de fin (calculada)
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
  markExerciseCompleted: (
    exerciseId: string,
    scheduledTime: string
  ) => Promise<void>;
  getTodayCompletions: (
    exerciseId: string,
    scheduledTime: string
  ) => Promise<Completion | null>;
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

      if (!user) {
        setExercises([]);
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
        setExercises([]);
        setLoading(false);
        return;
      }

      // Obtener ejercicios de esos perros
      const { data, error } = await supabase
        .from("exercises")
        .select("*, dogs(name)")
        .in("dog_id", dogIds)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const exercisesWithData = await Promise.all(
        (data || []).map(async (ex: any) => {
          const exercise: Exercise = {
            id: ex.id,
            dogId: ex.dog_id,
            dogName: ex.dogs?.name || "",
            type: ex.type as ExerciseType,
            customTypeDescription: ex.custom_type_description,
            durationMinutes: ex.duration_minutes,
            timesPerDay: ex.times_per_day,
            startTime: ex.start_time,
            endTime: ex.end_time,
            scheduledTimes: ex.scheduled_times || [],
            startDate: new Date(ex.start_date),
            isPermanent: ex.is_permanent,
            durationWeeks: ex.duration_weeks,
            endDate: ex.end_date ? new Date(ex.end_date) : undefined,
            notes: ex.notes,
            isActive: ex.is_active,
            notificationTime: ex.notification_time as NotificationTime,
            notificationIds: ex.notification_ids || [],
          };

          // Reprogramar notificaciones para ejercicios activos
          if (exercise.isActive) {
            const displayName = exercise.type === "otro" && exercise.customTypeDescription
              ? exercise.customTypeDescription
              : exerciseTypeLabels[exercise.type];
            const notificationIds = await scheduleExerciseNotifications(
              exercise.id,
              exercise.scheduledTimes,
              exercise.dogName,
              displayName,
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
          custom_type_description: exercise.customTypeDescription || null,
          title: exercise.type === "otro" && exercise.customTypeDescription
            ? exercise.customTypeDescription
            : exerciseTypeLabels[exercise.type],
          duration_minutes: exercise.durationMinutes,
          times_per_day: exercise.timesPerDay,
          start_time: exercise.startTime,
          end_time: exercise.endTime,
          scheduled_times: exercise.scheduledTimes,
          start_date: formatLocalDate(exercise.startDate),
          is_permanent: exercise.isPermanent,
          duration_weeks: exercise.durationWeeks,
          end_date: exercise.endDate ? formatLocalDate(exercise.endDate) : null,
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
        customTypeDescription: data.custom_type_description,
        durationMinutes: data.duration_minutes,
        timesPerDay: data.times_per_day,
        startTime: data.start_time,
        endTime: data.end_time,
        scheduledTimes: data.scheduled_times || [],
        startDate: new Date(data.start_date),
        isPermanent: data.is_permanent,
        durationWeeks: data.duration_weeks,
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        notes: data.notes,
        isActive: data.is_active,
        notificationTime: data.notification_time as NotificationTime,
        notificationIds: [],
      };

      // Programar notificaciones para cada horario
      const displayName = newExercise.type === "otro" && newExercise.customTypeDescription
        ? newExercise.customTypeDescription
        : exerciseTypeLabels[newExercise.type];
      const notificationIds = await scheduleExerciseNotifications(
        newExercise.id,
        newExercise.scheduledTimes,
        newExercise.dogName,
        displayName,
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
          custom_type_description: updatedExercise.customTypeDescription || null,
          title: updatedExercise.type === "otro" && updatedExercise.customTypeDescription
            ? updatedExercise.customTypeDescription
            : exerciseTypeLabels[updatedExercise.type],
          duration_minutes: updatedExercise.durationMinutes,
          times_per_day: updatedExercise.timesPerDay,
          start_time: updatedExercise.startTime,
          end_time: updatedExercise.endTime,
          scheduled_times: updatedExercise.scheduledTimes,
          start_date: formatLocalDate(updatedExercise.startDate),
          is_permanent: updatedExercise.isPermanent,
          duration_weeks: updatedExercise.durationWeeks,
          end_date: updatedExercise.endDate
            ? formatLocalDate(updatedExercise.endDate)
            : null,
          notes: updatedExercise.notes,
          is_active: updatedExercise.isActive,
          notification_time: updatedExercise.notificationTime,
        })
        .eq("id", id);

      if (error) throw error;

      // Programar nuevas notificaciones
      const displayName = updatedExercise.type === "otro" && updatedExercise.customTypeDescription
        ? updatedExercise.customTypeDescription
        : exerciseTypeLabels[updatedExercise.type];
      const notificationIds = await scheduleExerciseNotifications(
        id,
        updatedExercise.scheduledTimes,
        updatedExercise.dogName,
        displayName,
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

  const markExerciseCompleted = useCallback(
    async (exerciseId: string, scheduledTime: string) => {
      try {
        if (!user) throw new Error("No user authenticated");

        const { error } = await supabase.from("completions").insert({
          user_id: user.id,
          item_type: "exercise",
          item_id: exerciseId,
          scheduled_time: scheduledTime,
          completed_date: formatLocalDate(),
        });

        if (error) throw error;
        await loadExercises();
      } catch (error) {
        console.error("Error marking exercise as completed:", error);
        throw error;
      }
    },
    [user, loadExercises]
  );

  const getTodayCompletions = useCallback(
    async (
      exerciseId: string,
      scheduledTime: string
    ): Promise<Completion | null> => {
      try {
        const today = formatLocalDate();
        const { data, error } = await supabase
          .from("completions")
          .select("*")
          .eq("item_type", "exercise")
          .eq("item_id", exerciseId)
          .eq("scheduled_time", scheduledTime)
          .eq("completed_date", today)
          .single();

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
        markExerciseCompleted,
        getTodayCompletions,
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
  balanceo: "Balanceo",
  slalom: "Slalom",
  entrenamiento: "Entrenamiento",
  otro: "Otro",
};

export const exerciseTypeColors: Record<ExerciseType, string> = {
  caminata: "bg-blue-100",
  cavaletti: "bg-orange-100",
  balanceo: "bg-purple-100",
  slalom: "bg-green-100",
  entrenamiento: "bg-yellow-100",
  otro: "bg-gray-100",
};
