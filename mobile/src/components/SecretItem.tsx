import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useBookmark } from "../hooks/useBookmarks"; // ✅ was from useBookmarks
import useCap from "../hooks/useCap";
import useReactions, { ReactionType } from "../hooks/useReactions";
import { useReplies } from "../hooks/useReplies";
import { useReport } from "../hooks/useReport";
import { useShare } from "../hooks/useShare";
import { useTheme } from "../theme/ThemeContext";
import { timeAgo } from "../utils/timeAgo";
import ActionButton from "./ActionButton";
import Avatar from "./Avatar";
import ReactionPicker, { DEFAULT_REACTIONS } from "./ReactionPicker";
import useMe from "../hooks/useMe";
import { useSecretMutations } from "../hooks/useSecretMutations";
import { Alert } from "react-native";
import { useComposer } from "../store/composer";
import { useGlobalModal } from "./modal/GlobalModalProvider";
import { MOOD_COLOR_MAP } from "../constants/moods";
import Chip from "./Chip";

export interface SecretItemProps {
  id: string;
  text: string;
  moods?: { code: string; label?: string }[];
  tags?: string[];
  status: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl: string };
}

export type DisplayMode = "normal" | "expanded" | "condensed";

function linkifyHashtags(text: string, color: string) {
  const parts = text.split(/(#[a-zA-Z0-9_]{2,32})/g);
  return parts.map((p, idx) => {
    if (/^#[a-zA-Z0-9_]{2,32}$/.test(p)) {
      return (
        <Text
          key={idx}
          style={{ color, fontWeight: "600" }}
          onPress={() => {
            // future: navigate to tag feed
          }}
        >
          {p}
        </Text>
      );
    }
    // inherit parent Text styles for non-hashtag segments
    return <Text key={idx}>{p}</Text>;
  });
}

export default function SecretItem({
  secret,
  display = "normal",
  navigation,
}: {
  secret: SecretItemProps;
  display?: DisplayMode;
  navigation?: any;
}) {
  const { id, text, moods, createdAt, author } = secret;
  const { colors } = useTheme();
  const { user } = useMe();
  const isMine = user?.id === author?.id;
  const { deleteSecret } = useSecretMutations();
  const composer = useComposer();

  const {
    currentType,
    counts: reactionCounts,
    react,
    loading: reacting,
  } = useReactions(id);

  const {
    hasCapped,
    count: capCount,
    toggle: toggleCap,
    loading: capping,
  } = useCap(id);

  const {
    bookmarked,
    count: bookmarkCount,
    loading: bookmarking,
    toggle: toggleBookmark,
  } = useBookmark(id);

  const { total: countReplies } = useReplies(id);
  const { report } = useReport(id);
  const { share } = useShare(id);
  const isExpanded = display === "expanded";
  const isCondensed = display === "condensed";
  const totalReactions = Object.values(reactionCounts).reduce(
    (s, c) => s + c,
    0
  );

  const onReply = () => {
    if (display !== "expanded") {
      navigation?.navigate?.("SecretDetail", { secretId: id });
    }
  };

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [display]);

  const activeMoods = moods && moods.length ? moods.map((m) => m.code) : [];
  const maxCollapsedChips = 3;
  const visibleMoodCodes = isExpanded
    ? activeMoods
    : activeMoods.slice(0, maxCollapsedChips);
  const extraMoodCount = isExpanded
    ? 0
    : Math.max(0, activeMoods.length - maxCollapsedChips);
  const { show: showGlobalModal } = useGlobalModal();

  const openMoodsModal = () => {
    if (!moods || moods.length === 0) return;
    showGlobalModal({
      title: `@${author?.handle ?? "user"} was feeling`,
      message: (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {moods.map((m) => {
            const color = MOOD_COLOR_MAP[m.code] || colors.primary;
            return (
              <View
                key={m.code}
                style={{
                  backgroundColor: `${color}22`,
                  borderColor: color,
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: colors.text, fontWeight: "600" }}>
                  {m.label ?? m.code}
                </Text>
              </View>
            );
          })}
        </View>
      ),
      cancelText: "Close",
    });
  };

  return (
    <View
      style={[
        styles.card,
        isCondensed && styles.condensedCard,
        { backgroundColor: colors.surface, borderColor: colors.outline },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Avatar
          url={author.avatarUrl}
          handle={author.handle}
          size={isCondensed ? 32 : 40}
        />
        {!isCondensed && (
          <>
            <View style={styles.meta}>
              <Text style={[styles.handle, { color: colors.text }]}>
                @{author.handle}
              </Text>
              <Text style={[styles.timestamp, { color: colors.muted }]}>
                {timeAgo(createdAt, "long")}
              </Text>
            </View>

            {/* moods are moved below footer */}

            <View style={styles.headerRightButtons}>
              {isMine ? (
                <>
                  <ActionButton
                    icon="pencil"
                    onPress={() =>
                      composer.openEdit({
                        id,
                        text,
                        moods: activeMoods.map((c) => ({ code: c })),
                      })
                    }
                  />
                  <ActionButton
                    icon="trash"
                    onPress={() =>
                      Alert.alert(
                        "Delete secret",
                        "Are you sure you want to delete this secret?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () =>
                              deleteSecret({ id }).catch((e) =>
                                alert(e.message)
                              ),
                          },
                        ]
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <ActionButton
                    icon="cap"
                    onPress={() => !capping && toggleCap()}
                    label={capCount > 0 ? String(capCount) : undefined}
                    active={hasCapped}
                    disabled={capping}
                  />
                  <ActionButton
                    icon="more-vertical"
                    onPress={report}
                    style={{ marginRight: 0 }}
                  />
                </>
              )}
            </View>
          </>
        )}
      </View>

      {/* BODY */}
      <Pressable
        style={[
          styles.bodyContainer,
          isExpanded && { maxHeight: undefined },
          isCondensed && styles.condensedBodyContainer,
        ]}
        onPress={onReply}
      >
        <Text
          style={[
            styles.bodyText,
            { color: colors.text },
            isExpanded && { maxHeight: undefined },
            isCondensed && styles.condensedBodyText,
          ]}
        >
          {linkifyHashtags(text, colors.primary)}
        </Text>
        {!isExpanded && text.length > 100 && !isCondensed && (
          <LinearGradient
            colors={[`${colors.surface}00`, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 7 }}
            locations={[0, 0.15]}
            style={styles.fadeOverlay}
            pointerEvents="none"
          />
        )}
      </Pressable>

      {/* DIVIDER */}
      {!isCondensed && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            marginBottom: 12,
            backgroundColor: colors.outline,
          }}
        />
      )}

      {/* FOOTER ACTIONS */}
      {!isCondensed && (
        <View style={styles.footer}>
          <View style={styles.leftActions}>
            <ReactionPicker
              value={currentType ?? null}
              onSelect={(k) => !reacting && react(k as ReactionType)}
            >
              <ActionButton
                icon={
                  currentType
                    ? (DEFAULT_REACTIONS.find((r) => r.key === currentType)
                        ?.icon as any)
                    : "heart"
                }
                onPress={() =>
                  !reacting && react(currentType ?? ReactionType.Love)
                }
                label={totalReactions > 0 ? totalReactions : undefined}
                size={24}
                disabled={reacting}
                active={!!currentType}
              />
            </ReactionPicker>
            <ActionButton
              icon="comment"
              onPress={onReply}
              label={countReplies > 0 ? countReplies : undefined}
            />
            <ActionButton icon="share" onPress={share} />
          </View>
          <View style={styles.rightActions}>
            <ActionButton
              icon={bookmarked ? "bookmark-fill" : "bookmark"}
              onPress={() => !bookmarking && toggleBookmark()}
              active={bookmarked}
              label={bookmarkCount > 0 ? bookmarkCount : undefined}
              disabled={bookmarking}
            />
          </View>
        </View>
      )}

      {/* MOODS under actions */}
      {!isCondensed && activeMoods.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            flexWrap: isExpanded ? "wrap" : "nowrap",
            paddingHorizontal: 6,
            marginTop: 8,
            marginBottom: 2,
            gap: isExpanded ? 6 : 0,
          }}
        >
          {visibleMoodCodes.map((code, idx) => {
            const color = MOOD_COLOR_MAP[code] || colors.primary;
            return (
              <View
                key={code + idx}
                style={{ marginLeft: idx === 0 ? 0 : isExpanded ? 0 : -30 }}
              >
                <Chip
                  label={code}
                  size="xs"
                  variant="filled"
                  color={color}
                  bgColor={color}
                  //textColor="#000"
                  borderColor={colors.background}
                  borderWidth={1}
                  radius={6}
                  widthMode="fixed"
                  width={60}
                  onPress={openMoodsModal}
                />
              </View>
            );
          })}
          {extraMoodCount > 0 && (
            <View
              style={{
                marginLeft:
                  visibleMoodCodes.length === 0 ? 0 : isExpanded ? 0 : -30,
              }}
            >
              <Chip
                label={`${extraMoodCount} more`}
                size="xs"
                variant="outline"
                color={colors.outline}
                textColor={colors.muted}
                borderColor={colors.outline}
                radius={6}
              />
            </View>
          )}
        </View>
      )}

      {/* Modals are managed globally via GlobalModalProvider */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 10,
    borderWidth: 1,
  },
  condensedCard: {
    padding: 8,
    margin: 4,
    maxWidth: 120,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  meta: { flex: 1, marginLeft: 12 },
  handle: { fontSize: 16, fontWeight: "500" },
  timestamp: { fontSize: 12, marginTop: 2 },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  bodyContainer: {
    maxHeight: 200,
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  condensedBodyContainer: { maxHeight: 60 },
  bodyText: { fontSize: 16, lineHeight: 22, minHeight: 20, maxHeight: 180 },
  condensedBodyText: { fontSize: 14, lineHeight: 18, maxHeight: 60 },
  fadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  rightActions: { flexDirection: "row", gap: 16, alignItems: "center" },
});
