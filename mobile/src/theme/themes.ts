// mobile/src/theme/themes.ts
export interface ThemeTokens {
  /** Helpful flag for conditional styling */
  isDark: boolean;
  colors: {
    // Base surfaces
    background: string;
    card: string;
    surface: string; // slightly elevated surface
    surfaceAlt: string; // higher elevation or alt background

    // Text
    text: string;
    muted: string;
    link: string;

    // Icon
    icon: string;

    // UI
    border: string;
    outline: string; // stronger border when needed
    input: string; // input background
    overlay: string; // overlays, modals (rgba or hex with alpha)
    disabled: string; // disabled foreground/icon

    // Accents
    primary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    full: number; // round pills/avatars
  };
  elevations: {
    sm: number; // Android elevation
    md: number;
    lg: number;
  };
  shadows: {
    sm: string; // iOS shadow shorthand (color/offset/radius via StyleSheet may vary)
    md: string;
    lg: string;
  };
  zIndices: {
    dropdown: number;
    modal: number;
    toast: number;
  };
  durations: {
    fast: number;
    normal: number;
  };
}

export const lightTheme: ThemeTokens = {
  isDark: false,
  colors: {
    // Base surfaces
    background: "#FFFFFF",
    card: "#FFF7ED",
    surface: "#F8FAFC", // slate-50
    surfaceAlt: "#F1F5F9", // slate-100

    // Text
    text: "#333333", // gray-900
    muted: "#6B7280", // gray-500
    link: "#2563EB", // blue-600

    //icon
    icon: "#655C65",

    // UI
    border: "#E5E7EB", // gray-200
    outline: "#D1D5DB", // gray-300
    input: "#FFFFFF",
    overlay: "rgba(17, 24, 39, 0.5)",
    disabled: "#9CA3AF",

    // Accents
    primary: "#4CAF50",
    accent: "#03A9F4",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 },
  fontSizes: { xs: 11, sm: 13, md: 16, lg: 18, xl: 22, xxl: 28 },
  radii: { sm: 4, md: 8, lg: 16, full: 999 },
  elevations: { sm: 1, md: 3, lg: 6 },
  shadows: {
    sm: "0px 1px 2px rgba(0,0,0,0.06)",
    md: "0px 2px 8px rgba(0,0,0,0.10)",
    lg: "0px 6px 16px rgba(0,0,0,0.12)",
  },
  zIndices: { dropdown: 1000, modal: 1100, toast: 1200 },
  durations: { fast: 120, normal: 200 },
};

export const darkTheme: ThemeTokens = {
  isDark: true,
  colors: {
    // Base surfaces
    background: "#0B0B10",
    card: "#333333",
    surface: "#16161C",
    surfaceAlt: "#1B1B22",

    // Text
    text: "#dfdfdfff",
    muted: "#A1A1AA",
    link: "#60A5FA",

    //icon
    icon: "#655C65",

    // UI
    border: "#22232A",
    outline: "#2D2E36",
    input: "#191A1F",
    overlay: "rgba(0,0,0,0.6)",
    disabled: "#6B7280",

    // Accents
    primary: "#81C784",
    accent: "#29B6F6",
    success: "#22C55E",
    warning: "#FACC15",
    error: "#F87171",
  },
  spacing: lightTheme.spacing,
  fontSizes: lightTheme.fontSizes,
  radii: lightTheme.radii,
  elevations: lightTheme.elevations,
  shadows: {
    sm: "0px 1px 2px rgba(0,0,0,0.35)",
    md: "0px 2px 8px rgba(0,0,0,0.45)",
    lg: "0px 6px 16px rgba(0,0,0,0.55)",
  },
  zIndices: lightTheme.zIndices,
  durations: lightTheme.durations,
};
