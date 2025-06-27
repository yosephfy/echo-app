// mobile/src/components/Avatar.tsx
import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function Avatar({
  url,
  handle,
  size,
}: {
  url?: string;
  handle: string;
  size?: number;
}) {
  return (
    <View style={[styles.container, size ? { width: size, height: size } : {}]}>
      <Image
        source={{ uri: url ?? "https://placehold.co/40x40.png" }}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%", backgroundColor: "#ccc" },
});
