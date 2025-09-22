import React from "react";
import { Text } from "react-native";

export function linkifyHashtags(text: string, color: string) {
  const parts = text.split(/(#[a-zA-Z0-9_]{2,32})/g);
  return parts.map((p, idx) => {
    if (/^#[a-zA-Z0-9_]{2,32}$/.test(p)) {
      return (
        <Text
          key={idx}
          style={{ color, fontWeight: "600" }}
          onPress={() => {
            // future: navigate to tag feed
          }}
        >
          {p}
        </Text>
      );
    }
    // inherit parent Text styles for non-hashtag segments
    return <Text key={idx}>{p}</Text>;
  });
}
