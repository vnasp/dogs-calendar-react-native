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
import MedicationsListScreen from "./screens/MedicationsListScreen";
import AddEditMedicationScreen from "./screens/AddEditMedicationScreen";
import MedicalHistoryScreen from "./screens/MedicalHistoryScreen";
import Footer from "./components/Footer";
import { DogsProvider } from "./context/DogsContext";
import { CalendarProvider } from "./context/CalendarContext";
import { ExerciseProvider } from "./context/ExerciseContext";
import { MedicationProvider } from "./context/MedicationContext";
import "./global.css";

type Screen =
  | "loading"
  | "home"
  | "dogsList"
  | "addEditDog"
  | "calendar"
  | "addEditAppointment"
  | "exercises"
  | "addEditExercise"
  | "medications"
  | "addEditMedication"
  | "medicalHistory";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [editingDogId, setEditingDogId] = useState<string | undefined>();
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | undefined
  >();
  const [editingExerciseId, setEditingExerciseId] = useState<
    string | undefined
  >();
  const [editingMedicationId, setEditingMedicationId] = useState<
    string | undefined
  >();
  const [selectedDogId, setSelectedDogId] = useState<string | undefined>();

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
  const navigateToMedications = () => setCurrentScreen("medications");
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

  const navigateToAddEditMedication = (medicationId?: string) => {
    setEditingMedicationId(medicationId);
    setCurrentScreen("addEditMedication");
  };

  const navigateToMedicalHistory = (dogId: string) => {
    setSelectedDogId(dogId);
    setCurrentScreen("medicalHistory");
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
            onNavigateToMedications={navigateToMedications}
          />
        );
      case "dogsList":
        return (
          <DogsListScreen
            onNavigateToAddEdit={navigateToAddEditDog}
            onNavigateBack={navigateToHome}
            onNavigateToMedicalHistory={navigateToMedicalHistory}
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
      case "medications":
        return (
          <MedicationsListScreen
            onNavigateToAddEdit={navigateToAddEditMedication}
            onNavigateBack={navigateToHome}
          />
        );
      case "addEditMedication":
        return (
          <AddEditMedicationScreen
            medicationId={editingMedicationId}
            onNavigateBack={navigateToMedications}
          />
        );
      case "medicalHistory":
        return (
          <MedicalHistoryScreen
            dogId={selectedDogId!}
            onNavigateBack={navigateToDogsList}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
            onNavigateToExercises={navigateToExercises}
            onNavigateToMedications={navigateToMedications}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <DogsProvider>
        <CalendarProvider>
          <ExerciseProvider>
            <MedicationProvider>
              {renderScreen()}
              <Footer
                currentScreen={currentScreen}
                onNavigateToHome={navigateToHome}
                onNavigateToDogsList={navigateToDogsList}
                onNavigateToCalendar={navigateToCalendar}
                onNavigateToMedications={navigateToMedications}
                onNavigateToExercises={navigateToExercises}
              />
              <StatusBar style="light" />
            </MedicationProvider>
          </ExerciseProvider>
        </CalendarProvider>
      </DogsProvider>
    </SafeAreaProvider>
  );
}
