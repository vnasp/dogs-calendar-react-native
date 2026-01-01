import React from "react";
import { TouchableOpacity } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface HeaderIconProps {
  Icon: LucideIcon;
  onPress: () => void;
}

export default function HeaderIcon({ Icon, onPress }: HeaderIconProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-12 h-12 bg-[#49D3CC] rounded-xl items-center justify-center"
    >
      <Icon size={24} color="white" strokeWidth={2.5} pointerEvents="none" />
    </TouchableOpacity>
  );
}
