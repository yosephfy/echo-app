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
import ReplyInput from "../components/ReplyInputComponent";
import ReplyItem from "../components/ReplyItem";
import SecretItem, { SecretItemProps } from "../components/SecretItem";
import { useReplies } from "../hooks/useReplies";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";

type Props = { route: RouteProp<RootStackParamList, "SecretDetail"> };

export default function SecretDetailScreen({ route }: Props) {
  const { secretId }: any = route.params;
  const { colors } = useTheme();
  const [secret, setSecret] = useState<SecretItemProps>();
  const [loadingSecret, setLoadingSecret] = useState(true);
  const { items, loading, refreshing, hasMore, loadMore, refresh, add } =
    useReplies(secretId);
  const [text, setText] = useState("");

  const loadSecret = useCallback(async () => {
    setLoadingSecret(true);
    try {
      const data: SecretItemProps = await api.get(`/secrets/find/${secretId}`);
      setSecret(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSecret(false);
    }
  }, [secretId]);

  useEffect(() => {
    loadSecret();
  }, [secretId]);

  const handleSend = async (reply: string) => {
    if (!reply.trim()) return;
    add(reply.trim());
    refresh();
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
      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.kind === "pending" ? `pending:${item.clientKey}` : item.reply.id
        }
        ListHeaderComponent={() =>
          secret && <SecretItem secret={secret} display="expanded" />
        }
        ListHeaderComponentStyle={[
          styles.secretItem,
          { borderColor: colors.outline, backgroundColor: colors.surface },
        ]}
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

      <ReplyInput onSend={handleSend} sending={false} secretId={secretId} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 16 },
  secretItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0, 0, 0, 0.16)",
    marginVertical: 10,
  },
});
