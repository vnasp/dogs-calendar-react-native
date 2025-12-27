import React, { createContext, useContext, useState, ReactNode } from "react";

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
