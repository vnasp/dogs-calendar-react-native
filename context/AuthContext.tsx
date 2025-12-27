import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase";
import { Alert } from "react-native";

interface AuthContextData {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  shareWithEmail: (email: string) => Promise<void>;
  getSharedAccess: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert(
        "Registro exitoso",
        "Revisa tu correo para confirmar tu cuenta"
      );
    } catch (error: any) {
      Alert.alert("Error en registro", error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error en inicio de sesión", error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert("Error al cerrar sesión", error.message);
      throw error;
    }
  };

  const shareWithEmail = async (email: string) => {
    try {
      if (!user) throw new Error("No hay usuario autenticado");

      const { error } = await supabase.from("shared_access").insert({
        owner_id: user.id,
        shared_with_email: email,
      });

      if (error) throw error;

      Alert.alert(
        "Invitación enviada",
        `Se ha enviado una invitación a ${email}`
      );
    } catch (error: any) {
      Alert.alert("Error al compartir", error.message);
      throw error;
    }
  };

  const getSharedAccess = async () => {
    try {
      if (!user) return [];

      const { data, error } = await supabase
        .from("shared_access")
        .select("*")
        .or(`owner_id.eq.${user.id},shared_with_id.eq.${user.id}`);

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error("Error al obtener accesos compartidos:", error.message);
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        shareWithEmail,
        getSharedAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
