import { View, Text, Alert, StyleSheet, Button } from "react-native";
import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { api } from "../../api/client";
import useOnboard from "../../hooks/useOnboard";
import { useAuthStore } from "../../store/authStore";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "../../theme/ThemeContext";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "DeleteAccount"
>;
const DeleteAccountScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const { logout } = useOnboard();
  const { token, setToken } = useAuthStore((s) => s);

  const deleteAccount = async () => {
    logout();
    try {
      await api.del("/users/me");
      await SecureStore.deleteItemAsync("jwt");
      setToken(null);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };
  const confirmDelete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.text }]}>Delete Account</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Deleting your account will remove all your data permanently. You will
        not be able to recover your account or any information associated with
        it.
      </Text>
      <View style={styles.buttonContainer}>
        <Button title="Delete Account" color={colors.error} onPress={confirmDelete} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default DeleteAccountScreen;
