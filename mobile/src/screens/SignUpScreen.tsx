import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { api } from "../api/client";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../store/authStore";

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const signUp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/register", { email, password });
      //Alert.alert("Success", "Account created! Please sign in.");

      const { access_token } = await api.post<{ access_token: string }>(
        "/auth/login",
        { email, password }
      );
      await SecureStore.setItemAsync("jwt", access_token);

      setToken(access_token);
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={signUp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Signing Up…" : "Sign Up"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 16, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 12,
  },
  disabled: {
    backgroundColor: "#888",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  link: { color: "#0066CC", textAlign: "center" },
});
