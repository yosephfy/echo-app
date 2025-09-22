import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import { ReactionType } from "../../hooks/useReactions";
import ActionButton from "./ActionButton";
import ReactionPicker, { DEFAULT_REACTIONS } from "./ReactionPicker";

interface ActionButtonsProps {
  reaction: {
    onPress: () => any;
    currentType: ReactionType | null;
    disabled: boolean;
    label?: string | number;
    onSelect: (k: ReactionType) => any;
  };
  comment: { onPress: () => any; label?: string | number };
  share: { onPress: () => any; label?: string | number };
  bookmark: {
    onPress: () => any;
    bookmarked: boolean;
    label?: string | number;
    loading: boolean;
  };
}

export const InteractionRow: React.FC<ActionButtonsProps> = ({
  reaction,
  comment,
  share,
  bookmark,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftActions}>
        <ReactionPicker
          value={reaction.currentType ?? null}
          onSelect={(k) => reaction.onSelect(k as ReactionType)}
        >
          <ActionButton
            icon={
              reaction.currentType
                ? (DEFAULT_REACTIONS.find((r) => r.key === reaction.currentType)
                    ?.icon as any)
                : "heart"
            }
            onPress={reaction.onPress}
            label={reaction.label}
            size={26}
            disabled={reaction.disabled}
            active={!!reaction.currentType}
          />
        </ReactionPicker>
        <ActionButton
          icon="comment"
          size={24}
          onPress={comment.onPress}
          label={comment.label}
        />
        <ActionButton icon="share" size={26} onPress={share.onPress} />
      </View>
      <View style={styles.rightActions}>
        <ActionButton
          icon={bookmark.bookmarked ? "bookmark-fill" : "bookmark"}
          size={26}
          onPress={bookmark.onPress}
          active={bookmark.bookmarked}
          label={bookmark.label}
          disabled={bookmark.loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 17,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  rightActions: {},
  actionIcon: {
    width: 26,
    height: 26,
    aspectRatio: 1,
    color: "black",
    backgroundColor: "black",
  },
});
