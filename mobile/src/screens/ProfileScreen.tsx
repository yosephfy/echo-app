import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../api/client";
import { AppStackParamList } from "../navigation/AppNavigator";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeContext";

type Props = NativeStackScreenProps<AppStackParamList, "Profile">;

interface Stats {
  postsCount: number;
  bookmarksCount: number;
  currentStreak: number;
}

export default function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: theme.colors.background,
    },
    heading: { fontSize: 22, marginBottom: 16, color: theme.colors.text },
    stat: { fontSize: 16, marginVertical: 4, color: theme.colors.text },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    button: {
      marginTop: 24,
      backgroundColor: theme.colors.primary,
      padding: 12,
      borderRadius: 4,
      alignItems: "center",
    },
    buttonText: { color: "#fff", fontSize: 16 },
  });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;
    api
      .get<Stats>("/users/me/stats")
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text>Error loading stats.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Profile</Text>
      <Text style={styles.stat}>Posts: {stats.postsCount}</Text>
      <Text style={styles.stat}>Bookmarks: {stats.bookmarksCount}</Text>
      <Text style={styles.stat}>
        Current Streak: {stats.currentStreak} days
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AccountSettings")}
      >
        <Text style={styles.buttonText}>Go to Account Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
