import React from "react";
import { Alert, LayoutAnimation, StyleSheet, View } from "react-native";
import { useBookmark } from "../../hooks/useBookmarks"; // ✅ was from useBookmarks
import useCap from "../../hooks/useCap";
import useMe from "../../hooks/useMe";
import useReactions, { ReactionType } from "../../hooks/useReactions";
import { useReplies } from "../../hooks/useReplies";
import { useReport } from "../../hooks/useReport";
import { useSecretMutations } from "../../hooks/useSecretMutations";
import { useShare } from "../../hooks/useShare";
import { useComposer } from "../../store/composer";
import { useTheme } from "../../theme/ThemeContext";
import { timeAgo } from "../../utils/timeAgo";
import CondensedSecretItem from "./CondensedSecretItem";
import { InteractionRow } from "./InteractionRow";
import SecretBody from "./SecretBody";
import SecretFooter from "./SecretFooter";
import { UserHeader } from "./UserHeader";

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

  return isCondensed ? (
    <CondensedSecretItem
      content={text}
      onPress={onReply}
      avatarUrl={author.avatarUrl}
      handle={author.handle}
    />
  ) : (
    <View
      style={[
        styles.card,
        isCondensed && styles.condensedCard,
        { backgroundColor: colors.card },
      ]}
    >
      {/* HEADER */}

      <UserHeader
        avatarUri={author.avatarUrl}
        handle={author.handle}
        timeAgo={timeAgo(secret.createdAt, "medium")}
        leftActions={{
          shown: isMine ? ["delete", "edit"] : ["cap", "more"],
          list: [
            {
              name: "cap",
              icon: "cap",
              onPress: () => !capping && toggleCap(),
              selected: hasCapped,
              label: capCount > 0 ? String(capCount) : undefined,
            },

            {
              name: "edit",
              icon: "pencil",
              onPress: () => {
                composer.fetchAndOpenEdit(id);
              },
            },
            {
              name: "delete",
              icon: "trash",
              onPress: () => {
                Alert.alert(
                  "Delete secret",
                  "Are you sure you want to delete this secret?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () =>
                        deleteSecret({ id }).catch((e) => alert(e.message)),
                    },
                  ]
                );
              },
            },
            {
              name: "more",
              icon: "more-vertical",
              onPress: report,
            },
          ],
        }}
      />
      {/* BODY */}
      <SecretBody content={text} onPress={onReply} isExpanded={isExpanded} />

      {/* DIVIDER */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          marginTop: 28,
          backgroundColor: colors.icon,
        }}
      />

      <InteractionRow
        reaction={{
          onPress: () => !reacting && react(currentType ?? ReactionType.Love),
          onSelect: (k) => !reacting && react(k as ReactionType),
          label: totalReactions > 0 ? totalReactions : undefined,
          currentType: currentType,
          disabled: reacting,
        }}
        comment={{
          onPress: onReply,
          label: countReplies > 0 ? countReplies : undefined,
        }}
        share={{ onPress: share }}
        bookmark={{
          onPress: () => !bookmarking && toggleBookmark(),
          bookmarked: bookmarked,
          label: bookmarkCount > 0 ? bookmarkCount : undefined,
          loading: bookmarking,
        }}
      />

      {/* MOODS under actions */}
      <SecretFooter
        moods={moods}
        handle={author.handle}
        isExpanded={isExpanded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 5,
    marginHorizontal: 10,
    //borderWidth: 1,
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
  handle: { fontSize: 17, fontWeight: "500" },
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
  bodyText: { fontSize: 17, lineHeight: 22, minHeight: 20, maxHeight: 180 },
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
    width: "100%",
    marginTop: 17,
  },
  leftActions: { flexDirection: "row", alignItems: "center", gap: 20 },
  rightActions: {},
});
