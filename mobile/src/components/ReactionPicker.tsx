// mobile/src/components/ReactionPicker.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { ReactionType } from "../hooks/useReactions";

const EMOJI_MAP: Record<ReactionType, string> = {
  [ReactionType.Like]: "👍",
  [ReactionType.Love]: "❤️",
  [ReactionType.Haha]: "😂",
  [ReactionType.Wow]: "😮",
  [ReactionType.Sad]: "😢",
};

export default function ReactionPicker({
  selected,
  onSelect,
}: {
  selected: ReactionType | null;
  onSelect: (type: ReactionType) => void;
}) {
  return (
    <View style={styles.container}>
      {Object.entries(EMOJI_MAP).map(([type, emoji]) => (
        <TouchableOpacity
          key={type}
          style={[styles.button, selected === type && styles.selected]}
          onPress={() => onSelect(type as ReactionType)} // pass the enum value!
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  button: { padding: 8 },
  selected: { backgroundColor: "#ddd", borderRadius: 4 },
  emoji: { fontSize: 24 },
});
