import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen"; // placeholder
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PreferencesScreen from "../screens/PreferenceScreen";
import HelpScreen from "../screens/HelpScreen";
import AboutScreen from "../screens/AboutScreen";
import FeedScreen from "../screens/FeedScreen";

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  AccountSettings: undefined;
  Preferences: undefined;
  Help: undefined;
  About: undefined;
  Feed: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Preferences" component={PreferencesScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
    </Stack.Navigator>
  );
}
