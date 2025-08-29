import React, { useCallback, useMemo, useState } from "react";
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
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export interface MessageComposerProps {
  onSend: (text: string) => void | Promise<void>;
  sending: boolean;
  placeholder?: string;
  multiline?: boolean;
  sendOnEnter?: boolean; // if true and multiline, pressing Enter sends
  leftAccessory?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputProps?: TextInputProps;
  onFocus?: () => void;
}

export default function MessageComposer({
  onSend,
  sending,
  placeholder = "Message",
  multiline = true,
  sendOnEnter = false,
  leftAccessory,
  containerStyle,
  inputProps,
  onFocus,
}: MessageComposerProps) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const canSend = useMemo(() => !!text.trim() && !sending, [text, sending]);

  const sendNow = useCallback(
    async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed || sending) return;
      await onSend(trimmed);
      setText("");
      Keyboard.dismiss();
    },
    [sending, onSend]
  );

  const handleSend = useCallback(() => {
    void sendNow(text);
  }, [text, sendNow]);

  return (
    <View
      style={[
        styles.composer,
        { borderTopColor: colors.border, backgroundColor: colors.background },
        containerStyle,
      ]}
    >
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
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
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
