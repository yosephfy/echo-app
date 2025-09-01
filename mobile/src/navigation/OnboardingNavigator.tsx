// mobile/src/navigation/OnboardingNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChooseProfileScreen from "../screens/ChooseProfileScreen";
import { useTheme } from "../theme/ThemeContext";

export type OnboardingParamList = {
  ChooseProfile: { handle: string; avatarUrl: string };
};

const Stack = createNativeStackNavigator<OnboardingParamList>();

export default function OnboardingNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="ChooseProfile" component={ChooseProfileScreen} />
    </Stack.Navigator>
  );
}
