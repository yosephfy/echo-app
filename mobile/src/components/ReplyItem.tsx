// components/ReplyItem.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Reply } from "../hooks/useReplies";
import { useTheme } from "../theme/ThemeContext";
import { timeAgo } from "../utils/timeAgo";
import Reaction from "./Reaction";
import Avatar from "./Avatar";
import useReplyReactions from "../hooks/useReplyReactions";
import { ReactionType } from "../hooks/useReactions";

interface Props {
  reply: Omit<Reply, "id"> | Reply; // reply without id (for pending replies
}

const ReplyItem: React.FC<Props> = ({ reply }) => {
  const { colors } = useTheme();
  const timestamp = timeAgo(reply.createdAt, "medium");

  const { counts, currentType, react } =
    "id" in reply
      ? useReplyReactions(reply.id, reply.secretId)
      : { counts: {}, currentType: null, react: (type: ReactionType) => {} };
  const totalReactions = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.outline, backgroundColor: colors.surface },
      ]}
    >
      {/* Header: avatar, username, timestamp, and reaction */}
      <View style={styles.header}>
        <View style={styles.meta}>
          <Avatar
            handle={reply.author.handle}
            url={reply.author.avatarUrl}
            size={24}
          />
          <Text style={[styles.author, { color: colors.primary }]}>
            @{reply.author.handle}
          </Text>
          <Text style={[styles.dot, { color: colors.muted }]}>·</Text>
          <Text style={[styles.time, { color: colors.muted }]}>
            {timestamp}
          </Text>
        </View>
        <Reaction
          current={currentType}
          onReact={(type: ReactionType) => react(type)}
          totalCount={totalReactions}
        />
      </View>

      {/* Comment text */}
      <Text style={[styles.text, { color: colors.text }]}>{reply.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 4,
  },
});

export default ReplyItem;
