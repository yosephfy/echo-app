import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

interface SecretBodyProps {
  content: string;
  onPress: () => any;
  isExpanded: boolean;
}
function linkifyHashtags(text: string, color: string) {
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

export const SecretBody: React.FC<SecretBodyProps> = ({
  content,
  onPress,
  isExpanded,
}) => {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.bodyContainer, isExpanded && { maxHeight: undefined }]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.bodyText,
          { color: colors.text },
          isExpanded && { maxHeight: undefined },
        ]}
      >
        {linkifyHashtags(content, colors.primary)}
      </Text>
      {!isExpanded && content.length > 100 && (
        <LinearGradient
          colors={[`${colors.card}00`, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 7 }}
          locations={[0, 0.15]}
          style={styles.fadeOverlay}
          pointerEvents="none"
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bodyContainer: {
    maxHeight: 200,
    overflow: "hidden",
    position: "relative",
    marginTop: 15,
  },
  bodyText: {
    fontSize: 17,
    fontWeight: "400",
    fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
    lineHeight: 24,
  },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
});

export default SecretBody;
