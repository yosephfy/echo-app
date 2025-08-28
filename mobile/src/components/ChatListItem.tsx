import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Avatar from "./Avatar";
import { useTheme } from "../theme/ThemeContext";
import { ChatConversation } from "../hooks/chats/types";

function timeAgoShort(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d2 = Math.floor(h / 24);
  return `${d2}d`;
}

export default React.memo(function ChatListItem({
  conv,
  typing,
  onPress,
  onPressIn,
}: {
  conv: ChatConversation;
  typing: boolean;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  const { colors } = useTheme();
  const preview = typing
    ? "Typing…"
    : conv.lastMessage?.attachmentUrl
      ? "📷 Photo"
      : conv.lastMessage?.body || "";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.border + "33" : "transparent" },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${conv.peer?.handle}. ${conv.unreadCount || 0} unread messages.`}
    >
      <Avatar
        handle={conv.peer?.handle ?? "user"}
        url={conv.peer?.avatarUrl ?? undefined}
        size={48}
      />
      <View style={styles.center}>
        <Text style={[styles.handle, { color: colors.text }]}>
          @{conv.peer?.handle}
        </Text>
        <Text
          style={[
            styles.preview,
            { color: typing ? colors.primary : colors.muted },
            conv.unreadCount > 0 && { fontWeight: "600", color: colors.text },
          ]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.time, { color: colors.muted }]}>
          {timeAgoShort(conv.lastMessage?.createdAt ?? "")}
        </Text>
        {conv.unreadCount > 0 && (
          <View
            style={styles.badge}
            accessibilityLabel={`Unread ${conv.unreadCount}`}
          >
            <Text style={styles.badgeText}>
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  center: { flex: 1, marginLeft: 12 },
  handle: { fontSize: 16, fontWeight: "600" },
  preview: { marginTop: 2, fontSize: 13 },
  meta: { alignItems: "flex-end", gap: 6 },
  time: { fontSize: 12 },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
