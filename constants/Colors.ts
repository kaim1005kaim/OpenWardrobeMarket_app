export const Colors = {
  // Primary brand colors
  offwhite: '#F4F4F0',
  black: '#111111',
  klein: '#002FA7',
  accent: '#FF7A1A',

  // Ink scale
  ink: {
    900: '#111111',
    700: '#3A3A3A',
    400: '#777777',
    200: '#EAEAEA',
  },

  // Semantic colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // UI colors
  background: {
    primary: '#F4F4F0',
    secondary: '#FFFFFF',
    dark: '#111111',
  },

  text: {
    primary: '#111111',
    secondary: '#3A3A3A',
    tertiary: '#777777',
    inverse: '#F4F4F0',
  },

  border: {
    light: '#EAEAEA',
    medium: '#777777',
    dark: '#111111',
  },
} as const;

export type ColorKey = keyof typeof Colors;

// Legacy theme support (for existing components)
const tintColorLight = '#FF7A1A';
const tintColorDark = '#F4F4F0';

export default {
  light: {
    text: '#111111',
    background: '#F4F4F0',
    tint: tintColorLight,
    tabIconDefault: '#777777',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F4F4F0',
    background: '#111111',
    tint: tintColorDark,
    tabIconDefault: '#777777',
    tabIconSelected: tintColorDark,
  },
};
