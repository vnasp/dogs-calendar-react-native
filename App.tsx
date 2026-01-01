import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { LogBox } from "react-native";

// Ocultar el LogBox para que no bloquee el footer
LogBox.ignoreAllLogs(true);

// Mantener el splash nativo visible hasta que la app esté lista
SplashScreen.preventAutoHideAsync();

import LoginScreen from "./screens/LoginScreen";
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
import SharedAccessScreen from "./screens/SharedAccessScreen";
import MealTimesSettingsScreen from "./screens/MealTimesSettingsScreen";
import Footer from "./components/Footer";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DogsProvider } from "./context/DogsContext";
import { CalendarProvider } from "./context/CalendarContext";
import { ExerciseProvider } from "./context/ExerciseContext";
import { MedicationProvider } from "./context/MedicationContext";
import { MealTimesProvider } from "./context/MealTimesContext";
import { SharedAccessProvider } from "./context/SharedAccessContext";
import "./global.css";

type Screen =
  | "login"
  | "home"
  | "dogsList"
  | "addEditDog"
  | "calendar"
  | "addEditAppointment"
  | "exercises"
  | "addEditExercise"
  | "medications"
  | "addEditMedication"
  | "medicalHistory"
  | "sharedAccess"
  | "mealTimesSettings";

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
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
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setCurrentScreen("home");
      } else {
        setCurrentScreen("login");
      }
      // Ocultar el splash nativo cuando la autenticación esté lista
      SplashScreen.hideAsync();
    }
  }, [user, authLoading]);

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

  const navigateToSharedAccess = () => setCurrentScreen("sharedAccess");
  const navigateToMealTimes = () => setCurrentScreen("mealTimesSettings");

  const renderScreen = () => {
    if (authLoading) {
      // Mientras carga, no renderizar nada (el splash nativo se mantiene visible)
      return null;
    }
    if (!user) {
      return <LoginScreen />;
    }

    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
            onNavigateToExercises={navigateToExercises}
            onNavigateToMedications={navigateToMedications}
            onNavigateToSharedAccess={navigateToSharedAccess}
          />
        );
      case "dogsList":
        return (
          <DogsListScreen
            onNavigateToAddEdit={navigateToAddEditDog}
            onNavigateBack={navigateToHome}
            onNavigateToMedicalHistory={navigateToMedicalHistory}
            onNavigateToMealTimes={navigateToMealTimes}
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
      case "sharedAccess":
        return (
          <SharedAccessScreen
            navigation={{
              navigate: navigateToHome,
              goBack: navigateToHome,
            }}
          />
        );
      case "mealTimesSettings":
        return (
          <MealTimesSettingsScreen
            onNavigateBack={() => setCurrentScreen("dogsList")}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
            onNavigateToExercises={navigateToExercises}
            onNavigateToMedications={navigateToMedications}
            onNavigateToSharedAccess={navigateToSharedAccess}
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
              <MealTimesProvider>
                <SharedAccessProvider>
                  {renderScreen()}
                  {user && (
                    <Footer
                      currentScreen={currentScreen}
                      onNavigateToHome={navigateToHome}
                      onNavigateToDogsList={navigateToDogsList}
                      onNavigateToCalendar={navigateToCalendar}
                      onNavigateToMedications={navigateToMedications}
                      onNavigateToExercises={navigateToExercises}
                    />
                  )}
                  <StatusBar style="light" backgroundColor="#0891b2" />
                </SharedAccessProvider>
              </MealTimesProvider>
            </MedicationProvider>
          </ExerciseProvider>
        </CalendarProvider>
      </DogsProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
