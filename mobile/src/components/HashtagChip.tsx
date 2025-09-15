import React from "react";
import { Text, View } from "react-native";
import Chip from "./Chip";
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
    <Chip
      labelComponent={
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: isSelected ? "#fff" : theme.colors.text,
            }}
            numberOfLines={1}
          >
            #{tag}
          </Text>
          {typeof count === "number" ? (
            <Text
              style={{
                marginLeft: 6,
                fontSize: 12,
                color: isSelected ? "#fff" : theme.colors.muted,
              }}
              numberOfLines={1}
            >
              {count}
            </Text>
          ) : null}
        </View>
      }
      variant={isSelected ? "filled" : "soft"}
      selected={isSelected}
      size="md"
      onPress={() => onPress(tag)}
      style={{ marginRight: 8, marginBottom: 8 }}
      numberOfLines={1}
      ellipsizeMode="tail"
    />
  );
}
