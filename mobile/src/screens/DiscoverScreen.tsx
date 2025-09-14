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
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";
import HashtagChip from "../components/HashtagChip";
import SecretItem from "../components/SecretItem";
import { TabParamList } from "../navigation/AppNavigator";

const moodsCatalog = [
  "happy",
  "sad",
  "angry",
  "relieved",
  "anxious",
  "hopeful",
];

type SortOption = "newest" | "oldest" | "popular";
type ViewMode = "feed" | "trending" | "hashtags";

interface TrendingSecret {
  id: string;
  text: string;
  moods?: { code: string; label?: string }[];
  tags?: string[];
  status: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl: string };
}

interface TrendingTag {
  tag: string;
  count: number;
  slug: string;
  raw?: string;
}

const sortOptions: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Newest", icon: "calendar-day" },
  { key: "oldest", label: "Oldest", icon: "calendar-day" },
  { key: "popular", label: "Popular", icon: "fire" },
];

const viewModes: { key: ViewMode; label: string; icon: string }[] = [
  { key: "feed", label: "Feed", icon: "home" },
  { key: "trending", label: "Trending", icon: "fire" },
  { key: "hashtags", label: "Tags", icon: "bookmarks" },
];

// Mock trending hashtags (will be replaced with API call)
const mockTrendingTags = [
  { tag: "selfcare", count: 24 },
  { tag: "anxiety", count: 18 },
  { tag: "relationships", count: 15 },
  { tag: "work", count: 12 },
  { tag: "dreams", count: 9 },
  { tag: "growth", count: 8 },
];

type Props = NativeStackScreenProps<TabParamList, "Discover">;

export default function DiscoverScreen({ navigation }: Props) {
  const theme = useTheme();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [trendingSecrets, setTrendingSecrets] = useState<TrendingSecret[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Sort functionality
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  
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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]
    );
  };

  const loadTrending = useCallback(async () => {
    if (loadingTrending) return;
    
    setLoadingTrending(true);
    try {
      const res: { items: TrendingSecret[]; hours: number; limit: number } = 
        await api.get("/secrets/trending", { limit: 10, hours: 24 });
      setTrendingSecrets(res.items);
    } catch (error) {
      console.error("Failed to load trending secrets:", error);
      setTrendingSecrets([]);
    } finally {
      setLoadingTrending(false);
    }
  }, [loadingTrending]);

  const loadTrendingTags = useCallback(async () => {
    if (loadingTags) return;
    
    setLoadingTags(true);
    try {
      const res: TrendingTag[] = await api.get("/tags/trending", { limit: 20, hours: 24 });
      setTrendingTags(res);
    } catch (error) {
      console.error("Failed to load trending tags:", error);
      // Fallback to mock data if API fails
      setTrendingTags(mockTrendingTags.map(tag => ({ ...tag, slug: tag.tag, raw: tag.tag })));
    } finally {
      setLoadingTags(false);
    }
  }, [loadingTags]);

  const load = useCallback(
    async (nextPage = 1, isRefresh = false) => {
      if (loading && !isRefresh) return;
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params: { page: number; limit: number; moods?: string; tags?: string; search?: string } = {
          page: nextPage,
          limit: 20,
        };
        
        if (selectedMoods.length) params.moods = selectedMoods.join(",");
        if (selectedTags.length) params.tags = selectedTags.join(",");
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
    [selectedMoods, selectedTags, debouncedQuery, sortBy, loading]
  );

  useEffect(() => {
    if (viewMode === "feed") {
      load(1, true);
    } else if (viewMode === "trending") {
      loadTrending();
    } else if (viewMode === "hashtags") {
      loadTrendingTags();
    }
  }, [selectedMoods, selectedTags, debouncedQuery, sortBy, viewMode]);

  // Load trending data when switching to trending/hashtags view
  useEffect(() => {
    if (viewMode === "trending" && trendingSecrets.length === 0) {
      loadTrending();
    } else if (viewMode === "hashtags" && trendingTags.length === 0) {
      loadTrendingTags();
    }
  }, [viewMode]);

  const cycleSortOption = () => {
    const currentIndex = sortOptions.findIndex(option => option.key === sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex].key);
  };

  const clearAllFilters = () => {
    setSelectedMoods([]);
    setSelectedTags([]);
    setSearchQuery("");
    setSortBy("newest");
  };

  const renderTrendingContent = () => (
    <ScrollView style={styles.trendingContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        🔥 Trending Now
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
        Popular secrets from the past 24 hours
      </Text>
      
      {loadingTrending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading trending secrets...
          </Text>
        </View>
      ) : trendingSecrets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSvg icon="fire" size={48} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No trending secrets
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
            Check back later for trending content
          </Text>
        </View>
      ) : (
        <View>
          {trendingSecrets.map((secret, index) => (
            <View key={secret.id} style={styles.trendingItem}>
              <View style={styles.trendingRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.trendingContent}>
                <SecretItem
                  secret={secret}
                  display="condensed"
                  navigation={navigation}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderHashtagsContent = () => (
    <ScrollView style={styles.hashtagsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        🏷️ Trending Hashtags
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
        Discover secrets by popular topics
      </Text>
      
      {loadingTags ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading trending hashtags...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.hashtagGrid}>
            {trendingTags.map((item) => (
              <HashtagChip
                key={item.tag}
                tag={item.tag}
                count={item.count}
                isSelected={selectedTags.includes(item.tag)}
                onPress={toggleTag}
              />
            ))}
          </View>

          {selectedTags.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
                Secrets with selected tags
              </Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <View>
                  {feed.map((secret) => (
                    <SecretItem
                      key={secret.id}
                      secret={secret}
                      display="normal"
                      navigation={navigation}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderItem = ({ item }: any) => (
    <SecretItem
      secret={item}
      display="normal"
      navigation={navigation}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* View Mode Tabs */}
      <View style={styles.tabContainer}>
        {viewModes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.tab,
              {
                backgroundColor: viewMode === mode.key ? theme.colors.primary : 'transparent',
                borderBottomColor: viewMode === mode.key ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setViewMode(mode.key)}
          >
            <IconSvg 
              icon={mode.icon as any} 
              size={16} 
              state={viewMode === mode.key ? "pressed" : "default"}
            />
            <Text 
              style={[
                styles.tabText,
                { color: viewMode === mode.key ? "#fff" : theme.colors.text }
              ]}
            >
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === "feed" && (
        <>
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
            {(selectedMoods.length > 0 || selectedTags.length > 0 || searchQuery || sortBy !== "newest") && (
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
                {searchQuery || selectedMoods.length > 0 || selectedTags.length > 0
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
        </>
      )}

      {viewMode === "trending" && renderTrendingContent()}
      {viewMode === "hashtags" && renderHashtagsContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  // Trending styles
  trendingContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  trendingItem: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  trendingRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  rankNumber: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  trendingContent: {
    flex: 1,
  },
  // Hashtags styles
  hashtagsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  hashtagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
});
