// mobile/src/components/SecretItem.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "./Avatar";
import ActionButton from "./ActionButton";
import ReactionPicker from "./ReactionPicker";
import { useReport } from "../hooks/useReport";
import { useShare } from "../hooks/useShare";
import useReactions, { ReactionType } from "../hooks/useReactions";
import useCap from "../hooks/useCap";

export interface SecretItemProps {
  id: string;
  text: string;
  mood?: string;
  status: string;
  createdAt: string;
  userHandle: string;
  avatarUrl?: string;
  onReply: () => void;
}

export default function SecretItem({
  id,
  text,
  mood,
  createdAt,
  userHandle,
  avatarUrl,
  onReply,
}: SecretItemProps) {
  const { colors } = useTheme();
  const { currentType, counts, react } = useReactions(id);
  const { hasCapped, count: capCount, toggle: toggleCap } = useCap(id);

  const { report, ReportModal } = useReport(id);
  const { share, ShareModal } = useShare(id);

  // derive total reactions for the ❤️ button
  const totalReactions = Object.values(counts).reduce((sum, c) => sum + c, 0);

  const [pickerVisible, setPickerVisible] = useState(false);
  const togglePicker = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPickerVisible((v) => !v);
  };

  return (
    <View
      style={[
        styles.card,
        { borderColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar url={avatarUrl} handle={userHandle} />
        <View style={styles.meta}>
          <Text style={[styles.handle, { color: colors.primary }]}>
            @{userHandle}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text }]}>
            {new Date(createdAt).toLocaleString()}
          </Text>
        </View>
        {mood && (
          <View style={[styles.moodBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.moodText, { color: "#fff" }]}>{mood}</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <Text style={[styles.bodyText, { color: colors.text }]}>{text}</Text>

      {/* Reaction Picker */}
      {pickerVisible && (
        <ReactionPicker
          selected={currentType}
          onSelect={(type: ReactionType) => {
            react(type); // now a valid enum value
            togglePicker();
          }}
        />
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <ActionButton
          icon="❤️"
          label={totalReactions.toString()}
          active={currentType === ReactionType.Like}
          onPress={togglePicker}
        />
        <ActionButton
          icon="🧢"
          label={capCount.toString()}
          active={hasCapped}
          onPress={toggleCap}
        />
        <ActionButton icon="💬" onPress={onReply} />
        <ActionButton icon="🔗" onPress={share} />
        <ActionButton icon="🚩" onPress={report} />
      </View>

      {/* Modals */}
      <ReportModal />
      <ShareModal />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  meta: { flex: 1, marginLeft: 8 },
  handle: { fontSize: 14, fontWeight: "600" },
  timestamp: { fontSize: 12 },
  moodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  moodText: { fontSize: 12 },
  bodyText: { fontSize: 16, marginVertical: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
});
