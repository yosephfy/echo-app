import React from "react";
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { IconSvg } from "../icons/IconSvg";
import { useTheme } from "../theme/ThemeContext";

export type ChipVariant = "filled" | "outline" | "soft" | "ghost";
export type ChipSize = "xs" | "sm" | "md" | "lg";
export type WidthMode = "auto" | "fixed" | "fluid"; // auto: fits content; fixed: width prop; fluid: flex grow

export type ChipProps = {
  label?: string;
  labelComponent?: React.ReactNode; // custom label content; if provided, supersedes label text rendering
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  // Icon support: provide an IconName (string) to render the project's IconSvg,
  // or pass a custom React node via leftIconNode/rightIconNode.
  leftIcon?: string; // IconName from IconSvg (backward-compatible)
  rightIcon?: string; // IconName from IconSvg (backward-compatible)
  leftIconNode?: React.ReactNode; // custom icon element to render instead of IconSvg
  rightIconNode?: React.ReactNode; // custom icon element to render instead of IconSvg
  // advanced IconSvg props forwarded when using leftIcon/rightIcon strings
  iconState?: "default" | "pressed" | "disabled" | "focused" | "hovered";
  iconSize?: number; // override computed icon size
  iconFallbackColor?: keyof ReturnType<typeof useTheme>["colors"]; // fallback color key for IconSvg
  iconStateStyles?: Partial<Record<string, Partial<any>>>; // forwarded to IconSvg as stateStyles
  variant?: ChipVariant;
  size?: ChipSize;
  color?: string; // override theme primary
  textColor?: string; // override auto text color
  bgColor?: string; // override background color
  borderColor?: string; // override border color
  borderWidth?: number; // override border width
  radius?: number; // override border radius
  widthMode?: WidthMode;
  width?: number; // required when widthMode=fixed
  maxWidth?: number; // cap width for auto/fluid
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  // Ellipsis and line control
  numberOfLines?: number; // default 1
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  uppercase?: boolean; // transform label to uppercase
};

export const Chip: React.FC<ChipProps> = ({
  label,
  labelComponent,
  onPress,
  onLongPress,
  selected = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  variant = "soft",
  size = "md",
  color,
  textColor,
  bgColor,
  borderColor,
  borderWidth,
  radius,
  widthMode = "auto",
  width,
  maxWidth,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
  numberOfLines = 1,
  ellipsizeMode = "tail",
  uppercase,
  leftIconNode,
  rightIconNode,
  iconState = "default",
  iconSize: explicitIconSize,
  iconFallbackColor,
  iconStateStyles,
}) => {
  const { colors } = useTheme();
  const primary = color ?? colors.primary;

  const { containerStyle, contentPad, textSize, iconSize } =
    getSizeStyles(size);
  const palette = getPalette({ variant, selected, disabled, primary, colors });

  const widthStyles: ViewStyle =
    widthMode === "fixed"
      ? { width }
      : widthMode === "fluid"
        ? { flexGrow: 1, flexShrink: 1 }
        : {};

  const constrained: ViewStyle =
    typeof maxWidth === "number" ? { maxWidth } : {};

  const baseStyle: ViewStyle = {
    ...containerStyle,
    ...widthStyles,
    ...constrained,
    borderRadius: typeof radius === "number" ? radius : 18,
    borderWidth:
      typeof borderWidth === "number"
        ? borderWidth
        : variant === "outline"
          ? 1
          : StyleSheet.hairlineWidth,
    borderColor: borderColor ?? palette.border,
    backgroundColor: bgColor ?? palette.bg,
    opacity: disabled ? 0.6 : 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 2,
    paddingVertical: 2,
  };

  const labelColor = textColor ?? palette.fg;
  const hasCustomLabel = !!labelComponent;
  const a11yLabel =
    accessibilityLabel ?? (typeof label === "string" ? label : undefined);

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, selected, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        baseStyle,
        { opacity: pressed ? 0.9 : baseStyle.opacity },
        style,
      ]}
    >
      <View style={[styles.row, contentPad]}>
        {leftIconNode ? (
          leftIconNode
        ) : leftIcon && !loading ? (
          <IconSvg
            icon={leftIcon as any}
            state={iconState as any}
            size={
              typeof explicitIconSize === "number" ? explicitIconSize : iconSize
            }
            stateStyles={iconStateStyles as any}
            fallbackColor={iconFallbackColor as any}
          />
        ) : null}
        {loading ? <ActivityIndicator size="small" color={labelColor} /> : null}
        {hasCustomLabel ? (
          <View style={[styles.textContainer, { flexShrink: 1 }]}>
            {labelComponent}
          </View>
        ) : (
          <Text
            style={[
              { color: labelColor, ...textSize },
              styles.text,
              uppercase && { textTransform: "uppercase" },
              textStyle,
            ]}
            numberOfLines={numberOfLines}
            ellipsizeMode={ellipsizeMode}
          >
            {label}
          </Text>
        )}
        {rightIconNode ? (
          rightIconNode
        ) : rightIcon ? (
          <IconSvg
            icon={rightIcon as any}
            state={iconState as any}
            size={
              typeof explicitIconSize === "number" ? explicitIconSize : iconSize
            }
            stateStyles={iconStateStyles as any}
            fallbackColor={iconFallbackColor as any}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

function getSizeStyles(size: ChipSize) {
  switch (size) {
    case "xs":
      return {
        containerStyle: { minHeight: 18 } as ViewStyle,
        contentPad: { paddingHorizontal: 8, paddingVertical: 2 } as ViewStyle,
        textSize: { fontSize: 11, fontWeight: "600" } as TextStyle,
        iconSize: 12,
      };
    case "sm":
      return {
        containerStyle: { minHeight: 28 } as ViewStyle,
        contentPad: { paddingHorizontal: 10, paddingVertical: 4 } as ViewStyle,
        textSize: { fontSize: 12, fontWeight: "500" } as TextStyle,
        iconSize: 14,
      };
    case "lg":
      return {
        containerStyle: { minHeight: 40 } as ViewStyle,
        contentPad: { paddingHorizontal: 14, paddingVertical: 8 } as ViewStyle,
        textSize: { fontSize: 16, fontWeight: "600" } as TextStyle,
        iconSize: 18,
      };
    case "md":
    default:
      return {
        containerStyle: { minHeight: 34 } as ViewStyle,
        contentPad: { paddingHorizontal: 12, paddingVertical: 6 } as ViewStyle,
        textSize: { fontSize: 14, fontWeight: "500" } as TextStyle,
        iconSize: 16,
      };
  }
}

function getPalette({
  variant,
  selected,
  disabled,
  primary,
  colors,
}: {
  variant: ChipVariant;
  selected: boolean;
  disabled: boolean;
  primary: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const subtle = hexWithAlpha(primary, 0.15);
  const borderBase = selected ? primary : colors.outline;
  const fgBase = selected ? primary : colors.text;

  switch (variant) {
    case "filled":
      return {
        bg: selected ? primary : colors.surface,
        fg: selected ? "#fff" : colors.text,
        border: selected ? primary : colors.surface,
      };
    case "outline":
      return {
        bg: colors.background,
        fg: fgBase,
        border: borderBase,
      };
    case "ghost":
      return {
        bg: "transparent",
        fg: fgBase,
        border: "transparent",
      };
    case "soft":
    default:
      return {
        bg: selected ? subtle : colors.surface,
        fg: fgBase,
        border: selected ? primary : colors.outline,
      };
  }
}

function hexWithAlpha(hex: string, alpha: number) {
  // supports #RRGGBB; converts to rgba fallback
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    flexShrink: 1,
    alignContent: "center",
  },
  textContainer: {
    flexShrink: 1,
  },
});

export default Chip;
