// app/screens/ProfileScreen.tsx
import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Tabs, Tab, MaterialTabBar } from "react-native-collapsible-tab-view";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Avatar from "../components/Avatar";
import SecretItem, { SecretItemProps } from "../components/SecretItem";
import useMe from "../hooks/useMe";
import usePaginatedData from "../hooks/usePaginatedData";
import { useUserStats } from "../hooks/useUserStats";
import { IconSvg } from "../icons/IconSvg";
import { RootStackParamList, TabParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";
import { useUserContent } from "../hooks/useUserContent";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { IconName } from "../icons/icons";

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
    path: "/secrets/secretslist/me",
    icon: "heart",
  },
  { key: "caps", title: "Caps", path: "/secrets/secretslist/me", icon: "cap" },
];

type Props = NativeStackScreenProps<TabParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { user } = useMe();
  const { stats, loading: statsLoading } = useUserStats();
  const nav =
    useNavigation<NavigationProp<RootStackParamList, "AccountSettings">>();

  const statsMap = useMemo(
    () => ({
      Posts: stats?.postsCount ?? 0,
      Bookmarks: stats?.bookmarksCount ?? 0,
      Streak: stats?.currentStreak ?? 0,
      Reactions: stats?.totalReactions ?? 0,
      Caps: stats?.totalCaps ?? 0,
    }),
    [stats]
  );

  const Header = useCallback(() => {
    return (
      <View style={{ backgroundColor: colors.background, width: "100%" }}>
        {/* Top bar */}
        {/* <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            padding: 12,
            alignItems: "center",
          }}
        >
          <View style={{ width: 24 }} />
          <View style={{ flexDirection: "row" }}>
            <IconButton
              onPress={() =>
                nav.navigate("AccountSettings", { screen: "Help" })
              }
              icon="help"
            />
            <IconButton
              onPress={() => nav.navigate("AccountSettings")}
              icon="settings"
            />
          </View>
        </View> */}

        {/* Profile header */}
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Avatar
            url={user?.avatarUrl ?? ""}
            handle={user?.handle ?? ""}
            size={80}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              zIndex: 10,
            }}
          >
            {/* <Text
              style={{ fontSize: 20, fontWeight: "600", color: colors.text }}
            >
              @{user?.handle ?? ""}
            </Text> */}
            <Text
              onPress={() =>
                nav.navigate("AccountSettings", {
                  screen: "EditProfile",
                })
              }
              style={{ marginLeft: 8, fontSize: 14, color: colors.primary }}
            >
              Edit
            </Text>
          </View>
          {!!user?.bio && (
            <Text
              style={{
                fontSize: 14,
                textAlign: "center",
                color: colors.muted,
                marginTop: 8,
                maxWidth: "80%",
              }}
            >
              {user.bio}
            </Text>
          )}
        </View>

        {/* Stats row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingBottom: 18,
          }}
        >
          {Object.entries(statsMap).map(([label, value]) => (
            <View key={label} style={{ alignItems: "center" }}>
              <Text style={{ color: colors.muted, fontWeight: "500" }}>
                {value}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }, [colors, navigation, statsMap, user?.avatarUrl, user?.bio, user?.handle]);

  if (statsLoading || !stats) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs.Container
        renderHeader={Header}
        // headerHeight is optional; omit to let the lib measure automatically.
        // If you prefer a fixed value:
        //headerHeight={280}
        lazy={false} // keep scenes mounted so switching tabs doesn't reload
        containerStyle={{ backgroundColor: colors.background }}
        // You can also pass TabBar props with a custom component if needed.
        renderTabBar={(props) => (
          <MaterialTabBar
            {...props}
            labelStyle={{ textTransform: "capitalize", fontSize: 14 }}
            activeColor={colors.primary}
            inactiveColor={colors.muted}
            indicatorStyle={{ backgroundColor: colors.primary }}
            style={{ backgroundColor: colors.background, elevation: 0 }}
            tabStyle={{ width: "auto", paddingHorizontal: 0 }}
          />
        )}
      >
        {TAB_CONFIG.map((tab) => (
          <Tabs.Tab
            name={tab.title}
            key={tab.key}
            label={({}) => (
              <IconSvg
                icon={tab.icon}
                stateStyles={{ default: { color: colors.primary } }}
              />
            )}
          >
            <TabList path={tab.path} type={tab.key} />
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    </View>
  );
}

function TabList({ path, type }: { path: string; type: ContentType }) {
  const { colors } = useTheme();

  const {
    items: data,
    loading,
    refresh,
    loadMore,
    // If your hook exposes these, great; otherwise loading covers it.
  } = useUserContent(type);

  const keyExtractor = useCallback((item: SecretItemProps) => item.id, []);
  const renderItem = useCallback(
    ({ item }: { item: SecretItemProps }) => <SecretItem secret={item} />,
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
              <Text style={{ color: colors.text, padding: 16 }}>
                No items found
              </Text>
            )
          : null
      }
      ListFooterComponent={
        loading && data.length > 0
          ? () => (
              <View style={{ paddingVertical: 24 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )
          : null
      }
      contentContainerStyle={{ backgroundColor: colors.background }}
    />
  );
}

function IconButton({
  onPress,
  icon,
}: {
  onPress?: () => void;
  icon: Parameters<typeof IconSvg>[0]["icon"];
}) {
  return (
    <Text onPress={onPress} style={{ marginLeft: 16 }}>
      <IconSvg icon={icon} size={24} state="default" />
    </Text>
  );
}
