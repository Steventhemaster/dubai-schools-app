// ── Design tokens (Brand Guardian role) ───────────────────────────────────
// Dubai identity: deep marine blue + desert gold. Light = warm sand surfaces,
// dark = deep navy-graphite. Components read colors via useTheme() so the app
// follows the system appearance automatically.

import { useColorScheme } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  primaryText: string;
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
  surfaceSunken: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;
  border: string;
  borderStrong: string;
  star: string;
}

// Neutral-first palette: cool greys (no yellow cast) + deep teal-blue brand;
// gold reserved for stars / rare accents only.
export const lightColors: ThemeColors = {
  primary: '#0E4F66',
  primaryDark: '#0A3C4E',
  primarySoft: '#E1EEF2',
  primaryText: '#0A3C4E',
  accent: '#C8901A',
  accentSoft: '#F7ECD2',
  accentText: '#7A5B12',
  success: '#1E8E5A',
  successSoft: '#E4F4EC',
  danger: '#D14438',
  dangerSoft: '#FBE9E7',
  warning: '#E08A1E',

  bg: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1F4',
  surfaceSunken: '#ECEEF2',

  text: '#10151C',
  textMuted: '#5C6672',
  textSubtle: '#8A929C',
  textInverse: '#FFFFFF',

  border: '#E5E8EC',
  borderStrong: '#D4D9E0',
  star: '#F5A623',
};

export const darkColors: ThemeColors = {
  primary: '#4FB3CE', // teal, lightened for dark surfaces
  primaryDark: '#2E8AA3',
  primarySoft: '#12303A',
  primaryText: '#9FD9E6',
  accent: '#E0AE3C',
  accentSoft: '#2C2613',
  accentText: '#E5C26B',
  success: '#3CC488',
  successSoft: '#10291C',
  danger: '#E06155',
  dangerSoft: '#321A18',
  warning: '#E89B4B',

  bg: '#0B0E13',
  surface: '#151A21',
  surfaceAlt: '#1E242D',
  surfaceSunken: '#11161C',

  text: '#EAEDF1',
  textMuted: '#9AA4B0',
  textSubtle: '#6B7480',
  textInverse: '#FFFFFF',

  border: '#273039',
  borderStrong: '#39434E',
  star: '#F5B53A',
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
  h1: 30,
  h2: 22,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
} as const;

// Soft, diffuse shadows read as modern; heavy short shadows look dated.
export const shadow = {
  // 2026 direction: cards use hairline borders, not shadows. Reserve shadow
  // for genuinely floating UI. Cool-ink tint, very low opacity.
  soft: {
    shadowColor: '#0B0E13',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  // Hover/pressed lift on web — not used for resting cards.
  card: {
    shadowColor: '#0B0E13',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  // Floating elements only: bottom sheets, sticky CTA, gate card.
  lg: {
    shadowColor: '#0B0E13',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
} as const;
