import React, { createContext, useContext, ReactNode } from "react";
import { lightTheme, darkTheme } from "./themes";
import { useColorScheme } from "react-native";
import { usePreferencesStore } from "../store/preferencesStore";

type Theme = typeof lightTheme;

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' or 'dark'
  const prefs = usePreferencesStore((s) => s.prefs);
  const useDark = prefs.darkMode ?? systemScheme === "dark";

  const theme = useDark ? darkTheme : lightTheme;
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
