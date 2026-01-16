import React from "react";
import { FlatList, SafeAreaView, StyleSheet } from "react-native";
import SecretItem from "../components/Secret/SecretItem";
import { useBookmarks } from "../hooks/useBookmarks";
import { useTheme } from "../theme/ThemeContext";

export default function BookmarksScreen({ navigation }: any) {
  const theme = useTheme();
  const {
    items,
    loadMore,
    hasMore,
    refresh,
    refreshing,
  } = useBookmarks(10);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={items}
        style={{ flex: 1, padding: 12 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        keyExtractor={(i) => i.id}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={() => refresh()}
        renderItem={({ item }) => (
          <SecretItem secret={item} navigation={navigation} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  item: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
});
