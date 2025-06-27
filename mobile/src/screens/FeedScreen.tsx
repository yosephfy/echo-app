import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ComposeButton from "../components/ComposeButtonComponent";
import ComposerModal from "../components/ComposerModal";
import SecretItem, { SecretItemProps } from "../components/SecretItem";
import useCooldown from "../hooks/useCooldown";
import usePaginatedData from "../hooks/usePaginatedData";
import useSocket from "../hooks/useSocket";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";

export default function FeedScreen() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const { data, loading, loadFirstPage, loadNextPage, isAtEnd } =
    usePaginatedData<SecretItemProps>("/secrets/feed");
  const { remaining, duration, refresh } = useCooldown();

  const [composerActive, setComposerActive] = useState(false);
  // real-time updates
  useSocket("secretCreated", (newItem: SecretItemProps) =>
    loadFirstPage((prev) => [newItem, ...prev])
  );

  useEffect(() => {
    if (token) loadFirstPage();
  }, [token]);

  if (!token) return null;
  useEffect(() => {
    refresh();
  }, [composerActive]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ComposerModal
        visible={composerActive}
        onClose={() => setComposerActive(false)}
        onPosted={() => setComposerActive(false)}
      />
      <ComposeButton
        cooldown={remaining}
        totalCooldown={duration}
        onPress={() => setComposerActive(true)}
      />
      <View style={[styles.headerContainer, { borderColor: colors.border }]}>
        <Text style={styles.headerTitle}>Echo</Text>
      </View>
      {loading && data.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={data}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    height: 70,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 42,
  },
});
