import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  useTrendingSecrets,
  useTrendingTags,
  useExploreSearch,
} from "../hooks/useDiscover";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";
import HashtagChip from "../components/HashtagChip";
import Chip from "../components/Chip";
import SecretItem from "../components/Secret/SecretItem";
import { TabParamList } from "../navigation/AppNavigator";

const moodsCatalog = [
  "happy",
  "sad",
  "angry",
  "relieved",
  "anxious",
  "hopeful",
];

type Props = NativeStackScreenProps<TabParamList, "Discover">;

export default function DiscoverScreen({ navigation }: Props) {
  const theme = useTheme();

  // Trending
  const trending = useTrendingSecrets(10, 24);

  // Explore state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [exploreSort, setExploreSort] = useState<"relevant" | "newest">(
    "relevant"
  );
  const tagsQuery = useTrendingTags(20, 24);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const clearSearch = useCallback(() => setSearchQuery(""), []);
  const toggleMood = useCallback((mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  }, []);
  const cycleSortOption = useCallback(
    () => setExploreSort((s) => (s === "relevant" ? "newest" : "relevant")),
    []
  );

  const exploreSearch = useExploreSearch(
    { q: debouncedQuery, moods: selectedMoods, sort: exploreSort },
    20
  );

  const renderTrendingItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View style={styles.trendingContent}>
        <SecretItem secret={item} navigation={navigation} display="normal" />
      </View>
    ),
    [navigation]
  );

  const ExploreHeader = () => (
    <View style={styles.exploreContainer}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            { borderColor: theme.colors.outline },
          ]}
        >
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
          <IconSvg
            icon={exploreSort === "newest" ? "calendar-day" : "fire"}
            size={16}
          />
          <Text style={[styles.sortButtonText, { color: theme.colors.text }]}>
            {exploreSort === "newest" ? "Newest" : "Relevant"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected mood pills + Clear all */}
      {(selectedMoods.length > 0 || searchQuery.length > 0) && (
        <View style={styles.selectedFiltersRow}>
          {selectedMoods.map((mood) => (
            <Chip
              key={mood}
              label={mood}
              selected
              variant="soft"
              size="sm"
              rightIcon="close-circle"
              onPress={() => toggleMood(mood)}
              style={{ marginRight: 8, marginBottom: 8 }}
            />
          ))}
          <Chip
            label="Clear all"
            variant="outline"
            size="sm"
            leftIcon="close-circle"
            onPress={() => {
              setSelectedMoods([]);
              setSearchQuery("");
            }}
            style={{ marginRight: 8, marginBottom: 8 }}
          />
        </View>
      )}

      {/* Mood Filter Chips */}
      <View style={styles.chipRow}>
        {moodsCatalog.map((mood) => (
          <Chip
            key={mood}
            label={mood}
            selected={selectedMoods.includes(mood)}
            onPress={() => toggleMood(mood)}
            variant="soft"
            size="md"
            widthMode="auto"
            style={{ marginRight: 8, marginBottom: 8 }}
          />
        ))}
      </View>

      {/* Show trending tags as suggestions when no search query */}
      {!debouncedQuery.trim() && (
        <>
          <View style={styles.sectionTitleRow}>
            <IconSvg icon="search-alt" state="default" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Explore
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.muted }]}>
            Tap a tag to search for related secrets
          </Text>
          {tagsQuery.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.tagGrid}>
              {tagsQuery.tags.slice(0, 10).map((item) => (
                <HashtagChip
                  key={item.tag}
                  tag={item.tag}
                  count={item.count}
                  isSelected={false}
                  onPress={() => setSearchQuery(`#${item.tag}`)}
                />
              ))}
            </View>
          )}
        </>
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
                <View style={styles.trendingContainer}>
                  <View style={styles.sectionTitleRow}>
                    <IconSvg icon="fire" state="default" />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      Trending Now
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sectionSubtitle,
                      { color: theme.colors.muted },
                    ]}
                  >
                    Popular secrets from the past 24 hours
                  </Text>
                </View>
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
          <Tabs.FlatList
            data={exploreSearch.items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <SecretItem
                secret={item}
                display="normal"
                navigation={navigation}
              />
            )}
            ListHeaderComponent={<ExploreHeader />}
            ListEmptyComponent={() =>
              debouncedQuery.trim() && !exploreSearch.loading ? (
                <View style={styles.emptyContainer}>
                  <IconSvg icon="search-alt" size={48} />
                  <Text
                    style={[styles.emptyTitle, { color: theme.colors.text }]}
                  >
                    No results found
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtitle,
                      { color: theme.colors.muted },
                    ]}
                  >
                    Try different keywords or check your spelling
                  </Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              exploreSearch.fetchingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              ) : null
            }
            onEndReached={() =>
              exploreSearch.hasMore &&
              !exploreSearch.fetchingMore &&
              exploreSearch.loadMore()
            }
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={exploreSearch.refreshing}
                onRefresh={exploreSearch.refresh}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: 24 }}
          />
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
  // Trending styles
  trendingContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
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
  // Selected filters
  selectedFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  // Explore styles
  exploreContainer: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 16,
  },
});
