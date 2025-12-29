import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import {
  uploadDogPhoto,
  deleteDogPhoto,
  replaceDogPhoto,
} from "../utils/storageService";

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

      if (!user) {
        setDogs([]);
        return;
      }

      // Obtener IDs de usuarios que han compartido acceso conmigo (accepted)
      const { data: sharedAccess, error: sharedError } = await supabase
        .from("shared_access")
        .select("owner_id")
        .eq("shared_with_email", user.email)
        .eq("status", "accepted");

      if (sharedError) throw sharedError;

      const sharedOwnerIds = (sharedAccess || []).map((s: any) => s.owner_id);

      // Obtener mis perros + perros compartidos conmigo
      let query = supabase.from("dogs").select("*");

      if (sharedOwnerIds.length > 0) {
        query = query.or(
          `user_id.eq.${user.id},user_id.in.(${sharedOwnerIds.join(",")})`
        );
      } else {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: true,
      });

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

      // Subir foto a Supabase Storage si existe
      let photoUrl = dog.photo;

      if (dog.photo && !dog.photo.startsWith("http")) {
        photoUrl = await uploadDogPhoto(dog.photo, user.id);
      }

      const { data, error } = await supabase
        .from("dogs")
        .insert({
          user_id: user.id,
          name: dog.name,
          breed: dog.breed,
          birth_date: dog.birthDate.toISOString(),
          gender: dog.gender,
          neutered: dog.isNeutered,
          photo_uri: photoUrl,
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
      if (!user) throw new Error("No user authenticated");

      const existingDog = getDogById(id);
      let photoUrl = updatedDog.photo;

      // Si la foto cambió y es una URI local, subirla
      if (
        updatedDog.photo &&
        !updatedDog.photo.startsWith("http") &&
        updatedDog.photo !== existingDog?.photo
      ) {
        photoUrl = await replaceDogPhoto(
          existingDog?.photo,
          updatedDog.photo,
          user.id
        );
      }

      const { error } = await supabase
        .from("dogs")
        .update({
          name: updatedDog.name,
          breed: updatedDog.breed,
          birth_date: updatedDog.birthDate.toISOString(),
          gender: updatedDog.gender,
          neutered: updatedDog.isNeutered,
          photo_uri: photoUrl,
        })
        .eq("id", id);

      if (error) throw error;

      setDogs(
        dogs.map((dog) =>
          dog.id === id ? { ...updatedDog, id, photo: photoUrl } : dog
        )
      );
    } catch (error) {
      console.error("Error updating dog:", error);
      throw error;
    }
  };

  const deleteDog = async (id: string) => {
    try {
      const dog = getDogById(id);

      // Eliminar foto de Storage si existe
      if (dog?.photo && dog.photo.includes("supabase")) {
        await deleteDogPhoto(dog.photo);
      }

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
