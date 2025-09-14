import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";

const moodsCatalog = [
  "happy",
  "sad",
  "angry",
  "relieved",
  "anxious",
  "hopeful",
];

type SortOption = "newest" | "oldest" | "popular";

const sortOptions: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Newest", icon: "calendar-day" },
  { key: "oldest", label: "Oldest", icon: "calendar-day" },
  { key: "popular", label: "Popular", icon: "fire" },
];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Sort functionality
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const toggleMood = (m: string) => {
    setSelectedMoods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const load = useCallback(
    async (nextPage = 1, isRefresh = false) => {
      if (loading && !isRefresh) return;
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params: { page: number; limit: number; moods?: string; search?: string } = {
          page: nextPage,
          limit: 20,
        };
        
        if (selectedMoods.length) params.moods = selectedMoods.join(",");
        if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
        
        const res: any = await api.get("/secrets/feed", params);
        
        // Sort results based on selected sort option
        let sortedItems = res.items;
        if (sortBy === "oldest") {
          sortedItems = [...res.items].sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        } else if (sortBy === "popular") {
          // For now, we'll sort by a simple heuristic (could be enhanced with actual popularity data)
          sortedItems = [...res.items].sort((a, b) => 
            (b.reactionsCount || 0) - (a.reactionsCount || 0)
          );
        }
        // "newest" is default sort from backend
        
        setFeed((prev) => (nextPage === 1 ? sortedItems : [...prev, ...sortedItems]));
        setTotal(res.total);
        setPage(res.page);
      } catch (error) {
        console.error("Failed to load feed:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMoods, debouncedQuery, sortBy, loading]
  );

  useEffect(() => {
    load(1, true);
  }, [selectedMoods, debouncedQuery, sortBy]);

  const cycleSortOption = () => {
    const currentIndex = sortOptions.findIndex(option => option.key === sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex].key);
  };

  const clearAllFilters = () => {
    setSelectedMoods([]);
    setSearchQuery("");
    setSortBy("newest");
  };

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
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            {
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <IconSvg icon="search-alt" size={18} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search secrets..."
            placeholderTextColor={theme.colors.muted}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery("")}>
              <IconSvg icon="wrong" size={16} />
            </Pressable>
          )}
        </View>
        
        {/* Sort Button */}
        <Pressable
          onPress={cycleSortOption}
          style={[
            styles.sortButton,
            {
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <IconSvg 
            icon={sortOptions.find(opt => opt.key === sortBy)?.icon as any || "calendar-day"} 
            size={16} 
          />
          <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
            {sortOptions.find(opt => opt.key === sortBy)?.label}
          </Text>
        </Pressable>
      </View>

      {/* Mood Filter Chips */}
      <View style={styles.chipRow}>
        {moodsCatalog.map((m) => {
          const active = selectedMoods.includes(m);
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
        {(selectedMoods.length > 0 || searchQuery || sortBy !== "newest") && (
          <TouchableOpacity
            onPress={clearAllFilters}
            style={[
              styles.chip, 
              { 
                borderColor: theme.colors.error,
                backgroundColor: theme.colors.error + "20",
              }
            ]}
          >
            <Text style={{ color: theme.colors.error }}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading && feed.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Discovering secrets...
          </Text>
        </View>
      ) : feed.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSvg icon="search-alt" size={48} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No secrets found
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
            {searchQuery || selectedMoods.length > 0
              ? "Try adjusting your search or filters"
              : "Be the first to share a secret!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          onEndReached={() => feed.length < total && !loading && load(page + 1)}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={() => load(1, true)}
          ListFooterComponent={() =>
            loading && feed.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  chipRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    paddingHorizontal: 16,
    marginBottom: 12 
  },
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
    marginHorizontal: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
