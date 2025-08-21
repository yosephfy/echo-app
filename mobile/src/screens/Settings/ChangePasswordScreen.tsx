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

const commonPasswords = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "111111",
  "123123",
  "abc123",
  "letmein",
  "iloveyou",
]);

const passwordChecks = (pwd: string) => {
  const issues: string[] = [];
  if (pwd.length < 8) issues.push("At least 8 characters.");
  if (!/[A-Z]/.test(pwd)) issues.push("One uppercase letter.");
  if (!/[a-z]/.test(pwd)) issues.push("One lowercase letter.");
  if (!/[0-9]/.test(pwd)) issues.push("One number.");
  if (!/[^\w\s]/.test(pwd)) issues.push("One symbol.");
  if (commonPasswords.has(pwd)) issues.push("Avoid common passwords.");
  if (/^\s|\s$/.test(pwd)) issues.push("No leading/trailing spaces.");
  return issues;
};

const strengthLabel = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^\w\s]/.test(pwd)) score++;
  if (!pwd) return "";
  if (score <= 2) return "Weak";
  if (score === 3) return "Okay";
  if (score === 4) return "Good";
  return "Strong";
};

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "ChangePassword"
>;

const ChangePasswordScreen = ({ navigation }: Props) => {
  const updatePassword = (params: {
    currentPassword: string;
    newPassword: string;
  }) => {};
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<{
    current?: boolean;
    new?: boolean;
    confirm?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);

  const newPasswordIssues = useMemo(
    () => passwordChecks(newPassword),
    [newPassword]
  );
  const matchError = useMemo(() => {
    if (!touched.confirm) return "";
    if (!confirm) return "Please confirm your new password.";
    return newPassword !== confirm ? "Passwords do not match." : "";
  }, [confirm, newPassword, touched.confirm]);

  const currentError = useMemo(() => {
    if (!touched.current) return "";
    if (!currentPassword) return "Current password is required.";
    if (currentPassword.length < 6) return "Current password seems too short.";
    return "";
  }, [currentPassword, touched.current]);

  const canSubmit = useMemo(() => {
    const okNew = newPassword && newPasswordIssues.length === 0;
    const okMatch = confirm && newPassword === confirm;
    const okCurrent = currentPassword && currentPassword.length >= 6;
    return okNew && okMatch && okCurrent && !loading;
  }, [
    newPassword,
    confirm,
    currentPassword,
    newPasswordIssues.length,
    loading,
  ]);

  const onSubmit = useCallback(async () => {
    setTouched({ current: true, new: true, confirm: true });
    if (!canSubmit) return;
    setLoading(true);
    try {
      await updatePassword({
        currentPassword: currentPassword,
        newPassword,
      });
      Alert.alert(
        "Password updated",
        "Your password was changed successfully."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setTouched({});
    } catch (err: any) {
      const message =
        err?.message ||
        "We couldn't change your password right now. Please try again.";
      Alert.alert("Update failed", message);
    } finally {
      setLoading(false);
    }
  }, [canSubmit, currentPassword, newPassword, updatePassword]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.help}>
          Choose a strong, unique password. Avoid reusing passwords from other
          sites.
        </Text>

        {
          <>
            <Text style={styles.label}>Current password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              onBlur={() => setTouched((t) => ({ ...t, current: true }))}
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="current-password"
              style={[styles.input, !!currentError && styles.inputError]}
              accessibilityLabel="Current password"
              returnKeyType="next"
            />
            {!!currentError && <Text style={styles.error}>{currentError}</Text>}
          </>
        }

        <Text style={[styles.label, { marginTop: 16 }]}>New password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          onBlur={() => setTouched((t) => ({ ...t, new: true }))}
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          style={[
            styles.input,
            touched.new && newPasswordIssues.length > 0 && styles.inputError,
          ]}
          accessibilityLabel="New password"
          returnKeyType="next"
        />
        {!!newPassword && (
          <Text style={styles.muted}>
            Strength: {strengthLabel(newPassword)}
          </Text>
        )}
        {touched.new && newPasswordIssues.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {newPasswordIssues.map((i) => (
              <Text key={i} style={styles.error}>
                • {i}
              </Text>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: 16 }]}>
          Confirm new password
        </Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          placeholder="Re-enter new password"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          style={[styles.input, !!matchError && styles.inputError]}
          accessibilityLabel="Confirm new password"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />
        {!!matchError && <Text style={styles.error}>{matchError}</Text>}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.primaryBtn,
            !canSubmit && styles.btnDisabled,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save new password"
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryBtnText}>Save Password</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChangePasswordScreen;

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
  muted: { color: "#6b7280", fontSize: 12, marginTop: 6 },
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
