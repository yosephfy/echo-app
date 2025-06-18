import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigation/AppNavigator";
import ComposerModal from "../components/ComposerModal";

type Props = NativeStackScreenProps<AppStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [showComposer, setShowComposer] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Echo (Dev Home)</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("AccountSettings")}
      >
        <Text style={styles.buttonText}>Account Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Profile")}
      >
        <Text style={styles.buttonText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Preferences")}
      >
        <Text style={styles.buttonText}>Preferences</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowComposer(true)}
      >
        <Text style={styles.buttonText}>New Secret</Text>
      </TouchableOpacity>

      <ComposerModal
        visible={showComposer}
        onClose={() => setShowComposer(false)}
        onPosted={() => {
          // e.g., refresh feed
        }}
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
  title: { fontSize: 22, marginBottom: 24, textAlign: "center" },
  button: {
    backgroundColor: "#0066CC",
    padding: 12,
    borderRadius: 4,
    width: "60%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },
});
