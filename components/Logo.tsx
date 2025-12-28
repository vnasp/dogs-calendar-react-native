import React from "react";
import { View, Image, Text } from "react-native";

export default function Logo() {
  return (
    <View className="flex-row items-center">
      <Image
        source={require("../assets/icon.png")}
        style={{ width: 64, height: 64 }}
        resizeMode="contain"
      />
      <Text
        className="text-white text-3xl font-extrabold ml-3 tracking-wide"
        style={{ letterSpacing: 1 }}
      >
        PewosApp
      </Text>
    </View>
  );
}
