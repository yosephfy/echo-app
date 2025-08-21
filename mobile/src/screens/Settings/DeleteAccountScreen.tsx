import { View, Text, Alert, StyleSheet, Button } from "react-native";
import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { api } from "../../api/client";
import useOnboard from "../../hooks/useOnboard";
import { useAuthStore } from "../../store/authStore";
import * as SecureStore from "expo-secure-store";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "DeleteAccount"
>;
const DeleteAccountScreen = ({ navigation }: Props) => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.description}>
        Deleting your account will remove all your data permanently. You will
        not be able to recover your account or any information associated with
        it.
      </Text>
      <View style={styles.buttonContainer}>
        <Button title="Delete Account" color="red" onPress={confirmDelete} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
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
    color: "#333",
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default DeleteAccountScreen;
