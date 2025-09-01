import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
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
import Reaction from "./Reaction";

export interface SecretItemProps {
  id: string;
  text: string;
  mood?: string;
  status: string;
  createdAt: string;
  author: { id: string; handle: string; avatarUrl: string };
}

export type DisplayMode = "normal" | "expanded" | "condensed";

export default function SecretItem({
  secret,
  display = "normal",
  navigation,
}: {
  secret: SecretItemProps;
  display?: DisplayMode;
  navigation?: any;
}) {
  const { id, text, mood, createdAt, author } = secret;
  const { colors } = useTheme();

  // Reactions
  const {
    currentType,
    counts: reactionCounts,
    react,
    loading: reacting,
  } = useReactions(id);

  // Cap
  const {
    hasCapped,
    count: capCount,
    toggle: toggleCap,
    loading: capping,
  } = useCap(id);

  // Bookmark
  const {
    bookmarked,
    count: bookmarkCount,
    loading: bookmarking,
    toggle: toggleBookmark,
  } = useBookmark(id);

  // Replies (we only need total)
  const { total: countReplies } = useReplies(id);

  // Report & Share
  const { report, ReportModal } = useReport(id);
  const { share, ShareModal } = useShare(id);

  // computed flags
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

  // animation trigger on mode change
  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [display]);

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

            {mood && (
              <View style={[styles.moodPill, { borderColor: colors.primary }]}>
                <Text style={[styles.moodText, { color: colors.primary }]}>
                  {mood[0].toUpperCase() + mood.slice(1)}
                </Text>
              </View>
            )}

            <View style={styles.headerRightButtons}>
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
          {text}
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
            <Reaction
              current={currentType}
              onReact={(t: ReactionType) => !reacting && react(t)}
              totalCount={totalReactions}
              disabled={reacting}
            />
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

      {/* MODALS */}
      <ReportModal />
      <ShareModal />
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
  meta: {
    flex: 1,
    marginLeft: 12,
  },
  handle: { fontSize: 16, fontWeight: "500" },
  timestamp: { fontSize: 12, marginTop: 2 },
  moodPill: {
    borderWidth: 1.5,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  moodText: { fontSize: 14, fontWeight: "500" },
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  rightActions: { flexDirection: "row", gap: 16, alignItems: "center" },
});
