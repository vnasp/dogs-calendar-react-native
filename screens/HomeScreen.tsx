import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCalendar, appointmentTypeLabels } from "../context/CalendarContext";
import { useMedication, Completion } from "../context/MedicationContext";
import { useExercise, exerciseTypeLabels } from "../context/ExerciseContext";
import SwipeableCard from "../components/SwipeableCard";
import ExerciseIcon from "../components/ExerciseIcon";
import Logo from "../components/Logo";
import {
  Calendar,
  Pill,
  Users,
  Share2,
  Dumbbell,
  Sparkles,
} from "lucide-react-native";

interface HomeScreenProps {
  onNavigateToDogsList: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToExercises: () => void;
  onNavigateToMedications: () => void;
  onNavigateToSharedAccess: () => void;
}

export default function HomeScreen({
  onNavigateToDogsList,
  onNavigateToCalendar,
  onNavigateToExercises,
  onNavigateToMedications,
  onNavigateToSharedAccess,
}: HomeScreenProps) {
  const {
    appointments,
    markAppointmentCompleted,
    getTodayCompletions: getAppointmentCompletions,
  } = useCalendar();
  const {
    medications,
    markMedicationCompleted,
    getTodayCompletions: getMedicationCompletions,
  } = useMedication();
  const {
    exercises,
    markExerciseCompleted,
    getTodayCompletions: getExerciseCompletions,
  } = useExercise();

  const [completions, setCompletions] = useState<{
    [key: string]: Completion | null;
  }>({});

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Obtener citas de hoy
  const todayAppointments = appointments
    .filter((apt) => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    })
    .map((apt) => ({
      type: "appointment" as const,
      id: apt.id,
      dogName: apt.dogName,
      time: apt.time,
      data: apt,
    }));

  // Crear instancias individuales de medicamentos por horario (solo hoy)
  const todayMedicationInstances = medications
    .filter((med) => med.isActive && med.durationDays > 0)
    .flatMap((med) =>
      med.scheduledTimes.map((time) => ({
        type: "medication" as const,
        id: `${med.id}-${time}`,
        dogName: med.dogName,
        time: time,
        data: {
          ...med,
          currentScheduledTime: time,
        },
      }))
    );

  // Crear instancias individuales de ejercicios por horario (solo hoy)
  const todayExerciseInstances = exercises
    .filter((ex) => ex.isActive)
    .flatMap((ex) =>
      ex.scheduledTimes.map((time) => ({
        type: "exercise" as const,
        id: `${ex.id}-${time}`,
        dogName: ex.dogName,
        time: time,
        data: {
          ...ex,
          currentScheduledTime: time,
        },
      }))
    );

  // Combinar todos los eventos y ordenarlos por hora
  const allTodayEvents = [
    ...todayAppointments,
    ...todayMedicationInstances,
    ...todayExerciseInstances,
  ].sort((a, b) => a.time.localeCompare(b.time));

  // Cargar completions
  useEffect(() => {
    const loadCompletions = async () => {
      const newCompletions: { [key: string]: Completion | null } = {};

      for (const event of allTodayEvents) {
        if (event.type === "appointment") {
          const completion = await getAppointmentCompletions(event.data.id, "");
          newCompletions[`appointment-${event.data.id}`] = completion;
        } else if (event.type === "medication") {
          const completion = await getMedicationCompletions(
            event.data.id,
            event.data.currentScheduledTime
          );
          newCompletions[
            `medication-${event.data.id}-${event.data.currentScheduledTime}`
          ] = completion;
        } else if (event.type === "exercise") {
          const completion = await getExerciseCompletions(
            event.data.id,
            event.data.currentScheduledTime
          );
          newCompletions[
            `exercise-${event.data.id}-${event.data.currentScheduledTime}`
          ] = completion;
        }
      }

      setCompletions(newCompletions);
    };

    loadCompletions();
  }, [appointments, medications, exercises]);

  const handleCompleteAppointment = async (id: string) => {
    await markAppointmentCompleted(id, "");
    const completion = await getAppointmentCompletions(id, "");
    setCompletions({ ...completions, [`appointment-${id}`]: completion });
  };

  const handleCompleteMedication = async (
    id: string,
    scheduledTime: string
  ) => {
    await markMedicationCompleted(id, scheduledTime);
    const completion = await getMedicationCompletions(id, scheduledTime);
    setCompletions({
      ...completions,
      [`medication-${id}-${scheduledTime}`]: completion,
    });
  };

  const handleCompleteExercise = async (id: string, scheduledTime: string) => {
    await markExerciseCompleted(id, scheduledTime);
    const completion = await getExerciseCompletions(id, scheduledTime);
    setCompletions({
      ...completions,
      [`exercise-${id}-${scheduledTime}`]: completion,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
  };

  const getDaysUntil = (date: Date) => {
    const diffTime = new Date(date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    return `En ${diffDays} días`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 pb-20">
        {/* Header */}
        <View className="bg-cyan-600 pt-6 pb-10 px-6 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-6">
            <Logo />
            {/* Icono de acceso compartido */}
            <TouchableOpacity
              onPress={onNavigateToSharedAccess}
              className="w-12 h-12 bg-cyan-700 rounded-xl items-center justify-center"
            >
              <Users
                size={24}
                color="white"
                strokeWidth={2.5}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>
          <View className="bg-cyan-700 rounded-2xl p-4">
            <Text className="text-white text-lg font-semibold mb-1">
              ¡Bienvenido! 👋
            </Text>
            <Text className="text-cyan-50 text-sm">
              Mantén el bienestar de tus perritos al día
            </Text>
          </View>
        </View>

        {/* Lista unificada de eventos de hoy */}
        {allTodayEvents.length > 0 && (
          <View className="px-6 mt-6 mb-6">
            <View className="flex-row items-center mb-3">
              <Calendar size={24} color="#1F2937" strokeWidth={2} />
              <Text className="text-gray-800 text-xl font-bold ml-2">Hoy</Text>
            </View>
            <View className="gap-3">
              {allTodayEvents.map((event) => {
                if (event.type === "appointment") {
                  return (
                    <TouchableOpacity
                      key={`appointment-${event.id}`}
                      onPress={onNavigateToCalendar}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center mr-3">
                          <Calendar size={24} color="#16a34a" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold mb-1">
                            {event.dogName} -{" "}
                            {appointmentTypeLabels[event.data.type]}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {event.time}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                } else if (event.type === "medication") {
                  const completion =
                    completions[
                      `medication-${event.data.id}-${event.data.currentScheduledTime}`
                    ];
                  return (
                    <SwipeableCard
                      key={`medication-${event.data.id}-${event.data.currentScheduledTime}`}
                      onComplete={() =>
                        handleCompleteMedication(
                          event.data.id,
                          event.data.currentScheduledTime
                        )
                      }
                      isCompleted={!!completion}
                      completedBy={completion ? "Listo" : undefined}
                    >
                      <TouchableOpacity
                        onPress={onNavigateToMedications}
                        className="flex-row items-center"
                      >
                        <View className="w-12 h-12 bg-pink-100 rounded-xl items-center justify-center mr-3">
                          <Pill size={24} color="#db2777" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold mb-1">
                            {event.dogName} -{" "}
                            {event.data.name.charAt(0).toUpperCase() +
                              event.data.name.slice(1)}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {event.data.dosage} •{" "}
                            {event.data.currentScheduledTime}
                          </Text>
                          {event.data.scheduledTimes.length > 1 && (
                            <Text className="text-pink-500 text-xs mt-1">
                              {event.data.scheduledTimes.length}x al día
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </SwipeableCard>
                  );
                } else {
                  // exercise
                  const completion =
                    completions[
                      `exercise-${event.data.id}-${event.data.currentScheduledTime}`
                    ];
                  return (
                    <SwipeableCard
                      key={`exercise-${event.data.id}-${event.data.currentScheduledTime}`}
                      onComplete={() =>
                        handleCompleteExercise(
                          event.data.id,
                          event.data.currentScheduledTime
                        )
                      }
                      isCompleted={!!completion}
                      completedBy={completion ? "Listo" : undefined}
                    >
                      <TouchableOpacity
                        onPress={onNavigateToExercises}
                        className="flex-row items-center"
                      >
                        <View className="w-12 h-12 bg-teal-100 rounded-xl items-center justify-center mr-3">
                          <Dumbbell size={24} color="#14b8a6" strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold mb-1">
                            {event.dogName} -{" "}
                            {exerciseTypeLabels[event.data.type]}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {event.data.durationMinutes} min •{" "}
                            {event.data.currentScheduledTime}
                          </Text>
                          {event.data.scheduledTimes.length > 1 && (
                            <Text className="text-teal-500 text-xs mt-1">
                              {event.data.scheduledTimes.length}x al día
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </SwipeableCard>
                  );
                }
              })}
            </View>
          </View>
        )}

        {/* Mensaje si no hay eventos */}
        {allTodayEvents.length === 0 && (
          <View className="px-6 mt-20 items-center">
            <Sparkles size={80} color="#9CA3AF" strokeWidth={1.5} />
            <Text className="text-gray-500 text-lg text-center mb-2 mt-4">
              Todo tranquilo por ahora
            </Text>
            <Text className="text-gray-400 text-sm text-center">
              No hay eventos programados para hoy
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
