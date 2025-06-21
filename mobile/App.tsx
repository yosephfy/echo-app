import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import AppNavigator from "./src/navigation/AppNavigator"; // placeholder for main app flow
import AuthNavigator from "./src/navigation/AuthNavigator";
import SplashScreen from "./src/screens/SplashScreen";
import { useAuthStore } from "./src/store/authStore";
import { ThemeProvider } from "./src/theme/ThemeContext";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { api } from "./src/api/client";
import { registerForPushNotificationsAsync } from "./src/utils/pushNotifications";

export default function App() {
  const { token, loading } = useAuthStore();

  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        try {
          await api.post("/notifications/register", { token });
          console.log("✅ Push token registered with backend");
        } catch (err: any) {
          console.error("Failed to register push token:", err.message);
        }
      }
    })();
  }, []);
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        {token ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </ThemeProvider>
  );
}
