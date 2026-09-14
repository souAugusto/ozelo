/**
 * Design tokens for Ozelo. The app has a single, fixed dark visual identity —
 * there is no light theme to switch to.
 */
import { Platform, TextStyle } from 'react-native';

export const Colors = {
  background: '#0F0F14',
  card: '#1E1E27',
  cardBorder: '#33333F',
  cardElevated: '#2A2A38',

  gradientStart: '#7C4DFF',
  gradientEnd: '#00E5C7',

  accentCoral: '#FF3D9A',
  accentAmber: '#FAC775',
  accentMint: '#7CF5D0',

  textPrimary: '#F5F3FA',
  textSecondary: '#8A8792',
  textMuted: '#5F5E5A',
  textOnGradient: '#FFFFFF',

  buttonSecondaryText: '#C9C7D1',
} as const;

export const Gradient = {
  colors: [Colors.gradientStart, Colors.gradientEnd] as const,
  // 135deg expressed as normalized start/end points for expo-linear-gradient.
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderWidth = {
  hairline: 0.5,
  selected: 1.5,
};

const fontFamily = Platform.select({
  ios: { serif: 'Georgia' },
  android: { serif: 'serif' },
  default: { serif: 'Georgia, serif' },
});

export const Typography: Record<string, TextStyle> = {
  display: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: fontFamily?.serif,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};

export const IconSize = {
  sm: 16,
  md: 20,
  lg: 22,
};
