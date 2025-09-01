import React, { createContext, ReactNode, useContext } from "react";
import { useColorScheme } from "react-native";
import { useSetting } from "../hooks/useSetting";
import { darkTheme, lightTheme } from "./themes";

type Theme = typeof lightTheme;

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' or 'dark'
  const [appearanceTheme] = useSetting<string>("appearance.theme");
  // appearance.theme expected values: 'system' | 'light' | 'dark'
  const choice = (appearanceTheme || "system").toLowerCase();
  const isDark =
    choice === "dark" || (choice === "system" && systemScheme === "dark");
  const theme = isDark ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
