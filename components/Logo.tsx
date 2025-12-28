import React from "react";
import { View, Text } from "react-native";
import { Heart } from "lucide-react-native";

export default function Logo() {
  return (
    <View className="flex-row items-center">
      <View className="w-10 h-10 bg-cyan-700 rounded-2xl items-center justify-center mr-3">
        <Heart size={22} color="white" strokeWidth={2.5} fill="white" />
      </View>
      <View>
        <Text className="text-white text-2xl font-bold">Dogs Care</Text>
        <Text className="text-cyan-100 text-xs font-medium">
          Salud y bienestar
        </Text>
      </View>
    </View>
  );
}
