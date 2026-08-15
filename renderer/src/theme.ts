// Desktop theme — white/black palette with gold accents, refined for a polished desktop feel
export const palette = {
  bg: '#FAFAFB',
  bgSoft: '#F2F2F5',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFC',
  sidebar: 'linear-gradient(180deg, #F8F8FA 0%, #EFEFF2 100%)',
  cardBorder: 'rgba(0,0,0,0.055)',
  hairline: 'rgba(0,0,0,0.09)',
  ink: '#111111',
  body: '#3A3A3E',
  mutedStrong: '#6C6C70',
  muted: '#98989E',
  gold: '#1C1C1E',
  goldDark: '#6C6C70',
  goldSoft: 'rgba(28,28,30,0.08)',
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
  card: '0 8px 24px rgba(0,0,0,0.07)',
  soft: '0 3px 8px rgba(0,0,0,0.04)',
  circle: '0 5px 14px rgba(0,0,0,0.08)',
  lift: '0 10px 30px rgba(0,0,0,0.10)',
  modal: '0 24px 64px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08)',
  btn: '0 3px 10px rgba(0,0,0,0.16)',
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

export const transitions = {
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
};
