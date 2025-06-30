// mobile/src/components/SecretItem.tsx
import React, { useState } from "react";
import { LayoutAnimation, StyleSheet, Text, View } from "react-native";
import useCap from "../hooks/useCap";
import useReactions, { ReactionType } from "../hooks/useReactions";
import { useReport } from "../hooks/useReport";
import { useShare } from "../hooks/useShare";
import { useTheme } from "../theme/ThemeContext";
import ActionButton from "./ActionButton";
import Avatar from "./Avatar";
import { timeAgo } from "../utils/timeAgo";
import { LinearGradient } from "expo-linear-gradient";
import Reaction from "./Reaction";
import useBookmark from "../hooks/useBookmarks";

export interface SecretItemProps {
  id: string;
  text: string;
  mood?: string;
  status: string;
  createdAt: string;
  author: { handle: string; avatarUrl: string };
  onReply: () => void;
}

export default function SecretItem({
  id,
  text,
  mood,
  createdAt,
  author,
  onReply,
}: SecretItemProps) {
  const { colors } = useTheme();
  const { currentType, counts: reactionCounts, react } = useReactions(id);
  const { hasCapped, count: capCount, toggle: toggleCap } = useCap(id);
  const {
    bookmarked,
    count: bookmarkCount,
    loading: bookmarkLoading,
    toggle: toggleBookmark,
    refresh: refreshBookmark,
  } = useBookmark(id);

  const { report, ReportModal } = useReport(id);
  const { share, ShareModal } = useShare(id);

  const totalReactions = Object.values(reactionCounts).reduce(
    (s, c) => s + c,
    0
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Avatar url={author.avatarUrl} handle={author.handle} size={40} />
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
              {mood[0].toUpperCase()}
              {mood.slice(1)}
            </Text>
          </View>
        )}
        <View style={styles.headerRightButtons}>
          <ActionButton
            icon={"cap"}
            onPress={toggleCap}
            label={capCount > 0 ? capCount.toString() : undefined}
            active={hasCapped}
          />

          <ActionButton
            icon={"more-vertical"}
            onPress={report}
            style={{ marginRight: 0 }}
          />
        </View>
      </View>

      {/* BODY */}
      <View style={styles.bodyContainer}>
        <Text style={[styles.bodyText, { color: colors.text }]}>{text}</Text>
        {text.length > 250 && (
          <LinearGradient
            colors={["rgba(255,	247,	237, 0)", "rgba(255, 247, 237, 1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 7 }}
            locations={[0, 0.15]}
            style={[styles.fadeOverlay]}
            pointerEvents="none"
          />
        )}
      </View>
      {/* DIVIDER */}

      <View style={styles.divider} />

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <View style={styles.leftActions}>
          {/* <ActionButton
            icon="heart"
            label={totalReactions > 0 ? totalReactions.toString() : undefined}
            active={currentType !== null}
            onPress={togglePicker}
          /> */}
          <Reaction
            current={currentType}
            onReact={(type) => react(type)}
            totalCount={totalReactions}
          />
          <ActionButton icon="comment" onPress={onReply} />
          <ActionButton icon="share" onPress={share} />
        </View>
        <View style={styles.rightActions}>
          <ActionButton
            icon={bookmarked ? "bookmark-fill" : "bookmark"}
            onPress={toggleBookmark}
            active={bookmarked}
          />
        </View>
      </View>

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
    marginBottom: 16,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "flex-start",
  },
  meta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  handle: {
    fontSize: 16,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 12,
    marginTop: 2,
  },
  moodPill: {
    borderWidth: 1.5,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  moodText: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerButton: {
    marginHorizontal: 4,
    alignItems: "center",
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  capCount: {
    fontSize: 10,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 20,
    maxHeight: 180,
  },
  bodyContainer: {
    maxHeight: 200,
    overflow: "hidden",
    position: "relative",
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftActions: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "flex-start",
    alignItems: "center",
    alignContent: "center",
  },
  rightActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
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
});
