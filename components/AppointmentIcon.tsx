import React from "react";
import {
  Stethoscope,
  ScanLine,
  ClipboardList,
  Syringe,
  Heart,
  Pill,
  Bug,
  Pin,
} from "lucide-react-native";
import { AppointmentType } from "../context/CalendarContext";

interface AppointmentIconProps {
  type: AppointmentType;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function AppointmentIcon({
  type,
  size = 20,
  color = "#374151",
  strokeWidth = 2,
}: AppointmentIconProps) {
  switch (type) {
    case "control":
      return (
        <Stethoscope size={size} color={color} strokeWidth={strokeWidth} />
      );
    case "radiografia":
      return <ScanLine size={size} color={color} strokeWidth={strokeWidth} />;
    case "prequirurgico":
      return (
        <ClipboardList size={size} color={color} strokeWidth={strokeWidth} />
      );
    case "operacion":
      return <Syringe size={size} color={color} strokeWidth={strokeWidth} />;
    case "fisioterapia":
      return <Heart size={size} color={color} strokeWidth={strokeWidth} />;
    case "vacuna":
      return <Syringe size={size} color={color} strokeWidth={strokeWidth} />;
    case "desparasitacion":
      return <Bug size={size} color={color} strokeWidth={strokeWidth} />;
    case "otro":
      return <Pin size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return (
        <Stethoscope size={size} color={color} strokeWidth={strokeWidth} />
      );
  }
}
