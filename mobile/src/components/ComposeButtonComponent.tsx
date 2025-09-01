// mobile/src/components/ComposeButton.tsx
import React, { use, useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from "react-native";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import useCooldown from "../hooks/useCooldown";
import { IconSvg } from "../icons/IconSvg";

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface ComposeButtonProps {
  composerActive?: boolean;
  onPress: () => void;
  size?: number;
}

export default function ComposeButton({
  composerActive,
  onPress,
  size = 84,
}: ComposeButtonProps) {
  const { colors } = useTheme();
  const radius = (size - 8) / 2;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;

  //const [cooldown, setCooldown] = useState<number>(0);
  //const [totalCooldown, setTotalCooldown] = useState<number>(0);
  const {
    remaining: cooldown,
    duration: totalCooldown,
    refresh,
  } = useCooldown();

  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fraction = cooldown > 0 ? cooldown / totalCooldown : 0;
    Animated.timing(progress, {
      toValue: fraction,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [cooldown, totalCooldown]);

  useEffect(() => {
    // Reset cooldown when composer is active
    refresh();
  }, [composerActive]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${String(h).padStart(2, "0")}h`;
    if (m > 0) return `${String(m).padStart(2, "0")}m`;
    return `${String(s).padStart(2, "0")}s`;
  };

  const isDisabled = cooldown > 0;

  return (
    <SafeAreaView style={{ zIndex: 1000 }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.container, { width: size, height: size }]}
      >
        <Svg width={size} height={size}>
          <SvgCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.outline}
            strokeWidth={strokeWidth}
            fill={cooldown == 0 ? colors.surface : colors.surface}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}, ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>

        <View style={styles.content}>
          {isDisabled ? (
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatTime(cooldown)}
            </Text>
          ) : (
            <IconSvg icon="add-circle" size={size + 4} state="pressed" />
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    //top: 24,
    right: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  content: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  plus: {
    fontSize: 42,
    lineHeight: 42,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
