import React, { useEffect, useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";

export default function BookmarksScreen() {
  const theme = useTheme();
  type Bookmark = { id: string; text: string };
  const [items, setItems] = useState<Bookmark[]>([]);

  useEffect(() => {
    api.get("/bookmarks").then((res: any) => setItems(res.data));
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.text }}>{item.text}</Text>
          </View>
        )}
      />
    </View>
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
