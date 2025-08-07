// mobile/src/navigation/AccountSettingsNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsHomeScreen from "../screens/Settings/SettingsHomeScreen";
import HelpScreen from "../screens/Settings/HelpScreen";
import AppearanceScreen from "../screens/Settings/AppearanceScreen";
import ChangeEmailScreen from "../screens/Settings/ChangeEmailScreen";
import ChangePasswordScreen from "../screens/Settings/ChangePasswordScreen";
import DeleteAccountScreen from "../screens/Settings/DeleteAccountScreen";
import EditProfileScreen from "../screens/Settings/EditProfileScreen";
import AboutScreen from "../screens/Settings/AboutScreen";
import NotificationsScreen from "../screens/Settings/NotificationsScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import SecurityScreen from "../screens/Settings/SecurityScreen";
import BackButton from "../components/BackButtonComponent";

export type AccountSettingsStackParamList = {
  SettingsHome: undefined;
  EditProfile: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  Security: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Appearance: undefined;
  DataExport: undefined;
  Help: undefined;
  About: undefined;
  SignOut: undefined;
  DeleteAccount: undefined;
};

const Stack = createNativeStackNavigator<AccountSettingsStackParamList>();

export default function AccountSettingsNavigator() {
  return (
    <Stack.Navigator initialRouteName="SettingsHome">
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{
          title: "Settings",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}
