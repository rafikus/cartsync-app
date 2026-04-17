// src/theme.ts
// Plain color/spacing/typography values.
// Import what you need directly — no StyleSheet here.

import { useColorScheme } from "react-native";

// ── Palette (raw hex values) ──────────────────────────────────────────────────

export const palette = {
  purple50: "#EEEDFE",
  purple100: "#CECBF6",
  purple200: "#AFA9EC",
  purple400: "#7F77DD",
  purple600: "#534AB7",
  purple800: "#3C3489",
  purple900: "#26215C",

  green50: "#EAF3DE",
  green100: "#C0DD97",
  green200: "#97C459",
  green400: "#639922",
  green600: "#3B6D11",
  green800: "#27500A",
  green900: "#173404",

  red50: "#FCEBEB",
  red100: "#F7C1C1",
  red400: "#E24B4A",
  red600: "#A32D2D",
  red900: "#501313",

  amber50: "#FAEEDA",
  amber100: "#FAC775",
  amber200: "#EF9F27",
  amber800: "#633806",
  amber900: "#412402",

  blue400: "#378ADD",

  teal400: "#1D9E75",

  gray50: "#F1EFE8",
  gray100: "#D3D1C7",
  gray200: "#B4B2A9",
  gray400: "#888780",
  gray600: "#5F5E5A",
  gray800: "#444441",
  gray900: "#2C2C2A",

  white: "#FFFFFF",
  off0: "#FFFFFF",
  off50: "#F8F8F6",
  off100: "#F0EFEA",
  off900: "#0D0D0C",
};

// ── Semantic token shapes ─────────────────────────────────────────────────────

export type ColorTokens = {
  bgApp: string;
  bgSurface: string;
  bgSubtle: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  borderDefault: string;
  borderStrong: string;
  accent: string;
  accentSubtle: string;
  accentText: string;
  accentTextDark: string;
  success: string;
  successText: string;
  successBorder: string;
  danger: string;
  dangerText: string;
  syncLive: string;
  syncPending: string;
  syncOffline: string;
  avatarBg: string;
  avatarText: string;
};

// ── Light tokens ──────────────────────────────────────────────────────────────

export const lightColors: ColorTokens = {
  bgApp: palette.off50,
  bgSurface: palette.off0,
  bgSubtle: palette.off100,
  text: palette.off900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textOnAccent: palette.white,
  borderDefault: "rgba(0,0,0,0.12)",
  borderStrong: "rgba(0,0,0,0.25)",
  accent: palette.purple600,
  accentSubtle: palette.purple50,
  accentText: palette.purple600,
  accentTextDark: palette.purple800,
  success: palette.green50,
  successText: palette.green800,
  successBorder: palette.green200,
  danger: palette.red50,
  dangerText: palette.red600,
  syncLive: palette.green600,
  syncPending: palette.amber200,
  syncOffline: palette.gray400,
  avatarBg: palette.purple100,
  avatarText: palette.purple800,
};

// ── Dark tokens ───────────────────────────────────────────────────────────────

export const darkColors: ColorTokens = {
  bgApp: palette.off900,
  bgSurface: palette.gray900,
  bgSubtle: palette.gray800,
  text: "#EEEEE8",
  textSecondary: palette.gray200,
  textTertiary: palette.gray400,
  textOnAccent: palette.white,
  borderDefault: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.22)",
  accent: palette.purple600,
  accentSubtle: palette.purple900,
  accentText: palette.purple200,
  accentTextDark: palette.purple100,
  success: palette.green900,
  successText: palette.green100,
  successBorder: palette.green800,
  danger: palette.red900,
  dangerText: palette.red100,
  syncLive: palette.green600,
  syncPending: palette.amber200,
  syncOffline: palette.gray600,
  avatarBg: palette.purple800,
  avatarText: palette.purple100,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useColors(): ColorTokens {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkColors : lightColors;
}

// ── Spacing ───────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

// ── Border radius ─────────────────────────────────────────────────────────────

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ── Font sizes ────────────────────────────────────────────────────────────────

export const text = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  "2xl": 22,
  "3xl": 28,
} as const;
