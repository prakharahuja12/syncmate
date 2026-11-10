/**
 * SyncMate Design System Tokens
 * Strict color tokens, spacing, typography, category, and priority definitions.
 */

export const PRIORITY_COLORS = {
  high: '#E5484D',
  medium: '#F5A524',
  low: '#30A46C',
} as const;

export const CATEGORY_COLORS = {
  hackathon: '#8E4EC6',
  college: '#3E63DD',
  personal: '#30A46C',
  meeting: '#F5A524',
  competition: '#D6409F',
  other: '#8B8D98',
} as const;

export const STATUS_COLORS = {
  interested: '#3E63DD',
  planning: '#F5A524',
  registered: '#30A46C',
  not_interested: '#8B8D98',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export interface ColorTheme {
  isDark: boolean;
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  urgentBorder: string;
  urgentBg: string;
  accent: string;
  inputBg: string;
  tabBarBg: string;
  tabBarBorder: string;
}

export const LIGHT_THEME: ColorTheme = {
  isDark: false,
  bg: '#FFFFFF',
  surface: '#F7F7F8',
  card: '#FFFFFF',
  border: '#E7E7EA',
  text: '#18181B',
  muted: '#6B6B76',
  primary: '#5B5BD6',
  primaryForeground: '#FFFFFF',
  destructive: '#E5484D',
  urgentBorder: '#E5484D',
  urgentBg: 'rgba(229, 72, 77, 0.08)',
  accent: '#F0F0F3',
  inputBg: '#F7F7F8',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E7E7EA',
};

export const DARK_THEME: ColorTheme = {
  isDark: true,
  bg: '#0F0F11',
  surface: '#16161A',
  card: '#1A1A1F',
  border: '#2A2A31',
  text: '#EDEDEF',
  muted: '#9A9AA6',
  primary: '#7C7CF0',
  primaryForeground: '#0F0F11',
  destructive: '#E5484D',
  urgentBorder: '#E5484D',
  urgentBg: 'rgba(229, 72, 77, 0.16)',
  accent: '#232329',
  inputBg: '#16161A',
  tabBarBg: '#0F0F11',
  tabBarBorder: '#2A2A31',
};

