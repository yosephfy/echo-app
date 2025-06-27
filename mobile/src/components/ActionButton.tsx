import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";

interface ActionButtonProps {
  icon: IconName;
  label?: number | string;
  active?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ActionButton({
  icon,
  label,
  active = false,
  size,
  onPress,
  onLongPress,
  style = {},
}: ActionButtonProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height: size ?? 32, width: size ?? 32 },
        //active && { backgroundColor: colors.primary + "22" },
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {/* <MaterialCommunityIcons
        name={icon}
        size={size ?? 24}
        color={active ? colors.primary : colors.muted}
      /> */}
      <IconSvg
        icon={icon}
        size={size ?? 24}
        state={active ? "pressed" : "default"}
      />
      {label != null && (
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 0,
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  label: {
    marginLeft: 4,
    fontSize: 14,
  },
});
