import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import FeedScreen from "../screens/FeedScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import ProfileScreen from "../screens/ProfileScreen";

import SecretDetailScreen from "../screens/SecretDetailScreen";
import AdminPanelScreen from "../screens/AdminPannelScreen";
import AccountSettingsNavigator, {
  AccountSettingsStackParamList,
} from "./AccountScreenNavigator";

import BackButton from "../components/BackButtonComponent";
import { IconSvg } from "../icons/IconSvg";
import { IconName } from "../icons/icons";
import { useTheme } from "../theme/ThemeContext";
import useMe from "../hooks/useMe";
import { TouchableOpacity, View } from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import ChatListScreen from "../screens/ChatListScreen";
import UserPickerScreen from "../screens/UserPickerScreen";

// --- Types ---
export type TabParamList = {
  Feed: undefined;
  Discover: undefined;
  Chats: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: any;
  SecretDetail: any;
  AccountSettings: any;
  Admin: undefined;
  UserPicker:
    | {
        mode?: "single" | "multiple";
        preselectedIds?: string[];
        title?: string;
        submitText?: string;
        onSubmit?: (
          users: { id: string; handle: string; avatarUrl?: string | null }[]
        ) => void;
      }
    | undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { colors } = useTheme();
  const { user } = useMe();
  const nav =
    useNavigation<NavigationProp<RootStackParamList, "AccountSettings">>();

  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarIcon: ({ size, focused }) => {
          let iconName: IconName = "home";
          if (route.name === "Feed") iconName = "home";
          else if (route.name === "Discover") iconName = "search-alt";
          else if (route.name === "Chats") iconName = "comment";
          else if (route.name === "Profile") iconName = "circle-user";

          return (
            <IconSvg
              icon={iconName}
              size={size}
              state={focused ? "pressed" : "default"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: user?.handle ?? "My Profile",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => nav.navigate("AccountSettings")}
              style={{ marginHorizontal: 20 }}
            >
              <IconSvg icon="settings" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom tabs (only the four you want visible) */}
      <RootStack.Screen name="Tabs" component={MainTabs} />

      {/* Stack-only screens (hidden from tab bar, still navigable) */}
      <RootStack.Screen
        name="SecretDetail"
        component={SecretDetailScreen}
        options={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => <BackButton />,
        }}
      />
      <RootStack.Screen
        name="AccountSettings"
        component={AccountSettingsNavigator}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="Admin"
        component={AdminPanelScreen}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="UserPicker"
        component={UserPickerScreen}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
