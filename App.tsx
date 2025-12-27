import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import LoadingScreen from "./screens/LoadingScreen";
import HomeScreen from "./screens/HomeScreen";
import DogsListScreen from "./screens/DogsListScreen";
import AddEditDogScreen from "./screens/AddEditDogScreen";
import CalendarListScreen from "./screens/CalendarListScreen";
import AddEditAppointmentScreen from "./screens/AddEditAppointmentScreen";
import ExercisesListScreen from "./screens/ExercisesListScreen";
import AddEditExerciseScreen from "./screens/AddEditExerciseScreen";
import { DogsProvider } from "./context/DogsContext";
import { CalendarProvider } from "./context/CalendarContext";
import { ExerciseProvider } from "./context/ExerciseContext";
import "./global.css";

type Screen =
  | "loading"
  | "home"
  | "dogsList"
  | "addEditDog"
  | "calendar"
  | "addEditAppointment"
  | "exercises"
  | "addEditExercise";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [editingDogId, setEditingDogId] = useState<string | undefined>();
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | undefined
  >();
  const [editingExerciseId, setEditingExerciseId] = useState<
    string | undefined
  >();

  useEffect(() => {
    // Simula el tiempo de carga
    const timer = setTimeout(() => {
      setCurrentScreen("home");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const navigateToHome = () => setCurrentScreen("home");
  const navigateToDogsList = () => setCurrentScreen("dogsList");
  const navigateToCalendar = () => setCurrentScreen("calendar");
  const navigateToExercises = () => setCurrentScreen("exercises");
  const navigateToAddEditDog = (dogId?: string) => {
    setEditingDogId(dogId);
    setCurrentScreen("addEditDog");
  };
  const navigateToAddEditAppointment = (appointmentId?: string) => {
    setEditingAppointmentId(appointmentId);
    setCurrentScreen("addEditAppointment");
  };
  const navigateToAddEditExercise = (exerciseId?: string) => {
    setEditingExerciseId(exerciseId);
    setCurrentScreen("addEditExercise");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "loading":
        return <LoadingScreen />;
      case "home":
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
            onNavigateToExercises={navigateToExercises}
          />
        );
      case "dogsList":
        return (
          <DogsListScreen
            onNavigateToAddEdit={navigateToAddEditDog}
            onNavigateBack={navigateToHome}
          />
        );
      case "addEditDog":
        return (
          <AddEditDogScreen
            dogId={editingDogId}
            onNavigateBack={navigateToDogsList}
          />
        );
      case "calendar":
        return (
          <CalendarListScreen
            onNavigateToAddEdit={navigateToAddEditAppointment}
            onNavigateBack={navigateToHome}
          />
        );
      case "addEditAppointment":
        return (
          <AddEditAppointmentScreen
            appointmentId={editingAppointmentId}
            onNavigateBack={navigateToCalendar}
          />
        );
      case "exercises":
        return (
          <ExercisesListScreen
            onNavigateToAddEdit={navigateToAddEditExercise}
            onNavigateBack={navigateToHome}
          />
        );
      case "addEditExercise":
        return (
          <AddEditExerciseScreen
            exerciseId={editingExerciseId}
            onNavigateBack={navigateToExercises}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
            onNavigateToExercises={navigateToExercises}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <DogsProvider>
        <CalendarProvider>
          <ExerciseProvider>
            {renderScreen()}
            <StatusBar style="light" />
          </ExerciseProvider>
        </CalendarProvider>
      </DogsProvider>
    </SafeAreaProvider>
  );
}
