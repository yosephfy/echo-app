// mobile/src/theme/themes.ts
export interface ThemeTokens {
  colors: {
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    accent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSizes: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
  zIndices: {
    dropdown: number;
    modal: number;
    toast: number;
  };
}

export const lightTheme: ThemeTokens = {
  colors: {
    background: "#FFF",
    card: "#FFF7ED",
    text: "#333",
    muted: "#666",
    border: "#DDD",
    primary: "#4CAF50",
    success: "#4CAF50",
    warning: "#FFC107",
    error: "#F44336",
    accent: "#03A9F4",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fontSizes: { sm: 12, md: 16, lg: 20, xl: 24 },
  radii: { sm: 4, md: 8, lg: 16 },
  zIndices: { dropdown: 1000, modal: 1100, toast: 1200 },
};

export const darkTheme: ThemeTokens = {
  colors: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#EEE",
    muted: "#999",
    border: "#333",
    primary: "#81C784",
    success: "#81C784",
    warning: "#FFD54F",
    error: "#E57373",
    accent: "#29B6F6",
  },
  spacing: lightTheme.spacing,
  fontSizes: lightTheme.fontSizes,
  radii: lightTheme.radii,
  zIndices: lightTheme.zIndices,
};
