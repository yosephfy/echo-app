// mobile/src/navigation/AccountSettingsNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import BackButton from "../components/BackButtonComponent";
import AboutScreen from "../screens/Settings/AboutScreen";
import AccountScreen from "../screens/Settings/AccountScreen";
import DisplayScreen from "../screens/Settings/AppearanceScreen";
import ChangeEmailScreen from "../screens/Settings/ChangeEmailScreen";
import ChangePasswordScreen from "../screens/Settings/ChangePasswordScreen";
import EditProfileScreen from "../screens/Settings/EditProfileScreen";
import HelpScreen from "../screens/Settings/HelpScreen";
import NotificationsScreen from "../screens/Settings/NotificationsScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import SettingsHomeScreen from "../screens/Settings/SettingsHomeScreen";
import DeleteAccountScreen from "../screens/Settings/DeleteAccountScreen";

export type AccountSettingsStackParamList = {
  SettingsHome: undefined;
  EditProfile: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Display: undefined;
  Account: undefined;
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
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Display" component={DisplayScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Stack.Navigator>
  );
}
