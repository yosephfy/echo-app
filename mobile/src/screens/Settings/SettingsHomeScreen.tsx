// mobile/src/screens/Settings/SettingsHomeScreen.tsx
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Alert, FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { api } from "../../api/client";
import { SettingsRow, SettingsRowProps } from "../../components/SettingRow";
import useAsyncAction from "../../hooks/useAsyncAction";
import useOnboard from "../../hooks/useOnboard";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../theme/ThemeContext";
import { seedSettingsDefinitions } from "../../scripts/seed-setting-defs";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "SettingsHome"
>;

export default function SettingsHomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { logout } = useOnboard();
  const { token, setToken } = useAuthStore((s) => s);
  const [signOut, { loading }] = useAsyncAction(
    async () => await logout(),
    (e) => alert("Sign Out Failed: " + e.message)
  );

  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.del("/users/me");
              await SecureStore.deleteItemAsync("jwt");
              setToken(null);
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ]
    );
  };
  const MENU_ITEMS: SettingsRowProps<any>[] = [
    {
      type: "navigation",
      label: "Edit Profile",
      icon: "circle-user",
      options: {
        route: "EditProfile",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "email",
      label: "Change Email",
      options: {
        route: "ChangeEmail",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "lock",
      label: "Change Password",
      options: {
        route: "ChangePassword",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "switch",
      icon: "bell",
      label: "Enable Notifications",
      options: {
        value: false,
        onValueChange: () => {},
      },
    } as SettingsRowProps<"switch">,
    {
      type: "dropdown",
      icon: "color-palette",
      label: "Appearance",
      options: {
        items: [
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
          { label: "System", value: "system" },
        ],
        selected: "system",
        onSelect: (item: string) => {},
      },
    } as SettingsRowProps<"dropdown">,

    {
      type: "navigation",
      icon: "eye-off",
      label: "Privacy",
      options: {
        route: "Privacy",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "shield-lock",
      label: "Security",
      options: {
        route: "Security",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "file-document",
      label: "About & Terms",
      options: {
        route: "About",
        navigation,
      },
    },
    {
      type: "navigation",
      icon: "help",
      label: "Help & FAQs",
      options: {
        route: "Help",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "button",
      icon: "trash",
      label: "Delete Account",
      options: {
        buttonText: "Delete",
        onPress: deleteAccount,
      },
    } as SettingsRowProps<"button">,
    {
      type: "button",
      icon: "logout",
      label: "Sign Out",
      options: {
        onPress: signOut,
        buttonText: "Sign Out",
      },
    } as SettingsRowProps<"button">,
    {
      type: "button",
      label: "App Version",
      options: {
        onPress: () => {}, // disabled, so user can’t press
        buttonText: "1.0.0",
      },
      disabled: true,
    } as SettingsRowProps<"button">,
    {
      type: "button",
      label: "seed",
      options: { onPress: () => seedSettingsDefinitions() },
    } as SettingsRowProps<"button">,
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={MENU_ITEMS}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <SettingsRow
            label={item.label}
            type={item.type}
            options={item.options}
            disabled={item.disabled}
            icon={item.icon}
          />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68, // align under text not icon
  },
});
