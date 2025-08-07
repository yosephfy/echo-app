import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
import { useFeed } from "../hooks/useFeed";
import useSocket from "../hooks/useSocket";
import { AppStackParamList } from "../navigation/AppNavigator";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import useCooldown from "../hooks/useCooldown";

type Props = NativeStackScreenProps<AppStackParamList, "Feed">;

export default function FeedScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const {
    items,
    loading,
    loadMore,
    loadPage,
    hasMore,
    limit,
    page,
    refresh,
    refreshing,
    total,
  } = useFeed(20, token);
  const { remaining, duration, refresh: refreshCooldown } = useCooldown();

  const [composerActive, setComposerActive] = useState(false);
  // real-time updates
  useSocket("secretCreated", (newItem: SecretItemProps) => {
    loadPage(1, true);
    refreshCooldown();
  });

  useEffect(() => {
    if (token) loadPage(1, true);
  }, [token]);

  if (!token) return null;
  useEffect(() => {
    refreshCooldown();
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
        onPress={() => setComposerActive(true)}
        composerActive={composerActive}
      />
      <View style={[styles.headerContainer, { borderColor: colors.border }]}>
        <Text style={styles.headerTitle}>Echo</Text>
      </View>
      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          style={{ flex: 1 }}
          contentContainerStyle={{}}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => loadPage(1, true)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SecretItem secret={item} navigation={navigation} />
          )}
          onEndReached={() => {
            console.log("End reached");
            loadMore();
          }}
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
