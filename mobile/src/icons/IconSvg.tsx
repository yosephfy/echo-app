// components/IconSvg.tsx
import React from "react";
import { SvgProps } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import icons, { IconName } from "../icons/icons";

type IconState = "default" | "pressed" | "disabled" | "focused" | "hovered";

interface IconSvgProps {
  icon: IconName; // now any string!
  state?: IconState;
  size?: number;
  stateStyles?: Partial<Record<IconState, Partial<SvgProps>>>;
  fallbackColor?: keyof ReturnType<typeof useTheme>["colors"];
}

export const IconSvg: React.FC<IconSvgProps> = ({
  icon,
  state = "default",
  size = 24,
  stateStyles = {},
  fallbackColor = "text",
}) => {
  const theme = useTheme();
  const IconComponent = icons[icon];

  if (!IconComponent) {
    console.warn(`Icon '${icon}' not found.`);
    return null;
  }
  const fallbackStateStyles = {
    pressed: { color: theme.colors.primary },
    default: { color: theme.colors.muted },
    disabled: { color: theme.colors.muted + 22 },
    focused: { color: theme.colors.primary },
    hovered: { color: theme.colors.primary },
    ...stateStyles,
  };
  const themedFallbackColor = theme.colors[fallbackColor];
  const currentProps = stateStyles[state] || fallbackStateStyles[state] || {};

  return (
    <IconComponent
      width={currentProps.width || size}
      height={currentProps.height || size}
      color={currentProps.color || themedFallbackColor}
      {...currentProps}
    />
  );
};
