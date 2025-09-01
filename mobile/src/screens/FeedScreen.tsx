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
import { TabParamList } from "../navigation/AppNavigator";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";
import useCooldown from "../hooks/useCooldown";

type Props = NativeStackScreenProps<TabParamList, "Feed">;

export default function FeedScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);

  // New useFeed API
  const {
    items,
    loading,
    refreshing,
    fetchingMore,
    hasMore,
    loadMore,
    refresh,
  } = useFeed(10);

  const { remaining, duration, refresh: refreshCooldown } = useCooldown();
  const [composerActive, setComposerActive] = useState(false);

  // Real-time: on new secret, refresh feed + cooldown
  useSocket("secretCreated", (_newItem: SecretItemProps) => {
    refresh();
    refreshCooldown();
  });

  // Gate rendering if not authenticated
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
      <View
        style={[
          styles.headerContainer,
          { borderColor: colors.outline, backgroundColor: colors.surface },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Echo</Text>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={refresh}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SecretItem secret={item} navigation={navigation} />
          )}
          onEndReached={() => {
            if (hasMore) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            fetchingMore ? <ActivityIndicator style={{ margin: 20 }} /> : null
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
