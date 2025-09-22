// app/screens/ProfileScreen.tsx
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import Avatar from "../components/Avatar";
import SecretItem, { SecretItemProps } from "../components/Secret/SecretItem";
import useMe from "../hooks/useMe";
import { useUserContent } from "../hooks/useUserContent";
import { UserStats, useUserStats } from "../hooks/useUserStats";
import { IconName } from "../icons/icons";
import { IconSvg } from "../icons/IconSvg";
import { RootStackParamList, TabParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";

type ContentType = "secrets" | "bookmarks" | "reactions" | "caps";

const TAB_CONFIG: {
  key: ContentType;
  title: string;
  path: string;
  icon: IconName;
}[] = [
  {
    key: "secrets",
    title: "Secrets",
    path: "/secrets/secretslist/me",
    icon: "cards",
  },
  {
    key: "bookmarks",
    title: "Bookmarks",
    path: "/bookmarks",
    icon: "bookmarks",
  },
  {
    key: "reactions",
    title: "Reactions",
    path: "/reactions/me",
    icon: "heart",
  },
  { key: "caps", title: "Caps", path: "/caps/me", icon: "cap" },
];

type Props = NativeStackScreenProps<TabParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useMe();
  const { stats, loading: statsLoading } = useUserStats();
  const nav =
    useNavigation<NavigationProp<RootStackParamList, "AccountSettings">>();

  // statsMap removed; StatArea handles display directly from stats

  const Header = useCallback(() => {
    return (
      <View style={[styles.headerWrap, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <View style={styles.profileHeader}>
            <Avatar
              url={user?.avatarUrl ?? ""}
              handle={user?.handle ?? ""}
              size={120}
              badge={<IconSvg icon="pencil" size={20} state="default" />}
              badgePosition="top-right"
              badgeOffset={-4}
              badgeContainerStyle={{
                backgroundColor: colors.background,
                borderRadius: "50%",
                padding: 10,
                elevation: 1,
              }}
              onPress={() =>
                nav.navigate("AccountSettings", { screen: "EditProfile" })
              }
            />

            {!!user?.bio && (
              <Text style={[styles.bioText, { color: colors.muted }]}>
                {user.bio}
              </Text>
            )}
          </View>

          <StatArea items={stats} />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.outline }]} />

        <BioArea
          bio={user?.bio}
          onPress={() =>
            nav.navigate("AccountSettings", { screen: "EditProfile" })
          }
        />
      </View>
    );
  }, [colors, nav, stats, user?.avatarUrl, user?.bio, user?.handle]);

  if (statsLoading || !stats) {
    return (
      <View
        style={[styles.loadingWrap, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex1}>
      <Tabs.Container
        renderHeader={Header}
        lazy={false}
        containerStyle={{ backgroundColor: colors.background }}
        renderTabBar={(props) => (
          <MaterialTabBar
            {...props}
            labelStyle={styles.tabLabel}
            activeColor={colors.primary}
            inactiveColor={colors.muted}
            indicatorStyle={{ backgroundColor: colors.primary }}
            style={{ backgroundColor: colors.background, elevation: 0 }}
            tabStyle={styles.tabStyle}
          />
        )}
      >
        {TAB_CONFIG.map((tab) => (
          <Tabs.Tab
            name={tab.title}
            key={tab.key}
            label={({ index }) => <IconSvg icon={tab.icon} state="default" />}
          >
            <TabList path={tab.path} type={tab.key} />
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    </View>
  );
}

/** Renders the list in each tab with pull-to-refresh + infinite scroll */
function TabList({ path, type }: { path: string; type: ContentType }) {
  const { colors } = useTheme();
  const { items: data, loading, refresh, loadMore } = useUserContent(type);
  const nav =
    useNavigation<NavigationProp<RootStackParamList, "SecretDetail">>();
  const keyExtractor = useCallback((item: SecretItemProps) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: SecretItemProps }) => (
      <SecretItem secret={item} navigation={nav} />
    ),
    []
  );
  const onEndReached = useCallback(() => {
    if (!loading) loadMore();
  }, [loadMore, loading]);

  return (
    <Tabs.FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        !loading
          ? () => (
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No items found
              </Text>
            )
          : null
      }
      ListFooterComponent={
        loading && data.length > 0
          ? () => (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )
          : null
      }
      contentContainerStyle={{ backgroundColor: colors.background }}
    />
  );
}

function SingleStatBox({ item }: { item: any }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.statBox,
        { borderColor: colors.outline, backgroundColor: colors.surface },
      ]}
    >
      <Text
        onPress={item.onPress}
        style={[styles.statValue, { color: colors.text }]}
      >
        {item.value}
      </Text>
      <IconSvg
        icon={item.icon}
        size={24}
        state="default"
        stateStyles={{ default: { color: colors.muted } }}
      />
    </View>
  );
}

function StatArea({ items }: { items: UserStats | null }) {
  if (!items) return null;

  // Curated subset: Posts, Bookmarks, Streak
  const statItems = [
    { name: "postsCount", value: items.postsCount, icon: "cards" },
    { name: "bookmarksCount", value: items.bookmarksCount, icon: "bookmarks" },
    { name: "currentStreak", value: items.currentStreak, icon: "fire" },
    {
      name: "reactionsReceived",
      value: items.reactionsReceived,
      icon: "heart",
    },
    { name: "capsReceived", value: items.capsReceived, icon: "cap" },
    { name: "repliesReceived", value: items.repliesReceived, icon: "comment" },
  ] as const;

  return (
    <View style={styles.statAreaWrap}>
      <View style={styles.statGrid}>
        {statItems.map((item) => (
          <SingleStatBox key={item.name} item={item} />
        ))}
      </View>
    </View>
  );
}

const BioArea = ({
  bio,
  onPress,
}: {
  bio?: string | null;
  onPress?: () => void;
}) => {
  const { colors } = useTheme();
  const [showMore, setShowMore] = React.useState(false);
  const toggleShowMore = () => setShowMore((s) => !s);

  const bioText = bio
    ? showMore
      ? bio
      : bio.slice(0, 100) + (bio.length > 100 ? "..." : "")
    : null;

  // If there is bio text, tap toggles expand; otherwise navigate to edit.
  const onPressBio = bioText ? toggleShowMore : (onPress ?? (() => {}));

  return (
    <TouchableOpacity onPress={onPressBio} style={styles.bioWrap}>
      <Text style={[styles.bioCtaText, { color: colors.muted }]}>
        {bioText ?? " No bio yet. Tap to add one!"}
      </Text>
    </TouchableOpacity>
  );
};

/* =========================
   Styles
   ========================= */
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerWrap: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
  },
  bioText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 5,
    width: "90%",
    alignSelf: "center",
  },
  tabLabel: { textTransform: "capitalize", fontSize: 14 },
  tabStyle: { width: "auto", paddingHorizontal: 0 },
  emptyText: { padding: 16 },
  footerLoading: { paddingVertical: 24 },
  statBox: {
    flexDirection: "row",
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    elevation: 1,
  },
  statValue: { fontWeight: "500" },
  statAreaWrap: {
    alignSelf: "center",
    margin: 10,
    marginLeft: 30,
    flex: 1,
  },
  statGrid: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  bioWrap: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  bioCtaText: {
    textAlign: "center",
  },
});
