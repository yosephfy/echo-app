import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "../components/Avatar";
import { useUserSearch, UserSort, LiteUser } from "../hooks/useUserSearch";
import { RootStackParamList } from "../navigation/AppNavigator";
import { IconSvg } from "../icons/IconSvg";

type Props = NativeStackScreenProps<RootStackParamList, "UserPicker">;

export default function UserPickerScreen({ route, navigation }: Props) {
  const {
    mode = "single",
    preselectedIds = [],
    title = "Select Users",
    submitText = "Done",
    onSubmit, // NOTE: functions in params are fine in-memory (not across reloads)
  } = route.params ?? {};

  const { colors } = useTheme();

  // --- Local search/sort state (debounced input) ---
  const [rawQuery, setRawQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<UserSort>("handle_asc");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(rawQuery), 250);
    return () => clearTimeout(id);
  }, [rawQuery]);

  // --- Data ---
  const { items, loading, hasMore, loadMore, refresh } = useUserSearch(
    debounced,
    sort,
    24
  );

  // --- Selection state ---
  const [selected, setSelected] = useState<Record<string, LiteUser>>({});
  useEffect(() => {
    // seed preselected
    if (preselectedIds?.length) {
      const seed: Record<string, LiteUser> = {};
      for (const u of items) {
        if (preselectedIds.includes(u.id)) seed[u.id] = u;
      }
      setSelected((prev) => ({ ...seed, ...prev }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (user: LiteUser) => {
    if (mode === "single") {
      setSelected({ [user.id]: user });
      return;
    }
    setSelected((prev) => {
      const next = { ...prev };
      if (next[user.id]) delete next[user.id];
      else next[user.id] = user;
      return next;
    });
  };

  const isSelected = (id: string) => !!selected[id];
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  // --- Header: title + submit ---
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: title,
      headerRight: () => (
        <Pressable
          onPress={() => {
            // return selection to caller
            if (onSubmit) onSubmit(selectedList);
            navigation.goBack();
          }}
          style={{ paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {submitText}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, title, submitText, onSubmit, selectedList, colors.primary]);

  // --- Sort switcher ---
  const cycleSort = () => {
    setSort((s) =>
      s === "handle_asc"
        ? "handle_desc"
        : s === "handle_desc"
          ? "recent"
          : "handle_asc"
    );
  };
  const sortLabel =
    sort === "handle_asc" ? "A→Z" : sort === "handle_desc" ? "Z→A" : "Recent";

  // --- Render ---
  const renderItem = ({ item }: { item: LiteUser }) => {
    const picked = isSelected(item.id);
    return (
      <Pressable
        onPress={() => toggle(item)}
        style={[styles.row, { borderColor: colors.border }]}
      >
        <Avatar
          handle={item.handle}
          url={item.avatarUrl ?? undefined}
          size={44}
        />
        <View style={styles.center}>
          <Text style={[styles.handle, { color: colors.text }]}>
            @{item.handle}
          </Text>
        </View>
        <View style={styles.right}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: picked ? colors.primary : colors.border,
                backgroundColor: picked ? colors.primary : "transparent",
              },
            ]}
          >
            {picked && <IconSvg icon="tick-square" size={16} state="pressed" />}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Search + Sort */}
      <View style={styles.controls}>
        <View
          style={[
            styles.searchWrap,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <IconSvg icon="search-alt" size={18} />
          <TextInput
            value={rawQuery}
            onChangeText={setRawQuery}
            placeholder="Search users…"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {!!rawQuery && (
            <Pressable onPress={() => setRawQuery("")}>
              <IconSvg icon="wrong" size={18} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={cycleSort}
          style={[
            styles.sortPill,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            {sortLabel}
          </Text>
        </Pressable>
      </View>

      {/* Selected pills (multiple mode) */}
      {mode === "multiple" && selectedList.length > 0 && (
        <View style={styles.chipsWrap}>
          {selectedList.map((u) => (
            <View
              key={u.id}
              style={[
                styles.chip,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                @{u.handle}
              </Text>
              <Pressable onPress={() => toggle(u)} style={{ marginLeft: 6 }}>
                <IconSvg icon="wrong" size={12} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(u) => u.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshing={loading}
        onRefresh={refresh}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? <ActivityIndicator style={{ margin: 16 }} /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },

  sortPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  center: { flex: 1, marginLeft: 10 },
  handle: { fontSize: 16, fontWeight: "600" },
  right: { marginLeft: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  sep: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
});
