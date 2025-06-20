import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen"; // placeholder
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PreferencesScreen from "../screens/PreferenceScreen";
import HelpScreen from "../screens/HelpScreen";
import AboutScreen from "../screens/AboutScreen";
import FeedScreen from "../screens/FeedScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import AdminPanelScreen from "../screens/AdminPannelScreen";

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  AccountSettings: undefined;
  Preferences: undefined;
  Help: undefined;
  About: undefined;
  Feed: undefined;
  Discover: undefined;
  Bookmarks: undefined;
  Admin: undefined; // Only available in development
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
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
      {__DEV__ && <Stack.Screen name="Admin" component={AdminPanelScreen} />}
    </Stack.Navigator>
  );
}
