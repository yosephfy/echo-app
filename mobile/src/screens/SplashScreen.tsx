import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";

export default function SplashScreen() {
  const restore = useAuthStore((s) => s.restoreToken);

  useEffect(() => {
    Promise.all([restore(), useSettingsStore.getState().hydrate()]).then(() => {
      // auth & settings hydrated
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
