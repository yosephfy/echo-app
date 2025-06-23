// mobile/src/components/Avatar.tsx
import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

export default function Avatar({
  url,
  handle,
}: {
  url?: string;
  handle: string;
}) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://placehold.co/40x40.png" }}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
});
