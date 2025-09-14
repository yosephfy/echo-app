import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface HashtagChipProps {
  tag: string;
  count?: number;
  isSelected?: boolean;
  onPress: (tag: string) => void;
}

export default function HashtagChip({
  tag,
  count,
  isSelected = false,
  onPress,
}: HashtagChipProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
        },
      ]}
      onPress={() => onPress(tag)}
    >
      <Text style={[
        styles.chipText,
        { color: isSelected ? "#fff" : theme.colors.text }
      ]}>
        #{tag}
      </Text>
      {count && (
        <Text style={[
          styles.countText,
          { color: isSelected ? "#fff" : theme.colors.muted }
        ]}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  countText: {
    fontSize: 12,
  },
});