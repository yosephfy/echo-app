// screens/SecretDetailScreen.tsx
import { RouteProp } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";
import { api } from "../api/client";
import { useEntities } from "../store/entities";
import ReplyInput from "../components/ReplyInputComponent";
import ReplyItem from "../components/ReplyItem";
import SecretItem, { SecretItemProps } from "../components/Secret/SecretItem";
import ComposerModal from "../components/ComposerModal";
import { useReplies } from "../hooks/useReplies";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";

type Props = { route: RouteProp<RootStackParamList, "SecretDetail"> };

export default function SecretDetailScreen({ route }: Props) {
  const { secretId }: any = route.params;
  const { colors } = useTheme();
  const secret = useEntities((s) => s.secrets[secretId]);
  const upsertSecrets = useEntities((s) => s.upsertSecrets);
  const [loadingSecret, setLoadingSecret] = useState(!secret);
  const { items, loading, refreshing, hasMore, loadMore, refresh, add } =
    useReplies(secretId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const loadSecret = useCallback(async () => {
    // If we already have it in the zustand entities store, nothing to fetch
    const existing = useEntities.getState().secrets[secretId];
    if (existing) {
      setLoadingSecret(false);
      return;
    }
    setLoadingSecret(true);
    try {
      const data: any = await api.get(`/secrets/find/${secretId}`);
      // upsert into entities store so other components can reuse
      upsertSecrets([data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSecret(false);
    }
  }, [secretId, upsertSecrets]);

  useEffect(() => {
    loadSecret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretId]);

  // Build a display-friendly secret shape from entities store
  const author = useEntities((s) =>
    secret ? s.users[secret.authorId] : undefined
  );
  const secretForDisplay: SecretItemProps | undefined = secret
    ? {
        id: secret.id,
        text: secret.text,
        moods: secret.moods,
        tags: secret.tags,
        status: secret.status,
        createdAt:
          typeof secret.createdAt === "string"
            ? secret.createdAt
            : String(secret.createdAt),
        author: {
          id: author?.id ?? secret.authorId,
          handle: author?.handle ?? "user",
          avatarUrl: author?.avatarUrl ?? "",
        },
      }
    : undefined;

  const handleSend = async (reply: string) => {
    const body = reply.trim();
    if (!body) return;
    try {
      setSending(true);
      await add(body);
      // No manual refresh; useReplies handles optimistic update and cache
    } finally {
      setSending(false);
    }
  };

  if (loadingSecret) {
    return (
      <SafeAreaView
        style={[styles.center, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ComposerModal />
      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.kind === "pending" ? `pending:${item.clientKey}` : item.reply.id
        }
        ListHeaderComponent={() =>
          secretForDisplay && (
            <SecretItem secret={secretForDisplay} display="expanded" />
          )
        }
        ListHeaderComponentStyle={[styles.secretItem]}
        renderItem={({ item }) => <ReplyItem reply={item.reply} />}
        ListEmptyComponent={() => (
          <Text style={[styles.empty, { color: colors.muted }]}>
            No replies yet
          </Text>
        )}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
      />

      <ReplyInput onSend={handleSend} sending={sending} secretId={secretId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 16 },
  secretItem: {
    marginVertical: 10,
  },
});
