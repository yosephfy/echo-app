// mobile/src/components/ReplyInput.tsx
import React from "react";
import MessageComposer from "./MessageComposer";
import { Platform } from "react-native";

interface Props {
  onSend: (text: string) => void | Promise<void>;
  sending: boolean;
}

// Backward-compatible thin wrapper that uses the new shared composer
export default function ReplyInput({ onSend, sending }: Props) {
  return (
    <MessageComposer
      onSend={onSend}
      sending={sending}
      placeholder="Write a reply..."
      multiline={false}
      enableAttachments={false}
      useKeyboardAvoidingView
      keyboardVerticalOffset={
        Platform.select({ ios: 128, android: 0 }) as number
      }
    />
  );
}
