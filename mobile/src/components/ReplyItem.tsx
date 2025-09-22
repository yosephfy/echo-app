// components/ReplyItem.tsx
import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Reply } from "../hooks/useReplies";
import { useTheme } from "../theme/ThemeContext";
import { timeAgo } from "../utils/timeAgo";
import ReactionPicker, { DEFAULT_REACTIONS } from "./Secret/ReactionPicker";
import { ReactionType } from "../hooks/useReactions";
import ActionButton from "./Secret/ActionButton";
import Avatar from "./Avatar";
import useReplyReactions from "../hooks/useReplyReactions";
import useMe from "../hooks/useMe";
import { useReplyMutations } from "../hooks/useReplyMutations";
import { useReplyComposer } from "../store/replyComposer";

interface Props {
  reply: Omit<Reply, "id"> | Reply; // reply without id (for pending replies
}

const ReplyItem: React.FC<Props> = ({ reply }) => {
  const { colors } = useTheme();
  const timestamp = timeAgo(reply.createdAt, "medium");
  const { user } = useMe();
  const isMine = user?.id === reply.author.id;
  const { deleteReply } = useReplyMutations(reply.secretId);
  const rc = useReplyComposer();

  const { counts, currentType, react } =
    "id" in reply
      ? useReplyReactions(reply.id, reply.secretId)
      : { counts: {}, currentType: null, react: (type: ReactionType) => {} };
  const totalReactions = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.outline, backgroundColor: colors.card },
      ]}
    >
      {/* Header: avatar, username, timestamp, and reaction */}
      <View style={styles.header}>
        <View style={styles.meta}>
          <Avatar
            handle={reply.author.handle}
            url={reply.author.avatarUrl}
            size={32}
          />
          <Text style={[styles.author, { color: colors.text }]}>
            {reply.author.handle}
          </Text>
          <Text style={[styles.dot, { color: colors.muted }]}>·</Text>
          <Text style={[styles.time, { color: colors.muted }]}>
            {timestamp}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {isMine && "id" in reply && (
            <>
              <ActionButton
                icon="pencil"
                onPress={() => {
                  rc.openEdit({ id: (reply as Reply).id, text: reply.text });
                }}
                size={26}
              />
              <ActionButton
                icon="trash"
                onPress={() =>
                  Alert.alert(
                    "Delete reply",
                    "Are you sure you want to delete this reply?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          deleteReply({ id: (reply as Reply).id }).catch((e) =>
                            alert(e.message)
                          );
                        },
                      },
                    ]
                  )
                }
                size={26}
              />
            </>
          )}
          <ReactionPicker
            value={currentType ?? null}
            onSelect={(k) => react(k as ReactionType)}
          >
            <ActionButton
              icon={
                currentType
                  ? (DEFAULT_REACTIONS.find((r) => r.key === currentType)
                      ?.icon as any)
                  : "heart"
              }
              onPress={() => react(currentType ?? ReactionType.Love)}
              label={totalReactions > 0 ? totalReactions : undefined}
              active={!!currentType}
              size={26}
            />
          </ReactionPicker>
        </View>
      </View>

      {/* Comment text */}
      <Text style={[styles.text, { color: colors.text }]}>{reply.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 5,
    marginHorizontal: 10,
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
    fontSize: 17,
    marginLeft: 10,
  },
  dot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  text: {
    fontSize: 17,
    lineHeight: 22,
    marginTop: 8,
  },
});

export default ReplyItem;
