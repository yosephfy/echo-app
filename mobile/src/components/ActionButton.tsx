// components/ActionButton.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function ActionButton({
  icon,
  label,
  active = false,
  onPress,
}: {
  icon: string;
  label?: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        active && { backgroundColor: colors.primary, borderRadius: 4 },
      ]}
    >
      <Text style={[styles.text, { color: active ? "#fff" : colors.text }]}>
        {icon} {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { padding: 6 },
  text: { fontSize: 16 },
});
