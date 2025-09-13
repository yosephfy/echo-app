import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";

const moodsCatalog = [
  "happy",
  "sad",
  "angry",
  "relieved",
  "anxious",
  "hopeful",
];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<string[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const toggleMood = (m: string) => {
    setSelected((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const load = useCallback(
    async (nextPage = 1) => {
      const params: { page: number; limit: number; moods?: string } = {
        page: nextPage,
        limit: 20,
      };
      if (selected.length) params.moods = selected.join(",");
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
    <View
      style={[
        styles.item,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text style={{ color: theme.colors.text }}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.chipRow}>
        {moodsCatalog.map((m) => {
          const active = selected.includes(m);
          return (
            <TouchableOpacity
              key={m}
              style={[
                styles.chip,
                active
                  ? {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.colors.primary,
                    }
                  : {
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                    },
              ]}
              onPress={() => toggleMood(m)}
            >
              <Text style={{ color: active ? "#fff" : theme.colors.text }}>
                {m}
              </Text>
            </TouchableOpacity>
          );
        })}
        {selected.length > 0 && (
          <TouchableOpacity
            onPress={() => setSelected([])}
            style={[styles.chip, { borderColor: theme.colors.error }]}
          >
            <Text style={{ color: theme.colors.error }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={feed}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onEndReached={() => feed.length < total && load(page + 1)}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  item: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
});
