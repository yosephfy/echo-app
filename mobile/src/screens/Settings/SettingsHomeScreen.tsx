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
      icon: "circle-user",
      label: "Account",
      options: {
        route: "Account",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "bell",
      label: "Notifications",
      options: {
        route: "Notifications",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "screen-smartphone",
      label: "Display",
      options: {
        route: "Display",
        navigation,
      },
    } as SettingsRowProps<"navigation">,

    {
      type: "navigation",
      icon: "lock",
      label: "Privacy & Security",
      options: {
        route: "Privacy",
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
      label: "Help",
      options: {
        route: "Help",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
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
      type: "info",
      label: "App Version",
      options: {
        value: "1.0.0",
      },
      disabled: true,
    } as SettingsRowProps<"info">,

    /*  {
      type: "button",
      label: "seed",
      options: { onPress: () => seedSettingsDefinitions() },
    } as SettingsRowProps<"button">, */
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
          <View style={[styles.separator, { backgroundColor: colors.outline }]} />
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
