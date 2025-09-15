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
  RefreshControl,
} from "react-native";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../api/client";
import {
  useTrendingSecrets,
  useTrendingTags,
  useTagFeed,
  useExploreSearch,
} from "../hooks/useDiscover";
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
type ViewMode = "trending" | "hashtags";

interface TrendingSecret {
  id: string;
  text: string;
  moods?: { code: string; label?: string }[];
  tags?: string[];
  status: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl: string };
  reactionsCount?: number;
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
  { key: "trending", label: "Trending", icon: "fire" },
  { key: "hashtags", label: "Tags", icon: "bookmarks" },
];

// Note: previously had mockTrendingTags; removed to rely on API-only

type Props = NativeStackScreenProps<TabParamList, "Discover">;

export default function DiscoverScreen({ navigation }: Props) {
  const theme = useTheme();
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // React Query hooks for Discover
  const trending = useTrendingSecrets(10, 24);
  const tagsQuery = useTrendingTags(20, 24);
  const tagFeed = useTagFeed(
    { tags: selectedTags, moods: selectedMoods, search: "" },
    20
  );

  // Explore search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [exploreSort, setExploreSort] = useState<'newest' | 'relevant'>('newest');
  const exploreSearch = useExploreSearch(
    { q: debouncedQuery, moods: selectedMoods, sort: exploreSort },
    20
  );

  // Sort functionality (keeping for potential future use)
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Tabs: we'll mirror Profile's MaterialTabBar; no local viewMode state needed

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

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedMoods([]);
  };

  const cycleSortOption = () => {
    setExploreSort(prev => prev === 'newest' ? 'relevant' : 'newest');
  };

  // Renderers for tabs
  const renderTrendingItem = ({ item }: { item: TrendingSecret }) => (
    <View style={styles.trendingContent}>
      <SecretItem secret={item} navigation={navigation} />
    </View>
  );

  const renderHashtagsContent = () => (
    <View style={styles.hashtagsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        🏷️ Trending Hashtags
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
        Discover secrets by popular topics
      </Text>

      {tagsQuery.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Loading trending hashtags...
          </Text>
        </View>
      ) : (
        <>
          {tagsQuery.tags.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSvg icon="bookmarks" size={40} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No trending tags yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.colors.muted }]}
              >
                Tags will appear as people use #hashtags. Pull to refresh.
              </Text>
              <TouchableOpacity
                onPress={() => tagsQuery.refresh()}
                style={[
                  styles.sortButton,
                  { borderColor: theme.colors.outline },
                ]}
              >
                <Text
                  style={[styles.sortButtonText, { color: theme.colors.text }]}
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.hashtagGrid}>
              {tagsQuery.tags.map((item) => (
                <HashtagChip
                  key={item.tag}
                  tag={item.tag}
                  count={item.count}
                  isSelected={selectedTags.includes(item.tag)}
                  onPress={toggleTag}
                />
              ))}
            </View>
          )}

          {selectedTags.length > 0 && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.text, marginTop: 24 },
                ]}
              >
                Secrets with selected tags
              </Text>
              {tagFeed.loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                </View>
              ) : (
                <View>
                  {tagFeed.items.map((secret) => (
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
    </View>
  );

  const renderExploreContent = () => (
    <View style={styles.exploreContainer}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={[styles.searchContainer, { borderColor: theme.colors.outline }]}>
          <IconSvg icon="search-alt" size={20} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search secrets or #hashtags..."
            placeholderTextColor={theme.colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <IconSvg icon="close-circle" size={16} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={cycleSortOption}
          style={[styles.sortButton, { borderColor: theme.colors.outline }]}
        >
          <IconSvg icon={exploreSort === 'newest' ? 'calendar-day' : 'fire'} size={16} />
          <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
            {exploreSort === 'newest' ? 'Newest' : 'Relevant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mood Filter Chips */}
      <View style={styles.chipRow}>
        {moodsCatalog.map((mood) => (
          <TouchableOpacity
            key={mood}
            style={[
              styles.chip,
              {
                backgroundColor: selectedMoods.includes(mood)
                  ? theme.colors.primary + '20'
                  : 'transparent',
                borderColor: selectedMoods.includes(mood)
                  ? theme.colors.primary
                  : theme.colors.outline,
              },
            ]}
            onPress={() => toggleMood(mood)}
          >
            <Text
              style={{
                color: selectedMoods.includes(mood)
                  ? theme.colors.primary
                  : theme.colors.text,
              }}
            >
              {mood}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show trending tags as suggestions when no search query */}
      {!debouncedQuery.trim() && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🏷️ Trending Tags
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
            Tap a tag to search for related secrets
          </Text>
          {tagsQuery.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.hashtagGrid}>
              {tagsQuery.tags.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.tag}
                  onPress={() => setSearchQuery(`#${item.tag}`)}
                >
                  <HashtagChip
                    tag={item.tag}
                    count={item.count}
                    isSelected={false}
                    onPress={() => setSearchQuery(`#${item.tag}`)}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* Search Results */}
      {exploreSearch.items.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24 }]}>
            Search Results ({exploreSearch.total})
          </Text>
          <View>
            {exploreSearch.items.map((secret) => (
              <SecretItem
                key={secret.id}
                secret={secret}
                display="normal"
                navigation={navigation}
              />
            ))}
            {exploreSearch.fetchingMore && (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </View>
        </>
      )}

      {/* Empty state for search */}
      {debouncedQuery.trim() && exploreSearch.items.length === 0 && !exploreSearch.loading && (
        <View style={styles.emptyContainer}>
          <IconSvg icon="search-alt" size={48} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.muted }]}>
            Try different keywords or check your spelling
          </Text>
        </View>
      )}

      {/* Loading state */}
      {exploreSearch.loading && exploreSearch.items.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
            Searching secrets...
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <Tabs.Container
        lazy={false}
        containerStyle={{ backgroundColor: theme.colors.background }}
        renderTabBar={(props) => (
          <MaterialTabBar
            {...props}
            labelStyle={styles.tabLabel}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.muted}
            indicatorStyle={{ backgroundColor: theme.colors.primary }}
            style={{ backgroundColor: theme.colors.background, elevation: 0 }}
            tabStyle={styles.tabStyle}
          />
        )}
      >
        <Tabs.Tab
          name="Trending"
          key="trending"
          label={() => (
            <View style={styles.tabLabelRow}>
              <IconSvg icon="fire" state="default" />
              <Text style={[styles.tabLabelText, { color: theme.colors.text }]}>
                Trending
              </Text>
            </View>
          )}
        >
          {trending.loading && trending.items.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.muted }]}>
                Loading trending secrets...
              </Text>
            </View>
          ) : trending.items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSvg icon="fire" size={48} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No trending secrets
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: theme.colors.muted }]}
              >
                Check back later for trending content
              </Text>
            </View>
          ) : (
            <Tabs.FlatList
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
              data={trending.items}
              keyExtractor={(i) => i.id}
              renderItem={renderTrendingItem}
              onEndReached={() =>
                trending.hasMore &&
                !trending.fetchingMore &&
                trending.loadMore()
              }
              onEndReachedThreshold={0.5}
              ListHeaderComponent={() => (
                <>
                  <Text
                    style={[styles.sectionTitle, { color: theme.colors.text }]}
                  >
                    🔥 Trending Now
                  </Text>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: theme.colors.muted },
                    ]}
                  >
                    Popular secrets from the past 24 hours
                  </Text>
                </>
              )}
              ListFooterComponent={() =>
                trending.fetchingMore && trending.items.length > 0 ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  </View>
                ) : null
              }
              onRefresh={() => trending.refresh()}
              refreshing={trending.refreshing}
            />
          )}
        </Tabs.Tab>

        <Tabs.Tab
          name="Explore"
          key="explore"
          label={() => (
            <View style={styles.tabLabelRow}>
              <IconSvg icon="search-alt" state="default" />
              <Text style={[styles.tabLabelText, { color: theme.colors.text }]}>
                Explore
              </Text>
            </View>
          )}
        >
          <Tabs.ScrollView
            style={styles.exploreContainer}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={exploreSearch.refreshing}
                onRefresh={exploreSearch.refresh}
                tintColor={theme.colors.primary}
              />
            }
          >
            {renderExploreContent()}
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  tabLabel: { textTransform: "capitalize", fontSize: 14 },
  tabStyle: { width: "auto", paddingHorizontal: 0 },
  tabLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tabLabelText: { fontSize: 14, fontWeight: "600" },
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
    marginBottom: 12,
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
  // Explore styles
  exploreContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
