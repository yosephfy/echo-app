// components/BackButton.tsx
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { IconSvg } from "../icons/IconSvg";

const BackButton: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  return (
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <IconSvg icon="chevron-left" state="default" size={24} />
      <Text style={[styles.text, { color: colors.text }]}>Back</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    //padding: 12,
    marginLeft: 0,
    flexDirection: "row",
    gap: 0,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
  },
});

export default BackButton;
