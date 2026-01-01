import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import PrimaryButton from "./PrimaryButton";

export type DatePickerMode = "date" | "time" | "datetime";

interface DatePickerDrawerProps {
  visible: boolean;
  mode: DatePickerMode;
  value: Date | string; // Date para date/datetime, string para time (HH:mm)
  onConfirm: (value: Date | string) => void; // Devuelve Date o string según el mode
  onCancel: () => void;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DatePickerDrawer({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  title,
  minimumDate,
  maximumDate,
}: DatePickerDrawerProps) {
  // Estado temporal para el valor seleccionado
  const [tempValue, setTempValue] = useState<Date | string>(value);

  // Función para convertir string time (HH:mm) a Date
  const timeStringToDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date;
  };

  // Función para convertir Date a string time (HH:mm)
  const dateToTimeString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Obtener el valor inicial como Date para el picker
  const getInitialDate = (): Date => {
    if (mode === "time" && typeof value === "string") {
      return timeStringToDate(value);
    }
    return value as Date;
  };

  // Manejar el cambio en el picker
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      if (mode === "time") {
        setTempValue(dateToTimeString(selectedDate));
      } else {
        setTempValue(selectedDate);
      }
    }
  };

  // Confirmar la selección
  const handleConfirm = () => {
    onConfirm(tempValue);
  };

  // Obtener el título por defecto según el modo
  const getDefaultTitle = (): string => {
    switch (mode) {
      case "time":
        return "Seleccionar Hora";
      case "date":
        return "Seleccionar Fecha";
      case "datetime":
        return "Seleccionar Fecha y Hora";
      default:
        return "Seleccionar";
    }
  };

  // Resetear el valor temporal cuando se abre el drawer
  React.useEffect(() => {
    if (visible) {
      setTempValue(value);
    }
  }, [visible, value]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl pb-8">
          {/* Header */}
          <View className="p-6 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900 text-center">
              {title || getDefaultTitle()}
            </Text>
          </View>

          {/* Picker */}
          <View className="px-6 pt-4">
            <DateTimePicker
              value={getInitialDate()}
              mode={mode === "datetime" ? "datetime" : mode}
              display="spinner"
              onChange={handleChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            />

            {/* Botones */}
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={onCancel}
                className="flex-1 bg-gray-200 py-4 rounded-xl"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 font-semibold text-center text-base">
                  Cancelar
                </Text>
              </TouchableOpacity>
              <PrimaryButton
                onPress={handleConfirm}
                text={mode === "time" ? "Confirmar hora" : "Confirmar"}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
