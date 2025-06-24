// mobile/src/screens/SignUpScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { AuthStackParamList } from "../navigation/AuthNavigator";
import { useTheme } from "../theme/ThemeContext";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

interface RegisterResponse {
  user: { handle: string; avatarUrl: string };
  access_token: string;
}

export default function SignUpScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const setToken = useAuthStore((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signUp = async () => {
    setLoading(true);
    try {
      // 1) register
      const res = await api.post<RegisterResponse>("/auth/register", {
        email,
        password,
      });
      const { user, access_token } = res;

      // 2) store JWT so refresh-profile calls work
      await SecureStore.setItemAsync("jwt", access_token);

      // 3) save preview data for onboarding
      await SecureStore.setItemAsync(
        "signup_preview",
        JSON.stringify({ handle: user.handle, avatarUrl: user.avatarUrl })
      );

      // 4) enter onboarding (onboarded = false)
      setToken(access_token, false);

      // 5) navigate into ChooseProfile screen
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>

      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text },
        ]}
        placeholder="Email"
        placeholderTextColor={colors.text + "99"}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />

      <TextInput
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.text },
        ]}
        placeholder="Password"
        placeholderTextColor={colors.text + "99"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
          loading && styles.disabled,
        ]}
        onPress={signUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={[styles.link, { color: colors.primary }]}>
          Have an account? Sign In
        </Text>
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
  title: { fontSize: 24, marginBottom: 16 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    marginVertical: 12,
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16 },
  link: { marginTop: 8 },
});
