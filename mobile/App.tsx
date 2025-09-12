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
import { QueryProvider } from "./src/query/client";
import { GlobalModalProvider } from "./src/components/modal/GlobalModalProvider";

export default function App() {
  const token = useAuthStore((s) => s.token);
  const loading = useAuthStore((s) => s.loading);
  const onboarded = useAuthStore((s) => s.onboarded);
  const restoreToken = useAuthStore((s) => s.restoreToken);
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
  }, []);

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
        <QueryProvider>
          <GlobalModalProvider>
            <NavigationContainer>
              {!token ? (
                <AuthNavigator />
              ) : !onboarded ? (
                <OnboardingNavigator />
              ) : (
                <AppNavigator />
              )}
            </NavigationContainer>
          </GlobalModalProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
