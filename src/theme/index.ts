// ── Design tokens (Brand Guardian role) ───────────────────────────────────
// Dubai identity: deep marine blue + desert gold. Light = warm sand surfaces,
// dark = deep navy-graphite. Components read colors via useTheme() so the app
// follows the system appearance automatically.

import { useColorScheme } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  star: string;
}

export const lightColors: ThemeColors = {
  primary: '#0A3D62',
  primaryDark: '#072A45',
  primarySoft: '#E4EBF2',
  accent: '#D4A017',
  accentSoft: '#F5E6C8',
  accentText: '#7A5B00',
  success: '#1E8E5A',
  successSoft: '#E3F3EB',
  danger: '#C0392B',
  dangerSoft: '#FBE7E5',
  warning: '#E67E22',

  bg: '#FBF9F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F2EEE5',

  text: '#1A1A2E',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  border: '#E4DED1',
  star: '#F2B01E',
};

export const darkColors: ThemeColors = {
  primary: '#3D7CB0', // lighter marine for contrast on dark surfaces
  primaryDark: '#0A3D62',
  primarySoft: '#16293C',
  accent: '#E0B43A',
  accentSoft: '#332B14',
  accentText: '#E5C26B',
  success: '#3CC488',
  successSoft: '#10291C',
  danger: '#E06155',
  dangerSoft: '#321A18',
  warning: '#E89B4B',

  bg: '#0E1116',
  surface: '#161C24',
  surfaceAlt: '#1F2731',

  text: '#E8EAED',
  textMuted: '#98A1AD',
  textInverse: '#FFFFFF',

  border: '#2A333F',
  star: '#F2B01E',
};

export interface Theme {
  colors: ThemeColors;
  dark: boolean;
}

/** System-appearance-aware theme. Re-renders on light/dark switch. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { colors: dark ? darkColors : lightColors, dark };
}

// Legacy static export — light palette. Prefer useTheme() in components.
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const font = {
  h1: 28,
  h2: 20,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
