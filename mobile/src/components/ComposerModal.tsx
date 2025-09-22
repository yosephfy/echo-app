// mobile/src/components/ComposerModal.tsx
import React, { useEffect, useState } from "react";
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
import { useComposer } from "../store/composer";
import { useSecretMutations } from "../hooks/useSecretMutations";
import MoodPickerModal from "./MoodPickerModal";
import { MOOD_COLOR_MAP } from "../constants/moods";
import Chip from "./Chip";

const MAX_CHARS = 2000;

export default function ComposerModal() {
  const { colors, spacing, fontSizes, radii } = useTheme();
  const { refresh } = useCooldown();
  const composer = useComposer();
  const { editSecret, editing } = useSecretMutations();
  const [text, setText] = useState("");
  const [panic, setPanic] = useState(false);
  const [loading, setLoading] = useState(false);

  const remainingChars = MAX_CHARS - text.length;
  const charPct = text.length / MAX_CHARS;

  useEffect(() => {
    if (composer.visible) {
      setText(composer.text ?? "");
      setPanic(false);
    }
  }, [composer.visible]);

  const postSecret = async () => {
    setLoading(true);
    try {
      if (composer.mode === "edit" && composer.secretId) {
        await editSecret({
          id: composer.secretId,
          text,
          moods: composer.moods,
        });
        composer.close();
      } else {
        await api.post("/secrets", { text, moods: composer.moods, panic });
        setText("");
        composer.clearMoods();
        setPanic(false);
        composer.close();
        refresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
      refresh();
    }
  };

  return (
    <Modal
      visible={composer.visible}
      animationType="slide"
      onRequestClose={composer.close}
      style={{ backgroundColor: colors.background }}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background, padding: spacing.md },
        ]}
      >
        <MoodPickerModal />
        <View style={{ flex: 1, padding: spacing.md }}>
          <Text
            style={[
              styles.title,
              { color: colors.text, fontSize: fontSizes.lg },
            ]}
          >
            {composer.mode === "edit" ? "Edit Secret" : "Share a Secret"}
          </Text>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
          >
            {/* TEXT INPUT */}
            <View style={styles.inputContainer}>
              <TextInput
                style={{
                  borderColor: colors.outline,
                  backgroundColor: colors.input,
                  color: colors.text,
                  fontSize: fontSizes.md,
                  borderRadius: radii.md,
                  minHeight: 100,
                  padding: spacing.md,
                  textAlignVertical: "top",
                  borderWidth: StyleSheet.hairlineWidth,
                }}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.muted}
                multiline
                maxLength={MAX_CHARS}
                value={text}
                onChangeText={setText}
              />
              <View style={styles.charCountRow}>
                <Text
                  style={{
                    color: remainingChars < 0 ? colors.error : colors.muted,
                    marginRight: spacing.sm,
                    fontWeight: "500",
                  }}
                >
                  {remainingChars}/{MAX_CHARS}
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

            {/* MOODS MULTI SELECT */}
            <View style={styles.section}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Moods (optional)
                </Text>
                <TouchableOpacity
                  onPress={composer.clearMoods}
                  disabled={!composer.moods.length}
                >
                  <Text
                    style={{
                      color: composer.moods.length
                        ? colors.error
                        : colors.muted,
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", flex: 1 }}
                >
                  {composer.moods.map((code) => {
                    const bg = MOOD_COLOR_MAP[code] || colors.primary;
                    return (
                      <Chip
                        key={code}
                        label={code}
                        size="xs"
                        variant="filled"
                        color={bg}
                        bgColor={bg}
                        textColor={colors.text}
                        borderColor={colors.background}
                        borderWidth={1}
                        radius={8}
                        // toggle on press, open picker on long press
                        onPress={() => composer.toggleMood(code)}
                        onLongPress={composer.showMoodPicker}
                        accessibilityLabel={`${code} mood`}
                        leftIcon="close-circle"
                        iconStateStyles={{ default: { color: "#fffff2" } }}
                        style={{ marginRight: 8, marginBottom: 8, height: 28 }}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Picker button moved below chips for clarity */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <TouchableOpacity
                  onPress={composer.showMoodPicker}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: colors.primary,
                    borderRadius: 16,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Browse moods
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* PANIC DELETE (only for create) */}
            {composer.mode === "create" && (
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
            )}
          </ScrollView>

          {/* ACTIONS */}
          <View style={[styles.actionsRow, { borderTopColor: colors.outline }]}>
            <TouchableOpacity
              onPress={composer.close}
              style={{
                borderColor: colors.muted,
                borderRadius: radii.sm,
                padding: spacing.sm,
                borderWidth: 1,
                flex: 1,
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <Text style={{ color: colors.muted }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={postSecret}
              disabled={
                !text.trim() || text.length > MAX_CHARS || loading || editing
              }
              style={{
                backgroundColor:
                  !text.trim() || text.length > MAX_CHARS
                    ? colors.muted
                    : colors.primary,
                borderRadius: radii.sm,
                padding: spacing.sm,
                flex: 1,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: fontSizes.md,
                  }}
                >
                  {composer.mode === "edit" ? "Save" : "Post"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
  section: { marginBottom: 24 },
  sectionLabel: { fontWeight: "500" },
  panicRow: { flexDirection: "row", alignItems: "center" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
