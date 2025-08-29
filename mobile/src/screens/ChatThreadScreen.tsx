// mobile/src/screens/ChatThreadScreen.tsx
import React, { useRef, useEffect } from "react";
import {
  FlatList,
  View,
  TextInput,
  Button,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { useMessages } from "../hooks/chats/useMessages";
import { useAuthStore } from "../store/authStore";
import { pickAndUploadChatImage } from "../hooks/chats/useSendImage";

export default function ChatThreadScreen({ route }: any) {
  const { id } = route.params as { id: string };
  const { items, hasMore, loadMore, send, sending, markRead } = useMessages(
    id,
    30
  );
  const meId = useAuthStore((s) => s.user?.id);
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = React.useState("");

  useEffect(() => {
    markRead();
  }, [items.length]); // mark read when new messages arrive

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <FlatList
        data={items}
        keyExtractor={(m) => m.id ?? (m as any).__clientToken}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 8,
              alignItems: item.author.id === meId ? "flex-end" : "flex-start",
            }}
          >
            {!!item.attachmentUrl && <Text>[image]</Text>}
            <Text
              style={{ backgroundColor: "#eee", padding: 8, borderRadius: 8 }}
            >
              {item.body}
            </Text>
          </View>
        )}
        onEndReached={() => hasMore && loadMore()} // fetch next page (ASC forward)
        onEndReachedThreshold={0.5}
      />
      <View style={{ flexDirection: "row", padding: 8 }}>
        <Button
          title="📷"
          onPress={async () => {
            const url = await pickAndUploadChatImage(meId);
            if (url) await send("", url);
          }}
        />
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Message"
          style={{
            flex: 1,
            borderWidth: 1,
            marginHorizontal: 8,
            padding: 8,
            borderRadius: 8,
          }}
        />
        <Button
          title={sending ? "..." : "Send"}
          onPress={async () => {
            if (!text.trim()) return;
            await send(text.trim());
            setText("");
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
