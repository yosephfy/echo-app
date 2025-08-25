import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";

interface ActionButtonProps {
  icon: IconName;
  label?: number | string;
  active?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function ActionButton({
  icon,
  label,
  active = false,
  size,
  onPress,
  onLongPress,
  style = {},
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  const tint = active ? "pressed" : "default";
  const opacity = disabled || loading ? 0.5 : pressed ? 0.8 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { height: size ?? 32, minWidth: size ?? 32, opacity },
        style,
      ]}
      onPress={disabled || loading ? undefined : onPress}
      onLongPress={disabled || loading ? undefined : onLongPress}
      activeOpacity={0.85}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      disabled={disabled || loading}
    >
      <IconSvg icon={icon} size={size ?? 22} state={tint} />
      {label != null && (
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      )}
      {loading ? <View style={styles.spinnerDot} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    borderRadius: 6,
    marginHorizontal: 4,
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 14,
  },
  spinnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#999",
  },
});
