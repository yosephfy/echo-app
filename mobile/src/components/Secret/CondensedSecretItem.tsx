import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import { useTheme } from "../../theme/ThemeContext";
import { linkifyHashtags } from "../../utils/linkifyHashtags";
import Avatar from "../Avatar";

interface SecretBodyProps {
  content: string;
  onPress: () => any;
  avatarUrl: string;
  handle: string;
}

export const CondensedSecretItem: React.FC<SecretBodyProps> = ({
  avatarUrl,
  handle,
  content,
  onPress,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        styles.condensedCard,
        { backgroundColor: colors.card },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Avatar url={avatarUrl} handle={handle} size={32} />
      </View>

      {/* BODY */}
      <Pressable
        style={[styles.bodyContainer, styles.condensedBodyContainer]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.bodyText,
            { color: colors.text },
            styles.condensedBodyText,
          ]}
        >
          {linkifyHashtags(content, colors.primary)}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 5,
    marginHorizontal: 10,
    //borderWidth: 1,
  },
  condensedCard: {
    padding: 8,
    margin: 4,
    maxWidth: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bodyContainer: {
    maxHeight: 200,
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  condensedBodyContainer: { maxHeight: 60 },
  bodyText: { fontSize: 17, lineHeight: 22, minHeight: 20, maxHeight: 180 },
  condensedBodyText: { fontSize: 14, lineHeight: 18, maxHeight: 60 },
});

export default CondensedSecretItem;
