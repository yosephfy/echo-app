// mobile/src/components/ComposerModal.tsx
import React, { useState } from "react";
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { api } from "../api/client";
import { CircularProgress } from "./CircularProgressComponent";
import useCooldown from "../hooks/useCooldown";
import { Socket } from "socket.io-client";

const MAX_CHARS = 2000;
const MOODS = ["happy", "sad", "angry", "relieved"] as const;

type Mood = (typeof MOODS)[number];

interface Props {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}

export default function ComposerModal({ visible, onClose, onPosted }: Props) {
  const { colors, spacing, fontSizes, radii } = useTheme();
  const { refresh } = useCooldown();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [panic, setPanic] = useState(false);
  const [loading, setLoading] = useState(false);

  const remainingChars = MAX_CHARS - text.length;
  const charPct = text.length / MAX_CHARS;

  const postSecret = async () => {
    setLoading(true);
    try {
      await api.post("/secrets", { text, mood, panic });
      setText("");
      setMood(undefined);
      setPanic(false);
      onPosted();
      onClose();
      // Reset cooldown after posting
      refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      refresh();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      style={{ backgroundColor: colors.background }}
    >
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            padding: spacing.md,
            //margin: spacing.md,
          },
        ]}
      >
        <View style={{ flex: 1, padding: spacing.md }}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: fontSizes.lg },
            ]}
          >
            Share a Secret
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
          >
            {/* TEXT INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  //styles.textInput,
                  {
                    borderColor: colors.outline,
                    backgroundColor: colors.input,
                    color: colors.text,
                    fontSize: fontSizes.md,
                    borderRadius: radii.md,
                    minHeight: 100,
                    padding: spacing.md,
                    textAlignVertical: "top",
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={MAX_CHARS}
                value={text}
                onChangeText={setText}
              />
              <View style={styles.charCountRow}>
                <Text
                  style={[
                    styles.charCount,
                    {
                      color: remainingChars < 0 ? colors.error : colors.muted,
                      marginRight: spacing.sm,
                    },
                  ]}
                >
                  {remainingChars}
                  {"/"}
                  {MAX_CHARS}
                </Text>
                <CircularProgress
                  size={24}
                  progress={charPct}
                  strokeWidth={4}
                  color={remainingChars < 0 ? colors.error : colors.primary}
                  backgroundColor={colors.outline}
                />
              </View>
            </View>

            {/* MOOD SELECTOR */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Mood (optional)
              </Text>
              <View style={styles.moodRow}>
                {MOODS.map((m) => (
                  <MoodButton
                    key={m}
                    mood={m}
                    selected={mood === m}
                    onPress={() => setMood(m)}
                  />
                ))}
              </View>
            </View>

            {/* PANIC DELETE */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Panic Delete
              </Text>
              <View style={styles.panicRow}>
                <Text style={{ color: colors.text, flex: 1 }}>
                  Allow immediate deletion from server?
                </Text>
                <Switch
                  value={panic}
                  onValueChange={setPanic}
                  trackColor={{ false: colors.muted, true: colors.error }}
                />
              </View>
            </View>
          </ScrollView>

          {/* ACTIONS */}
          <View style={[styles.actionsRow, { borderTopColor: colors.outline }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cancelButton,
                {
                  borderColor: colors.muted,
                  borderRadius: radii.sm,
                  padding: spacing.sm,
                },
              ]}
            >
              <Text style={{ color: colors.muted }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={postSecret}
              disabled={!text.trim() || text.length > MAX_CHARS || loading}
              style={[
                styles.postButton,
                {
                  backgroundColor:
                    !text.trim() || text.length > MAX_CHARS
                      ? colors.muted
                      : colors.primary,
                  borderRadius: radii.sm,
                  padding: spacing.sm,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.postText, { fontSize: fontSizes.md }]}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// small mood button component
function MoodButton({
  mood,
  selected,
  onPress,
}: {
  mood: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, spacing, fontSizes, radii } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginRight: spacing.sm,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.outline,
        backgroundColor: selected ? colors.primary + "22" : colors.surface,
      }}
    >
      <Text
        style={{
          color: selected ? colors.primary : colors.text,
          fontSize: fontSizes.sm,
        }}
      >
        {mood.charAt(0).toUpperCase() + mood.slice(1)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontWeight: "600", marginBottom: 12 },
  inputContainer: { marginBottom: 24 },
  charCountRow: {
    position: "absolute",
    right: 0,
    bottom: -28,
    flexDirection: "row",
    alignItems: "center",
  },
  charCount: { fontWeight: "500" },

  section: { marginBottom: 24 },
  sectionLabel: { marginBottom: 8, fontWeight: "500" },
  moodRow: { flexDirection: "row" },
  panicRow: { flexDirection: "row", alignItems: "center" },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: { flex: 1, alignItems: "center", marginRight: 8 },
  postButton: { flex: 1, alignItems: "center", marginLeft: 8 },
  postText: { color: "#fff", fontWeight: "600" },
});
