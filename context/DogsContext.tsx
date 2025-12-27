import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

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
  loading: boolean;
  addDog: (dog: Omit<Dog, "id">) => Promise<void>;
  updateDog: (id: string, dog: Omit<Dog, "id">) => Promise<void>;
  deleteDog: (id: string) => Promise<void>;
  getDogById: (id: string) => Dog | undefined;
}

const DogsContext = createContext<DogsContextType | undefined>(undefined);

export function DogsProvider({ children }: { children: ReactNode }) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Cargar perros cuando el usuario está autenticado
  useEffect(() => {
    if (user) {
      loadDogs();
    } else {
      setDogs([]);
      setLoading(false);
    }
  }, [user]);

  const loadDogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const dogsWithDates = (data || []).map((dog: any) => ({
        id: dog.id,
        name: dog.name,
        photo: dog.photo_uri,
        breed: dog.breed || "",
        birthDate: dog.birth_date ? new Date(dog.birth_date) : new Date(),
        gender: dog.gender || "male",
        isNeutered: dog.neutered || false,
      }));

      setDogs(dogsWithDates);
    } catch (error) {
      console.error("Error loading dogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDog = async (dog: Omit<Dog, "id">) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { data, error } = await supabase
        .from("dogs")
        .insert({
          user_id: user.id,
          name: dog.name,
          breed: dog.breed,
          birth_date: dog.birthDate.toISOString(),
          gender: dog.gender,
          neutered: dog.isNeutered,
          photo_uri: dog.photo,
        })
        .select()
        .single();

      if (error) throw error;

      const newDog: Dog = {
        id: data.id,
        name: data.name,
        photo: data.photo_uri,
        breed: data.breed || "",
        birthDate: new Date(data.birth_date),
        gender: data.gender,
        isNeutered: data.neutered,
      };

      setDogs([...dogs, newDog]);
    } catch (error) {
      console.error("Error adding dog:", error);
      throw error;
    }
  };

  const updateDog = async (id: string, updatedDog: Omit<Dog, "id">) => {
    try {
      const { error } = await supabase
        .from("dogs")
        .update({
          name: updatedDog.name,
          breed: updatedDog.breed,
          birth_date: updatedDog.birthDate.toISOString(),
          gender: updatedDog.gender,
          neutered: updatedDog.isNeutered,
          photo_uri: updatedDog.photo,
        })
        .eq("id", id);

      if (error) throw error;

      setDogs(dogs.map((dog) => (dog.id === id ? { ...updatedDog, id } : dog)));
    } catch (error) {
      console.error("Error updating dog:", error);
      throw error;
    }
  };

  const deleteDog = async (id: string) => {
    try {
      const { error } = await supabase.from("dogs").delete().eq("id", id);

      if (error) throw error;

      setDogs(dogs.filter((dog) => dog.id !== id));
    } catch (error) {
      console.error("Error deleting dog:", error);
      throw error;
    }
  };

  const getDogById = (id: string) => {
    return dogs.find((dog) => dog.id === id);
  };

  return (
    <DogsContext.Provider
      value={{ dogs, loading, addDog, updateDog, deleteDog, getDogById }}
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
