// mobile/src/screens/Settings/SettingsHomeScreen.tsx
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { FlatList, SafeAreaView, StyleSheet, View } from "react-native";
import { SettingsRow, SettingsRowProps } from "../../components/SettingRow";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";
import { useTheme } from "../../theme/ThemeContext";

type Props = NativeStackScreenProps<
  AccountSettingsStackParamList,
  "SettingsHome"
>;

export default function SettingsHomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const MENU_ITEMS: SettingsRowProps<any>[] = [
    {
      type: "navigation",
      label: "Edit Profile",
      icon: "circle-user",
      options: {
        onPress: () => {},
        route: "EditProfile",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "email",
      label: "Change Email",
      options: {
        onPress: () => {},
        route: "ChangeEmail",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "lock",
      label: "Change Password",
      options: {
        onPress: () => {},
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
        onPress: () => {},
        route: "Privacy",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "shield-lock",
      label: "Security",
      options: {
        onPress: () => {},
        route: "Security",
        navigation,
      },
    } as SettingsRowProps<"navigation">,
    {
      type: "navigation",
      icon: "file-document",
      label: "About & Terms",
      options: {
        onPress: () => {},
        route: "About",
        navigation,
      },
    },
    {
      type: "navigation",
      icon: "help",
      label: "Help & FAQs",
      options: {
        onPress: () => {},
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
        onPress: () => {},
      },
    } as SettingsRowProps<"button">,
    {
      type: "button",
      icon: "logout",
      label: "Sign Out",
      options: {
        onPress: () => {},
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
