import { StyleSheet } from 'react-native';
import type { ThemeName } from './types';

export const palette = {
  bg: '#e7dbbf',
  bgDeep: '#d3c39e',
  card: '#fdf8ec',
  card2: '#f5ecd7',
  line: '#e6d9bd',
  ink: '#3a2c1c',
  ink2: '#8a7a5e',
  accent: '#2f8f5b',
  accentDeep: '#26794b',
  gold: '#a8842d',
  goldLight: '#f2c544',
  danger: '#cf4633',
  blue: '#2a7fb8',
  dark: '#241a10',
  dark2: '#15110a',
  parchment: '#f3ead6',
};

export function shellColors(theme: ThemeName): [string, string, string] {
  return theme === 'dungeon'
    ? ['#17150f', '#2a1215', '#0a0a0c']
    : [palette.bg, '#efe3c8', '#d9ead2'];
}

export const ui = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 118, gap: 14 },
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: palette.ink, letterSpacing: -0.3 },
  h1: { fontSize: 28, fontWeight: '900', color: palette.ink, letterSpacing: -0.3 },
  h2: { fontSize: 16, fontWeight: '900', color: palette.ink },
  label: { fontSize: 12, fontWeight: '800', color: palette.ink2 },
  muted: { color: palette.ink2, lineHeight: 20 },
  input: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 13,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    color: palette.ink,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: palette.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryText: { color: '#fff', fontWeight: '900' },
  ghostButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  darkBanner: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: palette.dark,
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    overflow: 'hidden',
  },
});
