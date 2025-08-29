import React from "react";
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from "react-native";
import MessageComposer, { MessageComposerProps } from "./MessageComposer";
import { useTheme } from "../theme/ThemeContext";

export interface ChatInputProps {
  onSend: (text: string) => void | Promise<void>;
  sending: boolean;
  onPickImage?: () => void | Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  sendOnEnter?: boolean;
  containerStyle?: ViewStyle;
  onFocus?: () => void;
}

export default function ChatInputComponent({
  onSend,
  sending,
  onPickImage,
  placeholder = "Message",
  multiline = true,
  sendOnEnter,
  containerStyle,
  onFocus,
}: ChatInputProps) {
  const { colors } = useTheme();

  const leftAccessory = onPickImage ? (
    <TouchableOpacity style={styles.iconBtn} onPress={onPickImage}>
      <Text style={[styles.iconTxt, { color: colors.text }]}>📷</Text>
    </TouchableOpacity>
  ) : undefined;

  const props: MessageComposerProps = {
    onSend,
    sending,
    placeholder,
    multiline,
    sendOnEnter,
    leftAccessory,
    containerStyle,
    onFocus,
  };

  return <MessageComposer {...props} />;
}

const styles = StyleSheet.create({
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  iconTxt: { fontSize: 18 },
});
