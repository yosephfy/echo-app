import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { api } from "../api/client";
import { useTheme } from "../theme/ThemeContext";

const REASONS = [
  { label: "Spam", value: "spam" },
  { label: "Inappropriate", value: "inappropriate" },
  { label: "Harassment", value: "harassment" },
  { label: "Other", value: "other" },
];

export function useReport(secretId: string) {
  const [isVisible, setVisible] = useState(false);
  const { colors } = useTheme();

  const report = () => setVisible(true);

  const ReportModal = () => (
    <Modal transparent visible={isVisible} animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Report Secret
          </Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={styles.option}
              onPress={async () => {
                try {
                  await api.post(`/secrets/${secretId}/report`, {
                    reason: r.value,
                  });
                  Alert.alert("Reported", "Thank you for your feedback.");
                } catch (err: any) {
                  console.error(err);
                  Alert.alert("Error", "Could not submit report.");
                } finally {
                  setVisible(false);
                }
              }}
            >
              <Text style={{ color: colors.text }}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.cancel}
            onPress={() => setVisible(false)}
          >
            <Text style={{ color: colors.primary }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return { report, ReportModal };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 24,
  },
  modal: {
    borderRadius: 8,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  option: { paddingVertical: 10 },
  cancel: { marginTop: 16, alignItems: "center" },
});
