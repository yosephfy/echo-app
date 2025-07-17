// mobile/src/screens/ChooseProfileScreen.tsx
import React from "react";
import AuthForm from "../components/AuthForm";
import useOnboard from "../hooks/useOnboard";
import Avatar from "../components/Avatar";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useOnboardStore } from "../store/onboardStore";

export default function ChooseProfileScreen() {
  const { preview } = useOnboardStore();
  const { refreshProfile, finish } = useOnboard();
  const { colors } = useTheme();
  if (!preview) {
    return (
      <ActivityIndicator
        style={{ flex: 1 }}
        color={colors.primary}
        size="large"
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>
        Choose Your Profile
      </Text>
      <Avatar url={preview.avatarUrl} handle={preview.handle} />
      <Text style={[styles.handle, { color: colors.primary }]}>
        @{preview.handle}
      </Text>
      <View style={styles.buttonRow}>
        <AuthForm
          fields={[]}
          submitLabel="New Handle"
          submitting={false}
          onSubmit={() => refreshProfile({ handle: true })}
        />
        <AuthForm
          fields={[]}
          submitLabel="New Avatar"
          submitting={false}
          onSubmit={() => refreshProfile({ avatar: true })}
        />
      </View>
      <AuthForm
        fields={[]}
        submitLabel="Confirm & Continue"
        submitting={false}
        onSubmit={((_values: any) => finish()) as any}
      />
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
  header: { fontSize: 24, marginBottom: 16 },
  handle: { fontSize: 20, marginVertical: 12 },
  buttonRow: { flexDirection: "row", marginBottom: 24 },
});
