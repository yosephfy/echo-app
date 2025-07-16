// mobile/src/components/ReplyInput.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface Props {
  onSend: (text: string) => void;
  sending: boolean;
}

export default function ReplyInput({ onSend, sending }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    onSend(trimmed);
    setText("");
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <TextInput
        style={[
          styles.input,
          { color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Write a reply..."
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        editable={!sending}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleSend}
        disabled={sending || !text.trim()}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});
