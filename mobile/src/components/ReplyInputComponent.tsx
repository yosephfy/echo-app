// mobile/src/components/ReplyInput.tsx
import React from "react";
import MessageComposer from "./MessageComposer";
import { Platform, TouchableOpacity, Text, View } from "react-native";
import { useReplyComposer } from "../store/replyComposer";
import { useReplyMutations } from "../hooks/useReplyMutations";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  onSend: (text: string) => void | Promise<void>;
  sending: boolean;
  secretId: string;
}

// Backward-compatible thin wrapper that uses the new shared composer
export default function ReplyInput({ onSend, sending, secretId }: Props) {
  const rc = useReplyComposer();
  const { colors } = useTheme();
  const { editReply, editing } = useReplyMutations(secretId);

  const isEditing = rc.editing && !!rc.replyId;

  const handleSend = async (text: string) => {
    try {
      if (isEditing && rc.replyId) {
        const body = text ?? rc.text ?? "";
        if (!body.trim()) {
          return;
        }
        await editReply({ id: rc.replyId, text: body });
        rc.cancel();
      } else {
        await onSend(text);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to save reply");
    }
  };

  const CancelAccessory = isEditing ? (
    <TouchableOpacity
      onPress={rc.cancel}
      style={{ paddingHorizontal: 8, paddingVertical: 6 }}
    >
      <Text style={{ color: colors.muted }}>Cancel</Text>
    </TouchableOpacity>
  ) : null;

  return (
    <>
      {isEditing && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Editing reply…
          </Text>
        </View>
      )}
      <MessageComposer
        onSend={handleSend}
        sending={sending || editing}
        placeholder="Write a reply..."
        multiline={false}
        enableAttachments={false}
        useKeyboardAvoidingView
        keyboardVerticalOffset={
          Platform.select({ ios: 128, android: 0 }) as number
        }
        leftAccessory={CancelAccessory}
        value={isEditing ? rc.text : undefined}
        onChangeText={isEditing ? rc.setText : undefined}
        submitLabel={isEditing ? "Save" : undefined}
      />
    </>
  );
}
