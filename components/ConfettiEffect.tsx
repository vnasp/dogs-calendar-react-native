import React, { useEffect } from "react";
import { View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  withDelay,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPieceProps {
  delay: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
}

const ConfettiPiece = ({
  delay,
  startX,
  startY,
  color,
  size,
}: ConfettiPieceProps) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Animación de aparición y dispersión
    const endX = (Math.random() - 0.5) * 300; // Movimiento horizontal más amplio
    const endY = Math.random() * 400 + 200; // Movimiento vertical hacia abajo más largo
    const rotations = Math.random() * 1080 - 540; // Más rotaciones

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(2000, withTiming(0, { duration: 800 }))
      )
    );

    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 8,
        stiffness: 100,
      })
    );

    translateX.value = withDelay(
      delay,
      withTiming(endX, {
        duration: 2500,
        easing: Easing.out(Easing.cubic),
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(endY, {
        duration: 2500,
        easing: Easing.in(Easing.cubic),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(rotations, {
        duration: 2500,
        easing: Easing.linear,
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: startX,
      top: startY,
      width: size,
      height: size,
      backgroundColor: color,
      borderRadius: size / 2,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return <Animated.View style={animatedStyle} />;
};

interface StarPieceProps {
  delay: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
}

const StarPiece = ({ delay, startX, startY, color, size }: StarPieceProps) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 600 }))
      )
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.5, {
          damping: 6,
          stiffness: 100,
        }),
        withTiming(1, { duration: 300 })
      )
    );

    translateY.value = withDelay(
      delay,
      withTiming(-30, {
        duration: 1200,
        easing: Easing.out(Easing.quad),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming(180, {
        duration: 2000,
        easing: Easing.linear,
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: "absolute",
      left: startX - size / 2,
      top: startY - size / 2,
      width: size,
      height: size,
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      >
        {/* Forma de estrella simple usando clips */}
        <View
          style={{
            position: "absolute",
            width: size,
            height: size,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          }}
        />
      </View>
    </Animated.View>
  );
};

interface ConfettiEffectProps {}

export default function ConfettiEffect() {
  const colors = [
    "#FFD700", // Dorado
    "#FFA500", // Naranja
    "#FF6347", // Tomate
    "#87CEEB", // Celeste
    "#98FB98", // Verde claro
    "#DDA0DD", // Ciruela
    "#F0E68C", // Khaki
  ];

  // Generar confetti distribuido por toda la pantalla
  const confettiPieces = Array.from({ length: 40 }, (_, i) => ({
    delay: i * 20,
    color: colors[i % colors.length],
    size: Math.random() * 8 + 4,
    startX: Math.random() * SCREEN_WIDTH,
    startY: -20 - Math.random() * 100, // Empiezan arriba de la pantalla
  }));

  // Generar estrellas brillantes distribuidas
  const stars = Array.from({ length: 15 }, (_, i) => ({
    delay: i * 40,
    color: colors[i % colors.length],
    size: Math.random() * 16 + 10,
    startX: Math.random() * SCREEN_WIDTH,
    startY: Math.random() * SCREEN_HEIGHT * 0.3,
  }));

  return (
    <View
      style={{
        position: "absolute",
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        pointerEvents: "none",
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      {/* Confetti */}
      {confettiPieces.map((piece, index) => (
        <ConfettiPiece
          key={`confetti-${index}`}
          delay={piece.delay}
          startX={piece.startX}
          startY={piece.startY}
          color={piece.color}
          size={piece.size}
        />
      ))}

      {/* Estrellas */}
      {stars.map((star, index) => (
        <StarPiece
          key={`star-${index}`}
          delay={star.delay}
          startX={star.startX}
          startY={star.startY}
          color={star.color}
          size={star.size}
        />
      ))}
    </View>
  );
}
