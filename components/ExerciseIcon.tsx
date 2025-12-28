import React from "react";
import {
  Footprints,
  Waves,
  Zap,
  CircleDot,
  Dumbbell,
  Heart,
  Activity,
} from "lucide-react-native";
import { ExerciseType } from "../context/ExerciseContext";

interface ExerciseIconProps {
  type: ExerciseType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function ExerciseIcon({
  type,
  size = 20,
  color = "#374151",
  strokeWidth = 2,
}: ExerciseIconProps) {
  switch (type) {
    case "caminata":
      return <Footprints size={size} color={color} strokeWidth={strokeWidth} />;
    case "cavaletti":
      return <Activity size={size} color={color} strokeWidth={strokeWidth} />;
    case "natacion":
      return <Waves size={size} color={color} strokeWidth={strokeWidth} />;
    case "carrera":
      return <Zap size={size} color={color} strokeWidth={strokeWidth} />;
    case "juego":
      return <CircleDot size={size} color={color} strokeWidth={strokeWidth} />;
    case "fisioterapia":
      return <Heart size={size} color={color} strokeWidth={strokeWidth} />;
    case "otro":
      return <Dumbbell size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return <Activity size={size} color={color} strokeWidth={strokeWidth} />;
  }
}
