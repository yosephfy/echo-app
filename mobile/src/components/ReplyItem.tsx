// components/ReplyItem.tsx
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Reply } from "../hooks/useReplies";
import { useTheme } from "../theme/ThemeContext";
import { timeAgo } from "../utils/timeAgo";
import Reaction from "./Reaction";
import Avatar from "./Avatar";

interface Props {
  reply: Reply;
}

const ReplyItem: React.FC<Props> = ({ reply }) => {
  const { colors } = useTheme();
  const timestamp = timeAgo(reply.createdAt, "medium");

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.border, backgroundColor: colors.card },
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
        <TouchableOpacity
          style={styles.reactionButton}
          onPress={() => {
            /* handle react */
          }}
        >
          <Reaction current={null} onReact={() => {}} totalCount={0} />
        </TouchableOpacity>
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
    marginBottom: 0,
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
  reactionButton: {
    padding: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
    marginTop: 4,
  },
});

export default ReplyItem;
