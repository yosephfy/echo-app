import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../theme/ThemeContext";

export function useShare(secretId: string) {
  const [visible, setVisible] = useState(false);
  const { colors } = useTheme();
  const link = `https://yourapp.com/secret/${secretId}`;

  const share = () => setVisible(true);

  const ShareModal = () => (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Share Secret
          </Text>
          <TouchableOpacity
            style={styles.option}
            onPress={async () => {
              await Share.share({ message: link });
              setVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>Native Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={async () => {
              await Clipboard.setStringAsync(link);
              Alert.alert("Copied!", "Link copied to clipboard.");
              setVisible(false);
            }}
          >
            <Text style={{ color: colors.text }}>Copy Link</Text>
          </TouchableOpacity>
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

  return { share, ShareModal };
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
