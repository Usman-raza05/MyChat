import { useColorScheme } from 'react-native';

export type ThemeName = 'Warm paper' | 'Midnight signal' | 'Coral daylight';

// Set the active chosen theme definition
export const CHOSEN_THEME: ThemeName = 'Warm paper';

export interface ThemeColors {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  myBubble: string;
  myBubbleText: string;
  theirBubble: string;
  theirBubbleText: string;
  textOnAccent: string;
  live: string;
  danger: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  bodySemiBold: string;
}

export interface ThemeTokens {
  name: ThemeName;
  colors: ThemeColors;
  fonts: ThemeFonts;
  radius: number;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export const THEMES: Record<
  ThemeName,
  { light: ThemeColors; dark: ThemeColors; fonts: ThemeFonts; radius: number }
> = {
  'Warm paper': {
    light: {
      bg: '#F5F0E6',
      surface: '#FFFDF8',
      ink: '#231F1A',
      muted: '#7A7167',
      line: '#E4DCCB',
      accent: '#1F7A5C',
      myBubble: '#D7ECDF',
      myBubbleText: '#231F1A',
      theirBubble: '#FFFDF8',
      theirBubbleText: '#231F1A',
      textOnAccent: '#FFFFFF',
      live: '#1F7A5C',
      danger: '#C0392B',
    },
    dark: {
      bg: '#14110E',
      surface: '#1D1914',
      ink: '#F1EBDD',
      muted: '#9A9084',
      line: '#2E2822',
      accent: '#4FB08A',
      myBubble: '#24402F',
      myBubbleText: '#F1EBDD',
      theirBubble: '#1D1914',
      theirBubbleText: '#F1EBDD',
      textOnAccent: '#0D1A14',
      live: '#4FB08A',
      danger: '#E74C3C',
    },
    fonts: {
      heading: 'Fraunces-Bold',
      body: 'Figtree-Regular',
      bodySemiBold: 'Figtree-SemiBold',
    },
    radius: 16,
  },
  'Midnight signal': {
    light: {
      bg: '#F4F2ED',
      surface: '#FFFFFF',
      ink: '#101214',
      muted: '#6B6F75',
      line: '#E3E0D8',
      accent: '#E09F00',
      myBubble: '#E09F00',
      myBubbleText: '#101214',
      theirBubble: '#FFFFFF',
      theirBubbleText: '#101214',
      textOnAccent: '#101214',
      live: '#E09F00',
      danger: '#C0392B',
    },
    dark: {
      bg: '#0B0D10',
      surface: '#14181D',
      ink: '#E9ECEF',
      muted: '#7C8794',
      line: '#232A32',
      accent: '#FFB703',
      myBubble: '#FFB703',
      myBubbleText: '#14100A',
      theirBubble: '#14181D',
      theirBubbleText: '#E9ECEF',
      textOnAccent: '#14100A',
      live: '#FFB703',
      danger: '#E74C3C',
    },
    fonts: {
      heading: 'Syne-ExtraBold',
      body: 'Manrope-Regular',
      bodySemiBold: 'Manrope-SemiBold',
    },
    radius: 10,
  },
  'Coral daylight': {
    light: {
      bg: '#F3F5EF',
      surface: '#FFFFFF',
      ink: '#14213D',
      muted: '#6B7488',
      line: '#DDE2D6',
      accent: '#E4572E',
      myBubble: '#E4572E',
      myBubbleText: '#FFFFFF',
      theirBubble: '#FFFFFF',
      theirBubbleText: '#14213D',
      textOnAccent: '#FFFFFF',
      live: '#10B981',
      danger: '#E4572E',
    },
    dark: {
      bg: '#0F1420',
      surface: '#181F2E',
      ink: '#EEF1F7',
      muted: '#8D97AB',
      line: '#27304A',
      accent: '#FF7A55',
      myBubble: '#FF7A55',
      myBubbleText: '#1A0B06',
      theirBubble: '#181F2E',
      theirBubbleText: '#EEF1F7',
      textOnAccent: '#1A0B06',
      live: '#34D399',
      danger: '#FF7A55',
    },
    fonts: {
      heading: 'Bricolage-ExtraBold',
      body: 'DM-Regular',
      bodySemiBold: 'DM-SemiBold',
    },
    radius: 20,
  },
};

export function useTheme(): ThemeTokens {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const def = THEMES[CHOSEN_THEME];
  const colors = isDark ? def.dark : def.light;

  return {
    name: CHOSEN_THEME,
    colors,
    fonts: def.fonts,
    radius: def.radius,
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    },
  };
}
