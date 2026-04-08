export type AppThemeKey = "dark-green" | "neon-blue" | "ember";

export interface AppTheme {
  key: AppThemeKey;
  label: string;
  background: string;
  card: string;
  cardBorder: string;
  surface: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const APP_THEMES: Record<AppThemeKey, AppTheme> = {
  "dark-green": {
    key: "dark-green",
    label: "Dark Green",
    background: "#0a0f0d",
    card: "#151c18",
    cardBorder: "#1e2a23",
    surface: "#1a2420",
    primary: "#22c55e",
    primaryLight: "#4ade80",
    primaryDark: "#16a34a",
    textPrimary: "#ffffff",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
  },
  "neon-blue": {
    key: "neon-blue",
    label: "Neon Blue",
    background: "#090e1a",
    card: "#111a2d",
    cardBorder: "#203151",
    surface: "#17233d",
    primary: "#38bdf8",
    primaryLight: "#7dd3fc",
    primaryDark: "#0ea5e9",
    textPrimary: "#eff6ff",
    textSecondary: "#bfdbfe",
    textMuted: "#7c93b8",
  },
  ember: {
    key: "ember",
    label: "Ember",
    background: "#110b09",
    card: "#1f1411",
    cardBorder: "#3b261e",
    surface: "#291b16",
    primary: "#fb923c",
    primaryLight: "#fdba74",
    primaryDark: "#ea580c",
    textPrimary: "#fff7ed",
    textSecondary: "#fed7aa",
    textMuted: "#c9a38b",
  },
};

export const THEME_OPTIONS: { key: AppThemeKey; label: string }[] = [
  { key: "dark-green", label: "Dark Green" },
  { key: "neon-blue", label: "Neon Blue" },
  { key: "ember", label: "Ember" },
];

export const getAppTheme = (themeKey: string): AppTheme => {
  if (themeKey in APP_THEMES) {
    return APP_THEMES[themeKey as AppThemeKey];
  }

  return APP_THEMES["dark-green"];
};
