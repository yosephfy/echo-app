import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { sanitizeEmail } from "../../utils/sanitize";

const isValidEmail = (email: string) => {
  // Robust-enough RFC 5322-inspired check for common cases
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
  return re.test(email) && email.length <= 254;
};

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "ChangeEmail"
>;
const ChangeEmailScreen = ({ navigation }: Props) => {
  const updateEmail = ({
    newEmail,
    currentPassword,
  }: {
    newEmail: string;
    currentPassword: string;
  }) => {};
  const [email, setEmail] = useState("currentEmail");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);

  const sanitizedEmail = useMemo(() => sanitizeEmail(email), [email]);

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (!sanitizedEmail) return "Email is required.";
    if (!isValidEmail(sanitizedEmail))
      return "Please enter a valid email address.";
    return "";
  }, [touched.email, sanitizedEmail]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "Current password is required.";
    if (password.length < 6) return "Password seems too short.";
    return "";
  }, [password, touched.password]);

  const canSubmit = useMemo(() => {
    const base = !!sanitizedEmail && isValidEmail(sanitizedEmail);
    const pwOk = !!password && password.length >= 6;
    return base && pwOk && !loading;
  }, [loading, sanitizedEmail, password]);

  const onSubmit = useCallback(async () => {
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setLoading(true);
    try {
      await updateEmail({
        newEmail: sanitizedEmail,
        currentPassword: password,
      });
      Alert.alert(
        "Email updated",
        "Your email address was changed successfully."
      );
    } catch (err: any) {
      const message =
        err?.message ||
        "We couldn't update your email right now. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, password, sanitizedEmail, updateEmail]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Change Email</Text>
        <Text style={styles.help}>
          Updating your email will change where we notifications, and sign-in
          links. You may need to verify the new address.
        </Text>

        <Text style={styles.label}>New email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          style={[styles.input, !!emailError && styles.inputError]}
          accessibilityLabel="New email address"
          returnKeyType="next"
        />
        {!!emailError && <Text style={styles.error}>{emailError}</Text>}

        {
          <>
            <Text style={[styles.label, { marginTop: 16 }]}>
              Current password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              style={[styles.input, !!passwordError && styles.inputError]}
              accessibilityLabel="Current password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {!!passwordError && (
              <Text style={styles.error}>{passwordError}</Text>
            )}
          </>
        }

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            !canSubmit && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save new email"
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryBtnText}>Save Email</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangeEmailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 20, gap: 8, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  help: { fontSize: 14, color: "#555", marginBottom: 12, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#222" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#e11d48" },
  error: { color: "#e11d48", fontSize: 12, marginTop: 4 },
  primaryBtn: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#111827",
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
