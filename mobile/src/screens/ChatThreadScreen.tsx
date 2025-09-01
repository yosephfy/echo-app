// mobile/src/screens/ChatThreadScreen.tsx
import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  FlatList,
  View,
  Text,
  SafeAreaView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useMessages } from "../hooks/chats/useMessages";
import { useAuthStore } from "../store/authStore";
import { uploadFile, StorageKind } from "../utils/storage";
import { useIsFocused } from "@react-navigation/native";
import ChatInputComponent from "../components/ChatInputComponent";

type Props = { route: { params: { id: string } } };

export default function ChatThreadScreen({ route }: Props) {
  const { id: conversationId } = route.params;
  const { items, hasMore, loadMore, send, sending, markRead } = useMessages(
    conversationId,
    30
  );
  const meId = useAuthStore((s) => s.user?.id);
  const isFocused = useIsFocused();

  const listRef = useRef<FlatList<any>>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // newest non-pending message timestamp/id (for read receipts)
  const newestKey = useMemo(() => {
    for (let i = items.length - 1; i >= 0; i--) {
      const m: any = items[i];
      if (!m?.__pending && (m?.id || m?.createdAt)) {
        return m.id ?? m.createdAt;
      }
    }
    return undefined;
  }, [items]);

  // Mark read when: newest non-pending changes OR screen refocuses
  useEffect(() => {
    if (newestKey) markRead();
  }, [newestKey]);
  useEffect(() => {
    if (isFocused && newestKey) markRead();
  }, [isFocused, newestKey]);

  // no-op: inverted list anchors content at bottom

  const handleSend = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || sending) return;
      await send(trimmed);
    },
    [sending, send]
  );

  const handleSendWithAttachments = useCallback(
    async (
      body: string,
      atts: { uri: string; mimeType?: string; name?: string }[]
    ) => {
      const trimmed = body.trim();

      // 1) If there is text, send it as a normal message
      if (trimmed.length > 0) {
        await send(trimmed);
      }

      // 2) Upload and send each attachment as its own message
      for (const a of atts) {
        try {
          const { url } = await uploadFile(
            { localUri: a.uri },
            {
              kind: StorageKind.CHAT_IMAGE,
              ids: { userId: meId },
              transform: { quality: 0.65, maxWidth: 1920, maxHeight: 1920 },
              contentType: a.mimeType,
              fileName: a.name,
            }
          );
          await send("", url, a.mimeType);
        } catch (e) {
          // optional: could show a toast; for now just continue with others
          // console.warn("Failed to upload attachment:", e);
        }
      }
    },
    [meId, send, sending]
  );

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMore(); // fetch newer pages (ASC forward)
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadMore]);

  // Inverted list handles bottom anchoring; no manual onScroll needed

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isMine = item?.author?.id === meId;
      const pending = !!item?.__pending;

      return (
        <View
          style={[
            styles.msgRow,
            { justifyContent: isMine ? "flex-end" : "flex-start" },
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
              pending && styles.bubblePending,
            ]}
          >
            {!!item.attachmentUrl && (
              <Image
                source={{ uri: item.attachmentUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            {!!item.body && !!item.body.length && (
              <Text
                style={[
                  styles.bodyText,
                  isMine ? styles.bodyMine : styles.bodyOther,
                ]}
              >
                {item.body}
              </Text>
            )}
            {pending && (
              <View style={styles.rowEnd}>
                <ActivityIndicator size="small" />
              </View>
            )}
          </View>
        </View>
      );
    },
    [meId]
  );

  const invertedData = useMemo(() => [...items].reverse(), [items]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ref={listRef}
        data={invertedData}
        keyExtractor={(m: any) => m.id ?? m.__clientToken}
        renderItem={renderItem}
        inverted
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
          autoscrollToTopThreshold: 10,
        }}
      />

      {/* Composer */}
      <ChatInputComponent
        onSend={handleSend}
        onSendAttachments={handleSendWithAttachments}
        sending={sending}
        placeholder="Message"
        multiline
        sendOnEnter
        keyboardVerticalOffset={
          Platform.select({ ios: 24, android: 0 }) as number
        }
        useKeyboardAvoidingView
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  flex: { flex: 1 },
  listContent: { paddingVertical: 8, paddingHorizontal: 10 },
  footer: { paddingVertical: 12 },
  msgRow: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleMine: { backgroundColor: "#DCF8C6", borderTopRightRadius: 4 },
  bubbleOther: { backgroundColor: "#F2F2F7", borderTopLeftRadius: 4 },
  bubblePending: { opacity: 0.6 },
  bodyText: { fontSize: 16, lineHeight: 21 },
  bodyMine: { color: "#073B0D" },
  bodyOther: { color: "#222" },
  rowEnd: { marginTop: 4, alignSelf: "flex-end" },
  image: { width: 180, height: 180, borderRadius: 10, marginBottom: 6 },
});
