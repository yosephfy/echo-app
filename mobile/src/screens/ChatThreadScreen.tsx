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
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useMessages } from "../hooks/chats/useMessages";
import { useAuthStore } from "../store/authStore";
import { pickAndUploadChatImage } from "../hooks/chats/useSendImage";
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
  const [isAtBottom, setIsAtBottom] = useState(true);
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

  // Auto-scroll to bottom:
  // - when you send a message (we scroll on content changes if you're already near bottom)
  // - when a new message arrives and you’re already at bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true })
    );
  }, []);

  useEffect(() => {
    // If at bottom or the latest message is authored by me, keep pinned to bottom
    if (!items.length) return;
    const last = items[items.length - 1];
    const isMine = last?.author?.id === meId;
    if (isAtBottom || isMine) {
      scrollToBottom();
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // on first load, scroll to bottom
    listRef.current?.scrollToEnd({ animated: false });
  }, [listRef]); // on mount

  const handleSend = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || sending) return;
      await send(trimmed);
      // Optimistic pending goes in; we’ll be at bottom after socket confirmation anyway,
      // but this keeps UX snappy.
      scrollToBottom();
    },
    [sending, send, scrollToBottom]
  );

  const handlePickImage = useCallback(async () => {
    const url = await pickAndUploadChatImage(meId);
    if (url) {
      await send("", url);
      scrollToBottom();
    }
  }, [meId, send, scrollToBottom]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      await loadMore(); // fetch newer pages (ASC forward)
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loadMore]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const paddingToBottom = 48; // px tolerance
    const atBottom =
      contentOffset.y + layoutMeasurement.height >=
      contentSize.height - paddingToBottom;
    setIsAtBottom(atBottom);
  }, []);

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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
      >
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(m: any) => m.id ?? m.__clientToken}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        {/* Composer */}
        <ChatInputComponent
          onSend={handleSend}
          sending={sending}
          placeholder="Message"
          multiline
          onFocus={() => setTimeout(scrollToBottom, 50)}
          onPickImage={handlePickImage}
          sendOnEnter
        />
      </KeyboardAvoidingView>
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
