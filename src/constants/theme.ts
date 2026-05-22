export const Colors = {
  // ── Brand ─────────────────────────────────────────────
  gold: '#F5A623',
  goldLight: '#FFF8EC',
  goldDark: '#D4891A',
  navy: '#1A1A2E',
  navyMid: '#2D3561',
  navyLight: '#EEF1F8',

  // ── Primary mapped to gold for Button ─────────────────
  primary: '#F5A623',
  primaryDark: '#D4891A',
  primaryLight: '#FFF8EC',

  // ── Semantic ───────────────────────────────────────────
  success: '#0E9F6E',
  successLight: '#DEF7EC',
  warning: '#C27803',
  warningLight: '#FDF6B2',
  danger: '#E02424',
  dangerLight: '#FDE8E8',

  // ── Neutrals ───────────────────────────────────────────
  white: '#FFFFFF',
  black: '#111928',
  gray100: '#F9FAFB',
  gray200: '#F3F4F6',
  gray300: '#E5E7EB',
  gray400: '#D1D5DB',
  gray500: '#9CA3AF',
  gray600: '#6B7280',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111928',

  // ── Semantic aliases ───────────────────────────────────
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F2F8',   // tab pill bg, note card bg
  border: '#E5E7EB',
  placeholder: '#AAAAAA',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  textTertiary: '#AAAAAA',

  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  none: 0,
   xs: 2,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const Layout = {
  screenPaddingH: Spacing[4],
  screenPaddingV: Spacing[5],
  cardPadding: Spacing[4],
  inputHeight: 56,       // matches design — tall single input
  buttonHeight: 56,      // matches design — tall CTA button
  headerHeight: 60,
  tabBarHeight: 64,
} as const;