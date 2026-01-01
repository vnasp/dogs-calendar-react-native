import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

interface SuccessPulseProps {
  size?: number;
  color?: string;
}

export default function SuccessPulse({
  size = 80,
  color = "#22c55e",
}: SuccessPulseProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Animación de pulso que crece y desaparece
    scale.value = withSequence(
      withSpring(1, {
        damping: 10,
        stiffness: 100,
      }),
      withTiming(1.5, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      })
    );

    opacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(0, { duration: 400 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pulse: {
    position: "absolute",
  },
});
