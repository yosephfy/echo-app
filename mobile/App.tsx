import "react-native-gesture-handler";
import "react-native-reanimated";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/AuthNavigator";
import AppNavigator from "./src/navigation/AppNavigator"; // placeholder for main app flow
import SplashScreen from "./src/screens/SplashScreen";
import { useAuthStore } from "./src/store/authStore";
import { ThemeProvider } from "./src/theme/ThemeContext";

export default function App() {
  const { token, loading } = useAuthStore();

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
