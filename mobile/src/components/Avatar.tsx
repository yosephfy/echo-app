import React, { useMemo, useState } from "react";
import { View, Image, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export default function Avatar({
  url,
  handle,
  size = 40,
  ring = false,
  loading = false,
}: {
  url?: string | null;
  handle: string;
  size?: number;
  ring?: boolean;
  loading?: boolean;
}) {
  const { colors } = useTheme();
  const [error, setError] = useState(false);

  const initials = useMemo(() => {
    const h = (handle || "").replace(/^@/, "");
    if (!h) return "?";
    return h.slice(0, 2).toUpperCase();
  }, [handle]);

  const radius = size / 2;

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: radius },
        ring && { borderWidth: 1, borderColor: colors.border },
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
            backgroundColor: "#ddd",
          }}
          onError={() => setError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { borderRadius: radius, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.initials, { color: colors.muted }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  initials: { fontWeight: "700", fontSize: 14 },
});
