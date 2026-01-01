import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import PrimaryButton from "../components/PrimaryButton";
import Logo from "../components/Logo";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      // Error ya manejado en AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#10B981]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <View className="items-center mb-12">
              <Logo />
              <Text className="text-white text-center text-lg">
                Gestiona la salud de tus perros
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email */}
              <View>
                <Text className="text-white font-semibold mb-2">
                  Correo electrónico
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-white px-4 py-4 rounded-xl text-gray-700 text-base border border-gray-300"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Password */}
              <View className="mt-4">
                <Text className="text-white font-semibold mb-2">
                  Contraseña
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-white px-4 py-4 rounded-xl text-gray-700 text-base border border-gray-300"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Submit Button */}
              <View className="mt-8">
                <PrimaryButton
                  onPress={handleSubmit}
                  text={isSignUp ? "Crear cuenta" : "Iniciar sesión"}
                  disabled={loading || !email || !password}
                />
              </View>

              {/* Toggle Sign Up / Sign In */}
              <View className="flex-row justify-center items-center mt-6">
                <Text className="text-white">
                  {isSignUp ? "¿Ya tienes cuenta? " : "¿No tienes cuenta? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text className="text-white font-bold">
                    {isSignUp ? "Inicia sesión" : "Regístrate"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
