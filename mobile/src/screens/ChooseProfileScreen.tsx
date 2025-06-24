// mobile/src/screens/ChooseProfileScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import Avatar from "../components/Avatar";
import { useTheme } from "../theme/ThemeContext";

interface PreviewData {
  handle: string;
  avatarUrl: string;
}

export default function ChooseProfileScreen() {
  const { colors } = useTheme();
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);

  const [handle, setHandle] = useState<string>();
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [loading, setLoading] = useState(true);

  // Load the preview (handle + avatarUrl) from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const data = await SecureStore.getItemAsync("signup_preview");
        if (data) {
          const { handle, avatarUrl } = JSON.parse(data) as PreviewData;
          setHandle(handle);
          setAvatarUrl(avatarUrl);
        } else {
          Alert.alert("Error", "No signup data found.");
        }
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshProfile = async (
    refreshHandle: boolean,
    refreshAvatar: boolean
  ) => {
    if (!token) {
      Alert.alert("Error", "Not authenticated");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<Partial<PreviewData>>(
        "/users/refresh-profile",
        { handle: refreshHandle, avatar: refreshAvatar }
      );
      if (res.handle) setHandle(res.handle);
      if (res.avatarUrl) setAvatarUrl(res.avatarUrl);
      // update stored preview
      await SecureStore.setItemAsync(
        "signup_preview",
        JSON.stringify({
          handle: res.handle || handle!,
          avatarUrl: res.avatarUrl || avatarUrl!,
        })
      );
    } catch (err: any) {
      Alert.alert("Refresh Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!token) {
      Alert.alert("Error", "Missing authentication token.");
      return;
    }
    setToken(token, true); // mark onboarded
    await SecureStore.deleteItemAsync("signup_preview");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Choose Your Profile
      </Text>

      {avatarUrl ? (
        <Avatar url={avatarUrl} handle={handle!} />
      ) : (
        <ActivityIndicator size="large" color={colors.primary} />
      )}

      <Text style={[styles.handleText, { color: colors.primary }]}>
        @{handle}
      </Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: colors.primary }]}
          onPress={() => refreshProfile(true, false)}
        >
          <Text style={{ color: colors.primary }}>New Handle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: colors.primary }]}
          onPress={() => refreshProfile(false, true)}
        >
          <Text style={{ color: colors.primary }}>New Avatar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={confirm}
      >
        <Text style={styles.buttonText}>Confirm & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, marginBottom: 16 },
  handleText: { fontSize: 20, marginVertical: 12 },
  row: { flexDirection: "row", marginBottom: 24 },
  smallButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  button: { padding: 12, borderRadius: 4 },
  buttonText: { color: "#fff", fontSize: 16 },
});
