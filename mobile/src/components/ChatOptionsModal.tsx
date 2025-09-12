import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";

export type ChatOption = {
  label: string;
  action: () => void;
  destructive?: boolean;
};

export type ChatOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  options: ChatOption[];
  title?: string;
};

export default function ChatOptionsModal({
  visible,
  onClose,
  options,
  title = "Conversation",
}: ChatOptionsModalProps) {
  const { colors } = useTheme();
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {!!title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.option}
              onPress={() => {
                try {
                  opt.action();
                } finally {
                  onClose();
                }
              }}
            >
              <Text
                style={{
                  color: opt.destructive ? "#d22" : colors.text,
                  fontWeight: opt.destructive ? "600" : "400",
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={{ color: colors.primary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  modal: { borderRadius: 8, padding: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  option: { paddingVertical: 10 },
  cancel: { marginTop: 16, alignItems: "center" },
});
