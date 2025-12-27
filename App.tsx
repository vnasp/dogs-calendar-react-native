import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import LoadingScreen from "./screens/LoadingScreen";
import HomeScreen from "./screens/HomeScreen";
import DogsListScreen from "./screens/DogsListScreen";
import AddEditDogScreen from "./screens/AddEditDogScreen";
import CalendarListScreen from "./screens/CalendarListScreen";
import AddEditAppointmentScreen from "./screens/AddEditAppointmentScreen";
import { DogsProvider } from "./context/DogsContext";
import { CalendarProvider } from "./context/CalendarContext";
import "./global.css";

type Screen =
  | "loading"
  | "home"
  | "dogsList"
  | "addEditDog"
  | "calendar"
  | "addEditAppointment";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("loading");
  const [editingDogId, setEditingDogId] = useState<string | undefined>();
  const [editingAppointmentId, setEditingAppointmentId] = useState<
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
  const navigateToAddEditDog = (dogId?: string) => {
    setEditingDogId(dogId);
    setCurrentScreen("addEditDog");
  };
  const navigateToAddEditAppointment = (appointmentId?: string) => {
    setEditingAppointmentId(appointmentId);
    setCurrentScreen("addEditAppointment");
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
      default:
        return (
          <HomeScreen
            onNavigateToDogsList={navigateToDogsList}
            onNavigateToCalendar={navigateToCalendar}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <DogsProvider>
        <CalendarProvider>
          {renderScreen()}
          <StatusBar style="light" />
        </CalendarProvider>
      </DogsProvider>
    </SafeAreaProvider>
  );
}
