import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
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
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Change Email</Text>
        <Text style={[styles.help, { color: colors.muted }]}>
          Updating your email will change where we notifications, and sign-in
          links. You may need to verify the new address.
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>New email</Text>
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
          style={[
            styles.input,
            { borderColor: colors.outline, backgroundColor: colors.input, color: colors.text },
            !!emailError && { borderColor: colors.error },
          ]}
          accessibilityLabel="New email address"
          returnKeyType="next"
        />
        {!!emailError && <Text style={[styles.error, { color: colors.error }]}>{emailError}</Text>}

        {
          <>
            <Text style={[styles.label, { marginTop: 16, color: colors.text }]}>
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
              style={[
                styles.input,
                { borderColor: colors.outline, backgroundColor: colors.input, color: colors.text },
                !!passwordError && { borderColor: colors.error },
              ]}
              accessibilityLabel="Current password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            {!!passwordError && (
              <Text style={[styles.error, { color: colors.error }]}>{passwordError}</Text>
            )}
          </>
        }

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            [styles.primaryBtn, { backgroundColor: colors.primary }],
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
  container: { flex: 1 },
  content: { flex: 1, padding: 20, gap: 8, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  help: { fontSize: 14, marginBottom: 12, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    fontSize: 16,
  },
  error: { fontSize: 12, marginTop: 4 },
  primaryBtn: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
