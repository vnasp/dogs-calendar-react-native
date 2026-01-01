import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./AuthContext";
import { Alert } from "react-native";

export interface SharedAccess {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  sharedWithEmail: string;
  sharedWithId?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

interface SharedAccessContextType {
  sentInvitations: SharedAccess[];
  receivedInvitations: SharedAccess[];
  activeShares: SharedAccess[];
  loading: boolean;
  sendInvitation: (email: string) => Promise<void>;
  acceptInvitation: (id: string) => Promise<void>;
  rejectInvitation: (id: string) => Promise<void>;
  revokeAccess: (id: string) => Promise<void>;
}

const SharedAccessContext = createContext<SharedAccessContextType | undefined>(
  undefined
);

export function SharedAccessProvider({ children }: { children: ReactNode }) {
  const [sentInvitations, setSentInvitations] = useState<SharedAccess[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<
    SharedAccess[]
  >([]);
  const [activeShares, setActiveShares] = useState<SharedAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSharedAccess();
    } else {
      setSentInvitations([]);
      setReceivedInvitations([]);
      setActiveShares([]);
      setLoading(false);
    }
  }, [user]);

  const loadSharedAccess = async () => {
    try {
      setLoading(true);

      // Cargar invitaciones enviadas
      const { data: sent, error: sentError } = await supabase
        .from("shared_access")
        .select("*")
        .eq("owner_id", user?.id);

      if (sentError) throw sentError;

      // Cargar invitaciones recibidas (sin intentar relacionar con auth.users)
      const { data: received, error: receivedError } = await supabase
        .from("shared_access")
        .select("*")
        .eq("shared_with_email", user?.email);

      if (receivedError) throw receivedError;

      const sentMapped = (sent || []).map((item: any) => ({
        id: item.id,
        ownerId: item.owner_id,
        sharedWithEmail: item.shared_with_email,
        sharedWithId: item.shared_with_id,
        status: item.status,
        createdAt: new Date(item.created_at),
      }));

      const receivedMapped = (received || []).map((item: any) => ({
        id: item.id,
        ownerId: item.owner_id,
        ownerEmail: undefined, // No podemos obtener el email del owner directamente
        sharedWithEmail: item.shared_with_email,
        sharedWithId: item.shared_with_id,
        status: item.status,
        createdAt: new Date(item.created_at),
      }));

      // Filtrar por estado
      setSentInvitations(sentMapped.filter((s) => s.status === "pending"));
      setReceivedInvitations(
        receivedMapped.filter((s) => s.status === "pending")
      );
      setActiveShares([
        ...sentMapped.filter((s) => s.status === "accepted"),
        ...receivedMapped.filter((s) => s.status === "accepted"),
      ]);
    } catch (error) {
      console.error("Error loading shared access:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (email: string) => {
    try {
      if (!user) throw new Error("No user authenticated");

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert("Error", "Por favor ingresa un email válido");
        return;
      }

      // No permitir invitarse a sí mismo
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        Alert.alert("Error", "No puedes compartir acceso contigo mismo");
        return;
      }

      // Verificar si ya existe una invitación
      const { data: existing } = await supabase
        .from("shared_access")
        .select("*")
        .eq("owner_id", user.id)
        .eq("shared_with_email", email)
        .single();

      if (existing) {
        Alert.alert("Error", "Ya existe una invitación para este email");
        return;
      }

      const { error } = await supabase.from("shared_access").insert({
        owner_id: user.id,
        shared_with_email: email.toLowerCase(),
        status: "pending",
      });

      if (error) throw error;

      Alert.alert("¡Listo!", `Se ha enviado una invitación a ${email}`);
      await loadSharedAccess();
    } catch (error) {
      console.error("Error sending invitation:", error);
      Alert.alert("Error", "No se pudo enviar la invitación");
      throw error;
    }
  };

  const acceptInvitation = async (id: string) => {
    try {
      if (!user) throw new Error("No user authenticated");

      const { error } = await supabase
        .from("shared_access")
        .update({
          status: "accepted",
          shared_with_id: user.id,
        })
        .eq("id", id);

      if (error) throw error;

      Alert.alert(
        "¡Genial!",
        "Ahora puedes ver y gestionar los datos compartidos contigo"
      );
      await loadSharedAccess();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert("Error", "No se pudo aceptar la invitación");
      throw error;
    }
  };

  const rejectInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shared_access")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      await loadSharedAccess();
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      Alert.alert("Error", "No se pudo rechazar la invitación");
      throw error;
    }
  };

  const revokeAccess = async (id: string) => {
    try {
      const { error } = await supabase
        .from("shared_access")
        .delete()
        .eq("id", id);

      if (error) throw error;

      Alert.alert("Listo", "Se ha revocado el acceso compartido");
      await loadSharedAccess();
    } catch (error) {
      console.error("Error revoking access:", error);
      Alert.alert("Error", "No se pudo revocar el acceso");
      throw error;
    }
  };

  return (
    <SharedAccessContext.Provider
      value={{
        sentInvitations,
        receivedInvitations,
        activeShares,
        loading,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        revokeAccess,
      }}
    >
      {children}
    </SharedAccessContext.Provider>
  );
}

export function useSharedAccess() {
  const context = useContext(SharedAccessContext);
  if (!context) {
    throw new Error("useSharedAccess must be used within SharedAccessProvider");
  }
  return context;
}
