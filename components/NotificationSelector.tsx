import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";

export type NotificationTime =
  | "none"
  | "15min"
  | "30min"
  | "1hour"
  | "2hours"
  | "1day"
  | "2days"
  | "1week";

export const notificationLabels: Record<NotificationTime, string> = {
  none: "Sin notificación",
  "15min": "15 minutos antes",
  "30min": "30 minutos antes",
  "1hour": "1 hora antes",
  "2hours": "2 horas antes",
  "1day": "1 día antes",
  "2days": "2 días antes",
  "1week": "1 semana antes",
};

interface NotificationSelectorProps {
  selectedTime: NotificationTime;
  onSelectTime: (time: NotificationTime) => void;
  title?: string;
}

export default function NotificationSelector({
  selectedTime,
  onSelectTime,
  title = "Recordatorio",
}: NotificationSelectorProps) {
  const notificationOptions: NotificationTime[] = [
    "none",
    "15min",
    "30min",
    "1hour",
    "2hours",
    "1day",
    "2days",
    "1week",
  ];

  return (
    <View>
      <Text className="text-gray-700 font-semibold mb-2">{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-2"
      >
        <View className="flex-row gap-2">
          {notificationOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => onSelectTime(option)}
              className={`px-4 py-3 rounded-xl ${
                selectedTime === option
                  ? "bg-blue-500"
                  : "bg-white border border-gray-300"
              }`}
            >
              <Text
                className={`font-semibold whitespace-nowrap ${
                  selectedTime === option ? "text-white" : "text-gray-700"
                }`}
              >
                {notificationLabels[option]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
