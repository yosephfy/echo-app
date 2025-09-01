import React from "react";
import { ViewStyle } from "react-native";
import MessageComposer, { MessageComposerProps, ComposerAttachment } from "./MessageComposer";

export interface ChatInputProps {
  onSend: (text: string) => void | Promise<void>;
  onSendAttachments?: (
    text: string,
    attachments: ComposerAttachment[]
  ) => void | Promise<void>;
  sending: boolean;
  placeholder?: string;
  multiline?: boolean;
  sendOnEnter?: boolean;
  containerStyle?: ViewStyle;
  onFocus?: () => void;
  avoidKeyboard?: boolean;
  keyboardVerticalOffset?: number;
  useKeyboardAvoidingView?: boolean;
}

export default function ChatInputComponent({
  onSend,
  onSendAttachments,
  sending,
  placeholder = "Message",
  multiline = true,
  sendOnEnter,
  containerStyle,
  onFocus,
  avoidKeyboard,
  keyboardVerticalOffset,
  useKeyboardAvoidingView,
}: ChatInputProps) {
  const props: MessageComposerProps = {
    onSend,
    onSendAttachments,
    sending,
    placeholder,
    multiline,
    sendOnEnter,
    containerStyle,
    onFocus,
    enableAttachments: true,
    avoidKeyboard,
    keyboardVerticalOffset,
    useKeyboardAvoidingView,
  };

  return <MessageComposer {...props} />;
}
