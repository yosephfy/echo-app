// mobile/src/screens/AccountSettingsScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<AppStackParamList, "AccountSettings">;

export default function AccountSettingsScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const setToken = useAuthStore((s) => s.setToken);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ email: string; avatarUrl?: string }>("/users/me")
      .then((u) => {
        setEmail(u.email);
        if (u.avatarUrl) setAvatarUrl(u.avatarUrl);
      })
      .catch((e) => console.error(e));
  }, [token]);

  const updateCredentials = async () => {
    try {
      await api.patch("/users/me/credentials", { email, password });
      Alert.alert("Success", "Credentials updated");
      setPassword("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const updateAvatar = async () => {
    try {
      await api.patch("/users/me/avatar", { avatarUrl });
      Alert.alert("Success", "Avatar updated");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("jwt");
    setToken(null);
  };

  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.del("/users/me");
              await SecureStore.deleteItemAsync("jwt");
              setToken(null);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account Settings</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={updateCredentials}>
        <Text style={styles.buttonText}>Update Credentials</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Avatar URL</Text>
      <TextInput
        value={avatarUrl}
        onChangeText={setAvatarUrl}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={updateAvatar}>
        <Text style={styles.buttonText}>Update Avatar</Text>
      </TouchableOpacity>

      {/* Developer-only actions */}
      <View style={styles.divider} />

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={deleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      {/* New navigation buttons */}
      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("Help")}
      >
        <Text style={styles.linkText}>Help</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate("About")}
      >
        <Text style={styles.linkText}>About</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  heading: { fontSize: 22, marginBottom: 16 },
  label: { fontSize: 14, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontSize: 16 },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 24,
  },
  signOutButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  signOutText: { color: "#fff", fontSize: 16 },
  deleteButton: {
    backgroundColor: "#CC0000",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  deleteText: { color: "#fff", fontSize: 16 },
  linkButton: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#0066CC",
    alignItems: "center",
    marginBottom: 12,
  },
  linkText: { color: "#0066CC", fontSize: 16 },
});
