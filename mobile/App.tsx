import { NavigationContainer } from "@react-navigation/native";
import { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api } from "./src/api/client";
import AppNavigator from "./src/navigation/AppNavigator"; // placeholder for main app flow
import AuthNavigator from "./src/navigation/AuthNavigator";
import OnboardingNavigator from "./src/navigation/OnboardingNavigator";
import SplashScreen from "./src/screens/SplashScreen";
import { useAuthStore } from "./src/store/authStore";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { registerForPushNotificationsAsync } from "./src/utils/pushNotifications";
import { useSettingsStore } from "./src/store/settingsStore";
import { ensureFirebaseSignedIn } from "./src/lib/firebase";

export default function App() {
  const { token, loading, onboarded, restoreToken } = useAuthStore();
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

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  // App.tsx (after restoreToken completes)
  useEffect(() => {
    if (token) {
      // hydrated settings for logged-in user
      useSettingsStore.getState().hydrate();
      ensureFirebaseSignedIn().catch((e) =>
        console.warn("Firebase sign-in failed:", e?.message || e)
      );
    } else {
      useSettingsStore.getState().clear();
    }
  }, [token]);
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer>
          {!token ? (
            <AuthNavigator />
          ) : !onboarded ? (
            <OnboardingNavigator />
          ) : (
            <AppNavigator />
          )}
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
