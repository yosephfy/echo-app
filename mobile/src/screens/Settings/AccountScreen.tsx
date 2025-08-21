import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import SectionedSettingsList from "../../components/SectionedSettingsList";
import { SettingsRowProps } from "../../components/SettingRow";
import { AccountSettingsStackParamList } from "../../navigation/AccountScreenNavigator";

type Props = NativeStackScreenProps<AccountSettingsStackParamList, "Account">;
const AccountScreen = ({ navigation }: Props) => {
  const MENU_ITEMS: any[] = [
    {
      key: "Profile",
      data: [
        {
          type: "navigation",
          icon: "circle-user",
          label: "Edit Profile",
          options: { route: "EditProfile", navigation },
        } as SettingsRowProps<"navigation">,
      ],
    },
    {
      key: "Manage Account",
      data: [
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
      ],
    },
    {
      key: "",
      data: [
        {
          type: "navigation",
          icon: "trash",
          label: "Delete Account",
          options: {
            route: "DeleteAccount",
            navigation,
          },
        } as SettingsRowProps<"navigation">,
      ],
    },
  ];
  return <SectionedSettingsList sections={MENU_ITEMS} />;
};

export default AccountScreen;
