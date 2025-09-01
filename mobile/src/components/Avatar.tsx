import React, { useMemo, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Pressable,
  PressableProps,
  Platform,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

type BadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export default function Avatar({
  url,
  handle,
  size = 40,
  loading = false,
  ring = false,
  ringColor,
  ringWidth = 2,
  ringGap = 2,
  badge,
  badgePosition = "bottom-right",
  badgeOffset = 0,
  badgeContainerStyle,
  badgeOverlap = true,
  onPress,
  pressableProps,
}: {
  url?: string | null;
  handle: string;
  size?: number;
  loading?: boolean;

  ring?: boolean;
  ringColor?: string;
  ringWidth?: number;
  ringGap?: number;

  badge?: React.ReactNode;
  badgePosition?: BadgePosition;
  badgeOffset?: number;
  badgeContainerStyle?: ViewStyle;
  badgeOverlap?: boolean;

  onPress?: () => void;
  pressableProps?: PressableProps;
}) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);

  const initials = useMemo(() => {
    const h = (handle || "").replace(/^@/, "");
    if (!h) return "?";
    return h.slice(0, 2).toUpperCase();
  }, [handle]);

  const radius = size / 2;
  const _ringColor = ringColor || colors.primary || colors.border;

  // Ring is built as: [ring color] → [gap (theme bg)] → [avatar]
  const outerSize = size + (ring ? (ringWidth + ringGap) * 2 : 0);
  const outerRadius = outerSize / 2;

  const Core = (
    <View
      style={[
        styles.coreWrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          overflow: badgeOverlap ? "visible" : "hidden",
        },
      ]}
    >
      {loading ? (
        <View
          style={[
            styles.fallback,
            { borderRadius: radius, backgroundColor: colors.border + "55" },
          ]}
        >
          <ActivityIndicator size="small" color={colors.muted} />
        </View>
      ) : url && !error ? (
        <Image
          source={{ uri: url }}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: colors.surfaceAlt,
          }}
          onError={() => setError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { borderRadius: radius, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.initials, { color: colors.muted }]}>
            {initials}
          </Text>
        </View>
      )}

      {badge ? (
        <View
          style={[
            styles.badgeContainer,
            getCornerStyle(badgePosition, badgeOffset),
            badgeContainerStyle,
          ]}
        >
          {badge}
        </View>
      ) : null}
    </View>
  );

  const WithRing = ring ? (
    <View
      style={[
        styles.ringOuter,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerRadius,
          backgroundColor: _ringColor,
          padding: ringWidth,
        },
        Platform.select({
          ios: {
            shadowColor: _ringColor,
            shadowOpacity: 0.18,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          },
          android: { elevation: ringWidth > 0 ? 2 : 0 },
        }),
      ]}
      pointerEvents="box-none"
    >
      <View
        style={{
          flex: 1,
          borderRadius: outerRadius - ringWidth,
          backgroundColor: colors.background,
          padding: ringGap,
        }}
        pointerEvents="box-none"
      >
        {Core}
      </View>
    </View>
  ) : (
    Core
  );

  const content = onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${handle} avatar`}
      onPress={onPress}
      hitSlop={8}
      android_ripple={
        Platform.OS === "android"
          ? { color: (colors.primary || "#000") + "22", borderless: true }
          : undefined
      }
      style={[
        styles.pressable,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerRadius,
        },
      ]}
      {...pressableProps}
    >
      <View style={styles.center}>{WithRing}</View>
    </Pressable>
  ) : (
    <View
      style={[
        styles.container,
        { width: outerSize, height: outerSize, borderRadius: outerRadius },
      ]}
      pointerEvents="box-none"
    >
      {WithRing}
    </View>
  );

  return content;
}

function getCornerStyle(
  position: BadgePosition,
  offset: number
): Record<string, number> {
  switch (position) {
    case "top-left":
      return { top: offset, left: offset };
    case "top-right":
      return { top: offset, right: offset };
    case "bottom-left":
      return { bottom: offset, left: offset };
    case "bottom-right":
    default:
      return { bottom: offset, right: offset };
  }
}

/* =========================
   Styles
   ========================= */
const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "transparent",
  },
  pressable: {
    position: "relative",
    backgroundColor: "transparent",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOuter: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  coreWrap: {
    position: "relative",
    backgroundColor: "transparent",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  initials: { fontWeight: "700", fontSize: 14 },
  badgeContainer: {
    position: "absolute",
  },
});
