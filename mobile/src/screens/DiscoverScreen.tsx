import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";

const moods = ["happy", "sad", "angry", "relieved"];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    async (nextPage = 1) => {
      const params: { page: number; limit: number; mood?: string } = {
        page: nextPage,
        limit: 20,
      };
      if (selected) {
        params.mood = selected;
      }
      const res: any = await api.get("/secrets/feed", params);
      setFeed((prev) => (nextPage === 1 ? res.items : [...prev, ...res.items]));
      setTotal(res.total);
      setPage(res.page);
    },
    [selected]
  );

  useEffect(() => {
    load(1);
  }, [selected]);

  const renderItem = ({ item }: any) => (
    <View style={[styles.item, { borderColor: theme.colors.border }]}>
      <Text style={{ color: theme.colors.text }}>{item.text}</Text>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.chipRow}>
        {moods.map((m) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.chip,
              selected === m && {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary,
              },
            ]}
            onPress={() => setSelected((s) => (s === m ? null : m))}
          >
            <Text
              style={{ color: selected === m ? "#fff" : theme.colors.text }}
            >
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={feed}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onEndReached={() => feed.length < total && load(page + 1)}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  chipRow: { flexDirection: "row", marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  item: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
});
