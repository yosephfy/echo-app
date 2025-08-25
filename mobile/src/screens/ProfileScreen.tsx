import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../components/Avatar";
import SecretItem, { SecretItemProps } from "../components/SecretItem";
import useMe from "../hooks/useMe";
import usePaginatedData from "../hooks/usePaginatedData";
import { useUserStats } from "../hooks/useUserStats";
import { IconSvg } from "../icons/IconSvg";
import { TabParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";

type ContentType = "secrets" | "bookmarks" | "reactions" | "caps";

const TAB_CONFIG: { key: ContentType; title: string; path: string }[] = [
  { key: "secrets", title: "Secrets", path: "/secrets/secretslist/me" },
  { key: "bookmarks", title: "Bookmarks", path: "/bookmarks" },
  { key: "reactions", title: "Reactions", path: "/secrets/secretslist/me" },
  { key: "caps", title: "Caps", path: "/secrets/secretslist/me" },
];

// --- Subcomponents ---

function TopBar({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.topBar, { backgroundColor: colors.background }]}>
      <View style={styles.leftPlaceholder} />
      <View style={styles.rightIcons}>
        <TouchableOpacity
          onPress={() => navigation.navigate("AccountSettings")}
          style={styles.iconButton}
        >
          <IconSvg icon="help" size={24} state="default" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("AccountSettings")}
          style={styles.iconButton}
        >
          <IconSvg icon="settings" size={24} state="default" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ProfileHeader({
  handle,
  avatarUrl,
  bio,
  navigation,
}: {
  handle: string;
  avatarUrl: string;
  bio?: string;
  navigation?: any;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.profileHeader, { backgroundColor: colors.background }]}
    >
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("AccountSettings", { screen: "EditProfile" })
        }
      >
        <Avatar url={avatarUrl} handle={handle} size={80} />
      </TouchableOpacity>
      <View style={styles.handleRow}>
        <Text style={[styles.handleText, { color: colors.text }]}>
          @{handle}
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AccountSettings", { screen: "EditProfile" })
          }
          style={styles.editButton}
        >
          <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bioRow}>
        <Text style={[styles.bioText, { color: colors.muted }]}>{bio}</Text>
      </View>
    </View>
  );
}

function StatsRow({ stats }: { stats: Record<string, number> }) {
  const { colors } = useTheme();
  // map stat labels to icons
  const ICON_MAP_STATS: Record<string, string> = {
    Posts: "cards",
    Bookmarks: "bookmarks",
    Streak: "fire",
    Reactions: "heart-alt",
    Caps: "cap",
  };

  return (
    <FlatList
      data={Object.entries(stats)}
      renderItem={({ item: [label, value] }) => {
        const iconName = ICON_MAP_STATS[label] || "circle-user";
        return (
          <View
            key={label}
            style={[styles.statCard, { borderColor: colors.border }]}
          >
            <IconSvg icon={iconName as any} size={24} state="default" />
            <Text style={[styles.statValue, { color: colors.muted }]}>
              {value}
            </Text>
          </View>
        );
      }}
      horizontal
      scrollEnabled={false}
      contentContainerStyle={[styles.statsRow]}
    />
  );
}

type Props = NativeStackScreenProps<TabParamList, "Profile">;
export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { stats, loading: statsLoading } = useUserStats();
  const { user } = useMe(); // ensure me is loaded for handle/avatar
  const [activeTab, setActiveTab] = useState<ContentType>(TAB_CONFIG[0].key);

  // Paginated data for active tab
  const {
    data: tabItems,
    loading: tabLoading,
    loadFirstPage: loadTab,
    loadNextPage: loadMore,
  } = usePaginatedData<SecretItemProps>(
    TAB_CONFIG.find((t) => t.key === activeTab)!.path
  );

  // Refresh when tab changes
  useEffect(() => {
    loadTab();
  }, [activeTab]);

  if (statsLoading || !stats) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const statsMap = {
    Posts: stats.postsCount,
    Bookmarks: stats.bookmarksCount,
    Streak: stats.currentStreak,
    Reactions: stats.totalReactions,
    Caps: stats.totalCaps,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={styles.container}>
        <SectionList
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: colors.background,
          }}
          sections={[
            { key: "top", data: [0] },
            //{ key: "carousel", data: [0] },
            { key: "tabs", data: [0] },
          ]}
          keyExtractor={(_, i) => String(i)}
          renderSectionHeader={({ section }) => {
            switch (section.key) {
              case "top":
                return (
                  <>
                    <TopBar navigation={navigation} />
                    <ProfileHeader
                      handle={user?.handle ?? ""}
                      avatarUrl={user?.avatarUrl ?? ""}
                      bio={user?.bio ?? ""}
                      navigation={navigation}
                    />
                    <StatsRow stats={statsMap} />
                  </>
                );
              case "carousel":
                return (
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recent Activity
                  </Text>
                );
              case "tabs":
                return (
                  <View
                    style={[
                      styles.tabBarContainer,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    {TAB_CONFIG.map((tab) => (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.tabButton,
                          activeTab === tab.key && {
                            borderBottomColor: colors.primary,
                          },
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                      >
                        <Text
                          style={{
                            color:
                              activeTab === tab.key
                                ? colors.primary
                                : colors.muted,
                          }}
                        >
                          {tab.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              default:
                return null;
            }
          }}
          renderItem={
            ({ section }) => null
            /* section.key === "carousel" ? (
              <RecentCarousel navigation={navigation} />
            ) : null */
          }
          // Render content below tabs
          ListFooterComponent={() => (
            <View style={{ flex: 1 }}>
              {tabLoading && tabItems.length === 0 ? (
                <ActivityIndicator
                  style={{ marginTop: 32 }}
                  color={colors.primary}
                />
              ) : (
                <FlatList
                  data={tabItems}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <SecretItem secret={item} navigation={navigation} />
                  )}
                  refreshControl={
                    <RefreshControl
                      refreshing={tabLoading}
                      onRefresh={() => loadTab()}
                    />
                  }
                  ListEmptyComponent={() => (
                    <Text style={{ color: colors.text, padding: 16 }}>
                      No {TAB_CONFIG.find((t) => t.key === activeTab)?.title}{" "}
                      found
                    </Text>
                  )}
                  onEndReached={loadMore}
                  onEndReachedThreshold={0.5}
                  refreshing={tabLoading}
                  onRefresh={loadTab}
                />
              )}
            </View>
          )}
          stickySectionHeadersEnabled
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    alignItems: "center",
  },
  leftPlaceholder: { width: 24 },
  rightIcons: { flexDirection: "row" },
  iconButton: { marginLeft: 16 },
  profileHeader: { alignItems: "center", paddingVertical: 20 },
  handleRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  bioRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  handleText: { fontSize: 20, fontWeight: "600" },
  bioText: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: "80%",
    flexWrap: "wrap",
  },
  editButton: { marginLeft: 8 },
  editText: { fontSize: 14 },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
    marginHorizontal: "10%",
  },
  statCard: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 5,
  },
  statValue: { fontSize: 16, fontWeight: 500 },
  statLabel: { fontSize: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  carouselContainer: { paddingLeft: 12 },
  tabBarContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
});
