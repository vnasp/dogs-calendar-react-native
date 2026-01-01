import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Square, Check } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import ConfettiEffect from "./ConfettiEffect";
import SuccessPulse from "./SuccessPulse";

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete: () => void | Promise<void>;
  isCompleted?: boolean;
  completedBy?: string;
}

export default function SwipeableCard({
  children,
  onComplete,
  isCompleted = false,
  completedBy,
}: SwipeableCardProps) {
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [pulsePosition, setPulsePosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<View>(null);

  // Animaciones para el badge de completado
  const badgeScale = useSharedValue(isCompleted ? 1 : 0);
  const badgeRotate = useSharedValue(0);

  useEffect(() => {
    if (isCompleted) {
      // Animar el badge cuando está completado
      badgeScale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      badgeRotate.value = withSequence(
        withTiming(10, { duration: 200 }),
        withTiming(-5, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      badgeScale.value = 0;
      badgeRotate.value = 0;
    }
  }, [isCompleted]);

  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: badgeScale.value },
        { rotate: `${badgeRotate.value}deg` },
      ],
    };
  });

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Obtener posición del botón para el pulso
      if (buttonRef.current) {
        buttonRef.current.measureInWindow((x, y, width, height) => {
          const centerX = x + width / 2;
          const centerY = y + height / 2;

          setPulsePosition({ x: centerX, y: centerY });

          // Mostrar pulso inmediatamente
          setShowPulse(true);
          setTimeout(() => setShowPulse(false), 600);

          // Mostrar confetti de pantalla completa con un pequeño delay
          setTimeout(() => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3500);
          }, 100);
        });
      }

      await onComplete();
    } catch (error) {
      console.error("Error completing:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <View className="relative">
        <View className="bg-white rounded-2xl p-4 shadow-sm border-2 border-green-300">
          {children}
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "#22c55e",
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#22c55e",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
              badgeAnimatedStyle,
            ]}
          >
            <Check size={14} color="white" strokeWidth={3} />
            <Text
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {completedBy || "Completado"}
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="relative">
        <View
          className="bg-white rounded-2xl p-4 shadow-sm"
          pointerEvents="box-none"
        >
          <View pointerEvents="auto">{children}</View>
          {/* Botón de completar en la esquina superior derecha */}
          <TouchableOpacity
            ref={buttonRef}
            onPress={handleComplete}
            disabled={loading}
            className={`absolute top-2 right-2 w-10 h-10 rounded-lg items-center justify-center ${
              loading ? "bg-gray-200" : "bg-gray-100 active:bg-gray-200"
            }`}
            activeOpacity={0.8}
            style={{ zIndex: 10 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Square
                size={24}
                color="#6b7280"
                strokeWidth={2}
                pointerEvents="none"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Efecto de pulso de éxito */}
      {showPulse && (
        <View
          style={{
            position: "absolute",
            left: pulsePosition.x - 40,
            top: pulsePosition.y - 40,
            width: 80,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <SuccessPulse size={80} color="#22c55e" />
        </View>
      )}

      {/* Efecto de confetti de pantalla completa */}
      {showConfetti && <ConfettiEffect />}
    </>
  );
}
