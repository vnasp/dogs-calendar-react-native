import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DOGS_STORAGE_KEY = "@dogs_data";

export interface Dog {
  id: string;
  name: string;
  photo?: string;
  breed: string;
  birthDate: Date;
  gender: "male" | "female";
  isNeutered: boolean;
}

interface DogsContextType {
  dogs: Dog[];
  addDog: (dog: Omit<Dog, "id">) => void;
  updateDog: (id: string, dog: Omit<Dog, "id">) => void;
  deleteDog: (id: string) => void;
  getDogById: (id: string) => Dog | undefined;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos al iniciar
  useEffect(() => {
    loadDogs();
  }, []);

  // Guardar datos cuando cambian (pero solo después de cargar)
  useEffect(() => {
    if (isLoaded) {
      saveDogs();
    }
  }, [dogs, isLoaded]);

  const loadDogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(DOGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir fechas de string a Date
        const dogsWithDates = parsed.map((dog: any) => ({
          ...dog,
          birthDate: new Date(dog.birthDate),
        }));
        setDogs(dogsWithDates);
      }
    } catch (error) {
      console.error("Error loading dogs:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveDogs = async () => {
    try {
      await AsyncStorage.setItem(DOGS_STORAGE_KEY, JSON.stringify(dogs));
    } catch (error) {
      console.error("Error saving dogs:", error);
    }
  };

  const addDog = (dog: Omit<Dog, "id">) => {
    const newDog: Dog = {
      ...dog,
      id: Date.now().toString(),
    };
    setDogs([...dogs, newDog]);
  };

  const updateDog = (id: string, updatedDog: Omit<Dog, "id">) => {
    setDogs(dogs.map((dog) => (dog.id === id ? { ...updatedDog, id } : dog)));
  };

  const deleteDog = (id: string) => {
    setDogs(dogs.filter((dog) => dog.id !== id));
  };

  const getDogById = (id: string) => {
    return dogs.find((dog) => dog.id === id);
  };

  return (
    <DogsContext.Provider
      value={{ dogs, addDog, updateDog, deleteDog, getDogById }}
    >
      {children}
    </DogsContext.Provider>
  );
}

export function useDogs() {
  const context = useContext(DogsContext);
  if (!context) {
    throw new Error("useDogs must be used within a DogsProvider");
  }
  return context;
}
