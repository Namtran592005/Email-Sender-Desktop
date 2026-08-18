// Email Sender Glass — white surfaces with blue, red and green accents.
export const palette = {
  bg: '#FFFFFF',
  bgSoft: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFCFE',
  sidebar: 'rgba(255,255,255,0.82)',
  cardBorder: 'rgba(23,24,27,0.10)',
  hairline: 'rgba(23,24,27,0.14)',
  ink: '#17181B',
  body: '#45474F',
  mutedStrong: '#62656D',
  muted: '#8A8D95',
  gold: '#1A73E8',
  goldDark: '#0B57D0',
  goldSoft: 'rgba(26,115,232,0.10)',
  red: '#EA4335',
  green: '#34A853',
  error: '#EA4335',
  success: '#34A853',
  info: '#1A73E8',
  inputBg: '#F4F6F9',
  editorBg: '#0D1117',
  editorText: '#DCE5F0',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: '0 12px 34px rgba(32, 38, 56, 0.08)',
  soft: '0 3px 12px rgba(32, 38, 56, 0.05)',
  circle: '0 5px 18px rgba(26,115,232,0.16)',
  lift: '0 16px 36px rgba(32, 38, 56, 0.13)',
  modal: '0 24px 64px rgba(32, 38, 56, 0.22), 0 4px 12px rgba(32, 38, 56, 0.08)',
  btn: '0 5px 14px rgba(26,115,232,0.22)',
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
