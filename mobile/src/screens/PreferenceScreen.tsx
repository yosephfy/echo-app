// mobile/src/screens/PreferencesScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { api } from "../api/client";

interface Prefs {
  darkMode?: boolean;
  notifyCooldown?: boolean;
  notifyUnderReview?: boolean;
  language?: string;
}

export default function PreferencesScreen() {
  const [prefs, setPrefs] = useState<Prefs>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Prefs>("/preferences")
      .then(setPrefs)
      .catch((e) => Alert.alert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = async (key: keyof Prefs, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    try {
      await api.patch("/preferences", { [key]: value });
    } catch (e: any) {
      Alert.alert("Error saving preference", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings & Preferences</Text>

      <View style={styles.row}>
        <Text>Dark Mode</Text>
        <Switch
          value={!!prefs.darkMode}
          onValueChange={(v) => update("darkMode", v)}
        />
      </View>

      <View style={styles.row}>
        <Text>Notify on Cooldown Complete</Text>
        <Switch
          value={!!prefs.notifyCooldown}
          onValueChange={(v) => update("notifyCooldown", v)}
        />
      </View>

      <View style={styles.row}>
        <Text>Notify when Under Review</Text>
        <Switch
          value={!!prefs.notifyUnderReview}
          onValueChange={(v) => update("notifyUnderReview", v)}
        />
      </View>

      <Text style={styles.label}>Language</Text>
      <TextInput
        style={styles.input}
        value={prefs.language}
        onChangeText={(v) => update("language", v)}
        placeholder="e.g. en, es"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heading: { fontSize: 22, marginBottom: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  label: { marginTop: 24, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
});
