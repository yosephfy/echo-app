// mobile/src/navigation/OnboardingNavigator.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChooseProfileScreen from "../screens/ChooseProfileScreen";

export type OnboardingParamList = {
  ChooseProfile: { handle: string; avatarUrl: string };
};

const Stack = createNativeStackNavigator<OnboardingParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChooseProfile" component={ChooseProfileScreen} />
    </Stack.Navigator>
  );
}
