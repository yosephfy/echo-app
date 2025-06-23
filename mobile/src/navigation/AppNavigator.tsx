import { MaterialIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import BookmarksScreen from "../screens/BookmarksScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import FeedScreen from "../screens/FeedScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useTheme } from "../theme/ThemeContext";
import AccountSettingsScreen from "../screens/AccountSettingsScreen";
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
  Admin: undefined;
};
const Tab = createBottomTabNavigator();

export default function TabsNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = "home";

          if (route.name === "Feed") iconName = "dynamic-feed";
          else if (route.name === "Discover") iconName = "search";
          else if (route.name === "Bookmarks") iconName = "bookmark";
          else if (route.name === "Profile") iconName = "person";

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
      <Tab.Screen name="Admin" component={AdminPanelScreen} />
      <Tab.Screen
        name="AccountSettings"
        component={(props: any) => <AccountSettingsScreen {...props} />}
      />
      <Tab.Screen
        name="Profile"
        component={(props: any) => <ProfileScreen {...props} />}
      />
    </Tab.Navigator>
  );
}
