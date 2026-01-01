import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";

export interface MealTime {
  id: string;
  userId: string;
  name: string;
  time: string; // HH:mm format
  order: number;
}

interface MealTimesContextType {
  mealTimes: MealTime[];
  loading: boolean;
  addMealTime: (mealTime: Omit<MealTime, "id" | "userId">) => Promise<void>;
  updateMealTime: (
    id: string,
    mealTime: Omit<MealTime, "id" | "userId">
  ) => Promise<void>;
  deleteMealTime: (id: string) => Promise<void>;
  getMealTimeById: (id: string) => MealTime | undefined;
  reorderMealTimes: (reorderedMealTimes: MealTime[]) => Promise<void>;
}

const MealTimesContext = createContext<MealTimesContextType | undefined>(
  undefined
);

export function MealTimesProvider({ children }: { children: ReactNode }) {
  const [mealTimes, setMealTimes] = useState<MealTime[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMealTimes();
    } else {
      setMealTimes([]);
      setLoading(false);
    }
  }, [user]);

  const loadMealTimes = async () => {
    try {
      setLoading(true);

      if (!user) {
        setMealTimes([]);
        return;
      }

      const { data, error } = await supabase
        .from("meal_times")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      const mealTimesData: MealTime[] = (data || []).map((meal: any) => ({
        id: meal.id,
        userId: meal.user_id,
        name: meal.name,
        time: meal.time,
        order: meal.order_index,
      }));

      setMealTimes(mealTimesData);
    } catch (error) {
      console.error("Error loading meal times:", error);
    } finally {
      setLoading(false);
    }
  };

  const addMealTime = async (mealTime: Omit<MealTime, "id" | "userId">) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { data, error } = await supabase
        .from("meal_times")
        .insert({
          user_id: user.id,
          name: mealTime.name,
          time: mealTime.time,
          order_index: mealTime.order,
        })
        .select()
        .single();

      if (error) throw error;

      const newMealTime: MealTime = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        time: data.time,
        order: data.order_index,
      };

      setMealTimes(
        [...mealTimes, newMealTime].sort((a, b) => a.order - b.order)
      );
    } catch (error) {
      console.error("Error adding meal time:", error);
      throw error;
    }
  };

  const updateMealTime = async (
    id: string,
    updatedMealTime: Omit<MealTime, "id" | "userId">
  ) => {
    try {
      const { error } = await supabase
        .from("meal_times")
        .update({
          name: updatedMealTime.name,
          time: updatedMealTime.time,
          order_index: updatedMealTime.order,
        })
        .eq("id", id);

      if (error) throw error;

      setMealTimes(
        mealTimes
          .map((meal) =>
            meal.id === id
              ? {
                  ...meal,
                  name: updatedMealTime.name,
                  time: updatedMealTime.time,
                  order: updatedMealTime.order,
                }
              : meal
          )
          .sort((a, b) => a.order - b.order)
      );
    } catch (error) {
      console.error("Error updating meal time:", error);
      throw error;
    }
  };

  const deleteMealTime = async (id: string) => {
    try {
      const { error } = await supabase.from("meal_times").delete().eq("id", id);

      if (error) throw error;

      setMealTimes(mealTimes.filter((meal) => meal.id !== id));
    } catch (error) {
      console.error("Error deleting meal time:", error);
      throw error;
    }
  };

  const getMealTimeById = (id: string) => {
    return mealTimes.find((meal) => meal.id === id);
  };

  const reorderMealTimes = async (reorderedMealTimes: MealTime[]) => {
    try {
      // Actualizar orden en la base de datos
      const updates = reorderedMealTimes.map((meal, index) => ({
        id: meal.id,
        order_index: index + 1,
      }));

      // Actualizar en batch
      for (const update of updates) {
        await supabase
          .from("meal_times")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      // Actualizar estado local
      setMealTimes(
        reorderedMealTimes.map((meal, index) => ({
          ...meal,
          order: index + 1,
        }))
      );
    } catch (error) {
      console.error("Error reordering meal times:", error);
      throw error;
    }
  };

  return (
    <MealTimesContext.Provider
      value={{
        mealTimes,
        loading,
        addMealTime,
        updateMealTime,
        deleteMealTime,
        getMealTimeById,
        reorderMealTimes,
      }}
    >
      {children}
    </MealTimesContext.Provider>
  );
}

export function useMealTimes() {
  const context = useContext(MealTimesContext);
  if (context === undefined) {
    throw new Error("useMealTimes must be used within a MealTimesProvider");
  }
  return context;
}
