import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  TextInputProps,
  ViewStyle,
  Image,
  ScrollView,
  Platform,
  KeyboardEvent,
  KeyboardAvoidingView,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { IconSvg } from "../icons/IconSvg";
import * as ImagePicker from "expo-image-picker";

export interface MessageComposerProps {
  onSend: (text: string) => void | Promise<void>;
  // When provided, composer will call this and pass selected attachments
  onSendAttachments?: (
    text: string,
    attachments: ComposerAttachment[]
  ) => void | Promise<void>;
  sending: boolean;
  placeholder?: string;
  multiline?: boolean;
  sendOnEnter?: boolean; // if true and multiline, pressing Enter sends
  leftAccessory?: React.ReactNode; // still supported, but attachment button is built-in
  containerStyle?: ViewStyle;
  inputProps?: TextInputProps;
  onFocus?: () => void;
  enableAttachments?: boolean;
  avoidKeyboard?: boolean;
  /** Offset in px for headers/tabbars when avoiding keyboard. */
  keyboardVerticalOffset?: number;
  /** Use native KeyboardAvoidingView instead of listeners. iOS-focused. */
  useKeyboardAvoidingView?: boolean;
}

export default function MessageComposer({
  onSend,
  onSendAttachments,
  sending,
  placeholder = "Message",
  multiline = true,
  sendOnEnter = false,
  leftAccessory,
  containerStyle,
  inputProps,
  onFocus,
  enableAttachments = true,
  avoidKeyboard = true,
  keyboardVerticalOffset = 0,
  useKeyboardAvoidingView = false,
}: MessageComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [kbHeight, setKbHeight] = useState(0);
  const [kbVisible, setKbVisible] = useState(false);

  // Internal keyboard avoidance so composer stays above keyboard
  useEffect(() => {
    if (!avoidKeyboard || useKeyboardAvoidingView) return;

    const onShow = (e: KeyboardEvent) => {
      const h = e.endCoordinates?.height ?? 0;
      setKbHeight(h);
      setKbVisible(true);
    };
    const onHide = () => {
      setKbVisible(false);
      setKbHeight(0);
    };
    const subs = [
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        onShow
      ),
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        onHide
      ),
    ];
    return () => subs.forEach((s) => s.remove());
  }, [avoidKeyboard, useKeyboardAvoidingView]);

  const canSend = useMemo(() => {
    return (!!text.trim() || attachments.length > 0) && !sending;
  }, [text, attachments.length, sending]);

  const sendNow = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if ((trimmed.length === 0 && attachments.length === 0) || sending) return;
      if (attachments.length > 0 && onSendAttachments) {
        await onSendAttachments(trimmed, attachments);
      } else {
        await onSend(trimmed);
      }
      setText("");
      setAttachments([]);
      Keyboard.dismiss();
    },
    [sending, onSend, onSendAttachments, attachments]
  );

  const handleSend = useCallback(() => {
    void sendNow(text);
  }, [text, sendNow]);

  const handlePick = useCallback(async () => {
    if (!enableAttachments) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true as any, // iOS 14+; ignored elsewhere
      selectionLimit: 5 as any, // best-effort cap
    } as any);
    if (result.canceled) return;
    const newOnes: ComposerAttachment[] = (result.assets || []).map((a) => ({
      uri: a.uri,
      mimeType: (a as any).mimeType,
      name: (a as any).fileName,
      width: a.width,
      height: a.height,
    }));
    setAttachments((prev) => {
      const merged = [...prev, ...newOnes];
      // de-dupe by uri
      const seen = new Set<string>();
      return merged.filter((x) => (seen.has(x.uri) ? false : (seen.add(x.uri), true)));
    });
  }, [enableAttachments]);

  const removeAttachment = useCallback((uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  }, []);

  const bottomAvoid = !useKeyboardAvoidingView && avoidKeyboard && kbVisible
    ? Math.max(0, kbHeight - (keyboardVerticalOffset || 0))
    : 0;

  const Outer: React.ComponentType<any> = useKeyboardAvoidingView
    ? KeyboardAvoidingView
    : View;
  const outerProps = useKeyboardAvoidingView
    ? {
        behavior: Platform.OS === "ios" ? "padding" : undefined,
        keyboardVerticalOffset,
        style: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      }
    : {
        style: {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          marginBottom: bottomAvoid,
        },
      };

  return (
    <Outer {...outerProps}>
      {attachments.length > 0 && (
        <ScrollView
          horizontal
          style={[styles.previewBar, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.previewContent}
          showsHorizontalScrollIndicator={false}
        >
          {attachments.map((a) => (
            <View key={a.uri} style={styles.previewItem}>
              <Image source={{ uri: a.uri }} style={styles.previewImage} />
              <TouchableOpacity
                onPress={() => removeAttachment(a.uri)}
                style={styles.previewRemove}
              >
                <IconSvg icon="close-circle" size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View
        style={[
          styles.composer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
          containerStyle,
        ]}
      >
        {enableAttachments && (
          <TouchableOpacity
            style={[styles.attachBtn, { borderColor: colors.border }]}
            onPress={handlePick}
            disabled={sending}
          >
            <IconSvg icon="attach" size={22} />
          </TouchableOpacity>
        )}

        {!!leftAccessory && <View style={styles.left}>{leftAccessory}</View>}

        <TextInput
          value={text}
          onChangeText={(val) => {
            if (multiline && sendOnEnter && val.includes("\n")) {
              const withoutNewlines = val.replace(/\n/g, "");
              void sendNow(withoutNewlines || text);
              // clear composer after sending
              setText("");
            } else {
              setText(val);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              minHeight: multiline ? 40 : 36,
              maxHeight: multiline ? 120 : 44,
            },
          ]}
          multiline={multiline}
          onSubmitEditing={!multiline ? handleSend : undefined}
          blurOnSubmit={!multiline}
          editable={!sending}
          onFocus={onFocus}
          {...inputProps}
        />

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, !canSend && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!canSend}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendTxt}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </Outer>
  );
}

const styles = StyleSheet.create({
  previewBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
  },
  previewContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  previewItem: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    padding: 6,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  left: { justifyContent: "flex-end" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendTxt: { color: "#fff", fontWeight: "600" },
  sendDisabled: { opacity: 0.5 },
});

export type ComposerAttachment = {
  uri: string;
  mimeType?: string;
  name?: string;
  width?: number;
  height?: number;
};
