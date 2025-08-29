// mobile/src/screens/ChatListScreen.tsx
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "../components/Avatar";
import { timeAgo } from "../utils/timeAgo";
import { useConversations } from "../hooks/chats/useConversation";
import { useStartChat } from "../hooks/chats/useStartChat"; // ⬅️ import
import { useNavigation } from "@react-navigation/native";

export default function ChatListScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { items, loading, hasMore, loadMore, refresh } = useConversations(20);
  const startChat = useStartChat();
  console.table(items);
  console.log(items);

  // simple client-side filter
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => {
      const h = c.peer?.handle?.toLowerCase() ?? "";
      const last = c.lastMessage?.body?.toLowerCase() ?? "";
      return h.includes(q) || last.includes(q);
    });
  }, [items, query]);

  const renderItem = ({ item }: any) => {
    const last = item.lastMessage;
    const preview = last?.attachmentUrl ? "📎 Attachment" : last?.body || "";
    const ts = last?.createdAt ? timeAgo(last.createdAt, "short") : "";
    return (
      <Pressable
        onPress={() => nav.navigate("ChatThread", { id: item.id })}
        style={[styles.row, { borderColor: colors.border }]}
      >
        <Avatar
          handle={item.peer?.handle ?? "user"}
          url={item.peer?.avatarUrl ?? undefined}
          size={44}
        />
        <View style={styles.rowCenter}>
          <Text style={[styles.handle, { color: colors.text }]}>
            @{item.peer?.handle}
          </Text>
          {!!preview && (
            <Text
              numberOfLines={1}
              style={[styles.preview, { color: colors.muted }]}
            >
              {preview}
            </Text>
          )}
        </View>
        <View style={styles.rowRight}>
          {!!ts && (
            <Text style={[styles.time, { color: colors.muted }]}>{ts}</Text>
          )}
          {item.unreadCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary, borderColor: colors.card },
              ]}
            >
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const listEmpty = () => (
    <View style={styles.center}>
      {loading ? (
        <>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: colors.muted }}>
            Loading conversations…
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No conversations yet
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>
            Tap the + button to start a new chat.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>

      <View
        style={[
          styles.searchWrap,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by handle or message…"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
        )}
        ListEmptyComponent={listEmpty}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={refresh}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Start New Chat FAB */}
      <Pressable
        accessibilityRole="button"
        disabled={startChat.isPending}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            opacity: startChat.isPending ? 0.6 : 1,
          },
        ]}
        onPress={() => {
          nav.navigate("UserPicker", {
            mode: "single",
            title: "Start New Chat",
            submitText: "Start",
            onSubmit: async (users: { id: string }[]) => {
              if (!users?.length) return;
              const peerUserId = users[0].id;
              try {
                const res = await startChat.mutateAsync(peerUserId);
                // Navigate straight into the new conversation
                nav.replace("ChatThread", { id: res.conversationId });
              } catch (e: any) {
                // Optional: show toast/alert
                console.log("Failed to start chat:", e?.message);
              }
            },
          });
        }}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: "700" },

  searchWrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { fontSize: 16 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowCenter: { flex: 1, marginLeft: 10, gap: 3 },
  handle: { fontSize: 16, fontWeight: "600" },
  preview: { fontSize: 13 },
  rowRight: { alignItems: "flex-end", gap: 6 },

  time: { fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: { color: "white", fontSize: 12, fontWeight: "700" },

  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },

  center: { paddingTop: 40, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  fabPlus: { color: "white", fontSize: 28, marginTop: -2 },
});
