import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet, SafeAreaView } from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";
import usePaginatedData from "../hooks/usePaginatedData";
import SecretItem, { SecretItemProps } from "../components/SecretItem";

export default function BookmarksScreen() {
  const theme = useTheme();
  type Bookmark = SecretItemProps;
  const [items, setItems] = useState<Bookmark[]>([]);
  const { data, loading, page, total, isAtEnd, loadFirstPage, loadNextPage } =
    usePaginatedData<Bookmark>("/bookmarks", { limit: 20 });

  useEffect(() => {
    //api.get("/bookmarks").then((res: any) => setItems(res.data));
    setItems(data);
  }, [data, loadFirstPage]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={items}
        style={{ flex: 1, padding: 12 }}
        contentContainerStyle={{ paddingBottom: 12 }}
        keyExtractor={(i) => i.id}
        onEndReached={loadNextPage}
        onEndReachedThreshold={0.5}
        refreshing={loading}
        onRefresh={loadFirstPage}
        renderItem={({ item }) => <SecretItem secret={item} />}
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
