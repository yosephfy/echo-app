// mobile/src/components/CircularProgress.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";

interface CircularProgressProps {
  /** Diameter of the circle in pixels */
  size: number;
  /** Fraction between 0 and 1 */
  progress: number;
  /** Width of the stroke */
  strokeWidth?: number;
  /** Color of the filled arc */
  color?: string;
  /** Color of the background track */
  backgroundColor?: string;
}

export function CircularProgress({
  size,
  progress,
  strokeWidth = 4,
  color,
  backgroundColor,
}: CircularProgressProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const dashoffset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor ?? colors.outline}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
