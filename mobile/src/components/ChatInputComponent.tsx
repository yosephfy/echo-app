import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { IconSvg } from "../icons/IconSvg";
import { useTheme } from "../theme/ThemeContext";
import MessageComposer, { MessageComposerProps } from "./MessageComposer";

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
    <TouchableOpacity
      style={[styles.iconBtn, { borderColor: colors.border }]}
      onPress={onPickImage}
    >
      <IconSvg icon="camera" size={24} />
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
  iconBtn: {
    padding: 8,
    borderWidth: 1,
    borderRadius: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
});
