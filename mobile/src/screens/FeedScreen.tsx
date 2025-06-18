import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { api } from "../api/client";
import io from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { useReactions } from "../hooks/useReactions";

interface SecretItem {
  id: string;
  text: string;
  mood?: string;
  status: string;
  createdAt: string;
}

interface FeedResponse {
  items: SecretItem[];
  total: number;
  page: number;
  limit: number;
}

export default function FeedScreen() {
  const [feed, setFeed] = useState<SecretItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.token);

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io("http://localhost:3000");
    socket.on("secretCreated", (secret: SecretItem) => {
      setFeed((current) => [secret, ...current]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const loadPage = useCallback(
    async (nextPage = 1) => {
      if (loading) return;
      setLoading(true);
      try {
        const res = await api.get<FeedResponse>("/secrets/feed", {
          page: nextPage,
          limit: 20,
        });
        setTotal(res.total);
        if (nextPage === 1) {
          setFeed(res.items);
        } else {
          setFeed((prev) => [...prev, ...res.items]);
        }
        setPage(res.page);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  useEffect(() => {
    if (token) {
      loadPage(1);
    }
  }, [token]);

  const handleEndReached = () => {
    if (feed.length < total) {
      loadPage(page + 1);
    }
  };

  function SecretItemComponent({ item }: { item: SecretItem }) {
    const { count, toggle } = useReactions(item.id);
    useEffect(() => {
      /* fetch initial count if needed */
    }, []);

    return (
      <View style={styles.item}>
        <Text style={styles.text}>{item.text}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={toggle}>
            <Text>❤️ {count}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              /* open reply thread */
            }}
          >
            <Text>💬 Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              /* bookmark hook */
            }}
          >
            <Text>🔖</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: SecretItem }) => (
    <SecretItemComponent item={item} />
  );

  if (!token) {
    return null; // or prompt to log in
  }

  return (
    <View style={styles.container}>
      {loading && page === 1 ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ margin: 20 }} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  item: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  text: { fontSize: 16, marginBottom: 4 },
  meta: { fontSize: 12, color: "#666" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
});
