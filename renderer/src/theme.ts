// Desktop theme — mirrors the mobile app's white/black palette with gold accents
export const palette = {
  bg: '#FFFFFF',
  bgSoft: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFC',
  sidebar: '#FAFAFC',
  cardBorder: 'rgba(0,0,0,0.06)',
  hairline: 'rgba(0,0,0,0.09)',
  ink: '#111111',
  body: '#3A3A3E',
  mutedStrong: '#6C6C70',
  muted: '#98989E',
  gold: '#1C1C1E',
  goldDark: '#6C6C70',
  goldSoft: '#E5E5EA',
  error: '#FF3B30',
  success: '#34C759',
  info: '#0A84FF',
  inputBg: '#EFEFF4',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: '0 6px 14px rgba(0,0,0,0.05)',
  soft: '0 3px 8px rgba(0,0,0,0.04)',
  circle: '0 5px 12px rgba(0,0,0,0.06)',
};

export const fonts = {
  family: "'Inter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export const typography = {
  largeTitle: { fontFamily: fonts.family, fontWeight: 700, fontSize: 30, color: palette.ink, letterSpacing: '-0.3px' },
  title: { fontFamily: fonts.family, fontWeight: 700, fontSize: 22, color: palette.ink, letterSpacing: '-0.2px' },
  subtitle: { fontFamily: fonts.family, fontWeight: 600, fontSize: 17, color: palette.ink, letterSpacing: '-0.2px' },
  body: { fontFamily: fonts.family, fontWeight: 400, fontSize: 15, color: palette.body, lineHeight: '22px' },
  label: { fontFamily: fonts.family, fontWeight: 600, fontSize: 13, color: palette.mutedStrong },
  caption: { fontFamily: fonts.family, fontWeight: 400, fontSize: 12, color: palette.muted, lineHeight: '17px' },
};
