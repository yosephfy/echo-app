import React, { useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { api } from "../api/client";
import useSocket from "../hooks/useSocket";
import SecretItem, { SecretItemProps } from "../components/SecretItem";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import usePaginatedData from "../hooks/usePaginatedData";

export default function FeedScreen() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const { data, loading, loadFirstPage, loadNextPage, isAtEnd } =
    usePaginatedData<SecretItemProps>("/secrets/feed");

  // real-time updates
  useSocket("secretCreated", (newItem: SecretItemProps) =>
    loadFirstPage((prev) => [newItem, ...prev])
  );

  useEffect(() => {
    if (token) loadFirstPage();
  }, [token]);

  if (!token) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {loading && data.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={data}
          refreshing={loading}
          onRefresh={() => loadFirstPage()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SecretItem {...item} />}
          onEndReached={() => !isAtEnd && loadNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ margin: 20 }} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
});
