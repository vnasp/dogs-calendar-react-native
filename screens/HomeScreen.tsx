import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  UserPlus,
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

  // Usar useMemo para calcular la fecha de hoy (solo cambia una vez al día)
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  // Obtener citas de hoy con useMemo
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today;
      })
      .map((apt) => ({
        type: "appointment" as const,
        id: apt.id,
        dogName: apt.dogName,
        time: apt.time,
        data: apt,
      }));
  }, [appointments, today]);

  // Crear instancias individuales de medicamentos por horario (solo hoy)
  const todayMedicationInstances = useMemo(() => {
    return medications
      .filter((med) => med.isActive && med.durationDays > 0)
      .flatMap((med) =>
        med.scheduledTimes.map((time) => ({
          type: "medication" as const,
          id: `${med.id}-${time}`,
          dogName: med.dogName,
          time: time,
          medicationId: med.id,
          currentScheduledTime: time,
          data: med, // Referencia directa sin spread
        }))
      );
  }, [medications]);

  // Crear instancias individuales de ejercicios por horario (solo hoy)
  const todayExerciseInstances = useMemo(() => {
    return exercises
      .filter((ex) => ex.isActive)
      .flatMap((ex) =>
        ex.scheduledTimes.map((time) => ({
          type: "exercise" as const,
          id: `${ex.id}-${time}`,
          dogName: ex.dogName,
          time: time,
          exerciseId: ex.id,
          currentScheduledTime: time,
          data: ex, // Referencia directa sin spread
        }))
      );
  }, [exercises]);

  // Combinar todos los eventos y ordenarlos por hora con useMemo
  const allTodayEvents = useMemo(() => {
    const events = [
      ...todayAppointments,
      ...todayMedicationInstances,
      ...todayExerciseInstances,
    ].sort((a, b) => a.time.localeCompare(b.time));

    return events;
  }, [todayAppointments, todayMedicationInstances, todayExerciseInstances]);

  // Cargar completions de forma optimizada en paralelo con límite
  useEffect(() => {
    let cancelled = false;

    const loadCompletions = async () => {
      if (allTodayEvents.length === 0) {
        setCompletions({});
        return;
      }

      const startTime = performance.now();

      try {
        // Cargar en paralelo con Promise.all para mayor eficiencia
        const results = await Promise.all(
          allTodayEvents.map(async (event) => {
            try {
              let completion: Completion | null = null;
              let key: string = "";

              if (event.type === "appointment") {
                key = `appointment-${event.data.id}`;
                completion = await getAppointmentCompletions(event.data.id, "");
              } else if (event.type === "medication") {
                key = `medication-${event.medicationId}-${event.currentScheduledTime}`;
                completion = await getMedicationCompletions(
                  event.medicationId,
                  event.currentScheduledTime
                );
              } else if (event.type === "exercise") {
                key = `exercise-${event.exerciseId}-${event.currentScheduledTime}`;
                completion = await getExerciseCompletions(
                  event.exerciseId,
                  event.currentScheduledTime
                );
              }

              return { key, completion };
            } catch (error) {
              console.error("Error loading completion:", error);
              return null;
            }
          })
        );

        if (!cancelled) {
          const newCompletions: { [key: string]: Completion | null } = {};
          results.forEach((result) => {
            if (result) {
              newCompletions[result.key] = result.completion;
            }
          });

          setCompletions(newCompletions);
        }
      } catch (error) {
        console.error("❌ [HomeScreen] Error cargando completions:", error);
        if (!cancelled) {
          setCompletions({});
        }
      }
    };

    loadCompletions();

    return () => {
      cancelled = true;
    };
  }, [
    allTodayEvents.length,
    getAppointmentCompletions,
    getMedicationCompletions,
    getExerciseCompletions,
  ]);

  const handleCompleteAppointment = useCallback(
    async (id: string) => {
      await markAppointmentCompleted(id, "");
      const completion = await getAppointmentCompletions(id, "");
      setCompletions((prev) => ({
        ...prev,
        [`appointment-${id}`]: completion,
      }));
    },
    [markAppointmentCompleted, getAppointmentCompletions]
  );

  const handleCompleteMedication = useCallback(
    async (id: string, scheduledTime: string) => {
      await markMedicationCompleted(id, scheduledTime);
      const completion = await getMedicationCompletions(id, scheduledTime);
      setCompletions((prev) => ({
        ...prev,
        [`medication-${id}-${scheduledTime}`]: completion,
      }));
    },
    [markMedicationCompleted, getMedicationCompletions]
  );

  const handleCompleteExercise = useCallback(
    async (id: string, scheduledTime: string) => {
      await markExerciseCompleted(id, scheduledTime);
      const completion = await getExerciseCompletions(id, scheduledTime);
      setCompletions((prev) => ({
        ...prev,
        [`exercise-${id}-${scheduledTime}`]: completion,
      }));
    },
    [markExerciseCompleted, getExerciseCompletions]
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = new Date(date).getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    return `En ${diffDays} días`;
  };

  return (
    <SafeAreaView
      className="flex-1 bg-cyan-600"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="bg-cyan-600 pt-6 pb-6 px-6">
          <View className="flex-row items-center justify-between">
            <Logo />
            <TouchableOpacity
              onPress={onNavigateToSharedAccess}
              className="w-12 h-12 bg-cyan-700 rounded-xl items-center justify-center"
            >
              <UserPlus
                size={24}
                color="white"
                strokeWidth={2.5}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido con redondeado superior */}
        <View className="flex-1 bg-gray-50 rounded-t-3xl -mt-4">
          {/* Lista unificada de eventos de hoy */}
          {allTodayEvents.length > 0 && (
            <View className="px-6 mt-6 mb-6">
              <View className="flex-row items-center mb-3">
                <Calendar size={24} color="#1F2937" strokeWidth={2} />
                <Text className="text-gray-800 text-xl font-bold ml-2">
                  Hoy
                </Text>
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
                            <Calendar
                              size={24}
                              color="#16a34a"
                              strokeWidth={2}
                            />
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
                        `medication-${event.medicationId}-${event.currentScheduledTime}`
                      ];
                    // Ocultar si está completado
                    if (completion) return null;

                    return (
                      <SwipeableCard
                        key={`medication-${event.medicationId}-${event.currentScheduledTime}`}
                        onComplete={() =>
                          handleCompleteMedication(
                            event.medicationId,
                            event.currentScheduledTime
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
                              {event.data.dosage} • {event.currentScheduledTime}
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
                        `exercise-${event.exerciseId}-${event.currentScheduledTime}`
                      ];
                    // Ocultar si está completado
                    if (completion) return null;

                    return (
                      <SwipeableCard
                        key={`exercise-${event.exerciseId}-${event.currentScheduledTime}`}
                        onComplete={() =>
                          handleCompleteExercise(
                            event.exerciseId,
                            event.currentScheduledTime
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
                            <Dumbbell
                              size={24}
                              color="#14b8a6"
                              strokeWidth={2}
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 font-semibold mb-1">
                              {event.dogName} -{" "}
                              {exerciseTypeLabels[event.data.type]}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                              {event.data.durationMinutes} min •{" "}
                              {event.currentScheduledTime}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
