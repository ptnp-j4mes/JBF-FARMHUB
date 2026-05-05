/**
 * Color Design Tokens
 * FarmHUB Design System - Full color scale from spec
 */

// ─── Primary Red Scale (50-900) ───────────────────────────────────
export const red = {
  50: '#FEF3F2',
  100: '#FEE4E2',
  200: '#FECDCA',
  300: '#FDA29B',
  400: '#F97066',
  500: '#F04438',
  600: '#D92D20',
  700: '#B42318', // ANCHOR - buttons, active nav, selected rows, focus
  800: '#912018',
  900: '#7A271A',
} as const;

// ─── Primary Action Tokens ────────────────────────────────────────
export const primaryLight = {
  main: '#B42318',
  light: '#D92D20',
  dark: '#912018',
  soft: 'rgba(180, 35, 24, 0.08)',
  alpha04: 'rgba(180, 35, 24, 0.04)',
  alpha08: 'rgba(180, 35, 24, 0.08)',
  alpha12: 'rgba(180, 35, 24, 0.12)',
  alpha16: 'rgba(180, 35, 24, 0.16)',
} as const;

export const primaryDark = {
  main: '#F04438',
  light: '#F97066',
  dark: '#D92D20',
  soft: 'rgba(240, 68, 56, 0.16)',
  alpha04: 'rgba(240, 68, 56, 0.06)',
  alpha08: 'rgba(240, 68, 56, 0.10)',
  alpha12: 'rgba(240, 68, 56, 0.14)',
  alpha16: 'rgba(240, 68, 56, 0.18)',
} as const;

// ─── Surface Colors ───────────────────────────────────────────────
export const surfaceLight = {
  page: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F5',
  surfaceStrong: '#EEEEEE',
} as const;

export const surfaceDark = {
  page: '#0F0F10',
  surface: '#1A1A1B',
  surfaceMuted: '#232325',
  surfaceStrong: '#2A2A2D',
} as const;

// ─── Foreground / Text Colors ─────────────────────────────────────
export const foregroundLight = {
  primary: '#1A1A1A',
  secondary: '#525252',
  muted: '#8A8A8A',
  onPrimary: '#FFFFFF',
} as const;

export const foregroundDark = {
  primary: '#F2F2F2',
  secondary: '#BDBDBD',
  muted: '#8A8A8A',
  onPrimary: '#FFFFFF',
} as const;

// ─── Border Colors ────────────────────────────────────────────────
export const borderLight = {
  default: '#E5E5E5',
  subtle: '#EDEDED',
} as const;

export const borderDark = {
  default: '#2D2D30',
  subtle: '#333336',
} as const;

// ─── Semantic Colors ──────────────────────────────────────────────
export const semanticLight = {
  success: { main: '#1F8A56', soft: 'rgba(31, 138, 86, 0.10)', border: 'rgba(31, 138, 86, 0.28)' },
  warning: { main: '#B98511', soft: 'rgba(185, 133, 17, 0.10)', border: 'rgba(185, 133, 17, 0.28)' },
  danger: { main: '#D92D20', soft: 'rgba(217, 45, 32, 0.10)', border: 'rgba(217, 45, 32, 0.28)' },
  info: { main: '#2D78C5', soft: 'rgba(45, 120, 197, 0.10)', border: 'rgba(45, 120, 197, 0.28)' },
  neutral: { main: '#1A1A1A', soft: 'rgba(20, 20, 20, 0.06)', border: 'rgba(229, 229, 229, 0.9)' },
} as const;

export const semanticDark = {
  success: { main: '#4EAF77', soft: 'rgba(78, 175, 119, 0.16)', border: 'rgba(78, 175, 119, 0.32)' },
  warning: { main: '#E3C15A', soft: 'rgba(227, 193, 90, 0.16)', border: 'rgba(227, 193, 90, 0.32)' },
  danger: { main: '#F97066', soft: 'rgba(249, 112, 102, 0.16)', border: 'rgba(249, 112, 102, 0.32)' },
  info: { main: '#72B4FF', soft: 'rgba(114, 180, 255, 0.16)', border: 'rgba(114, 180, 255, 0.32)' },
  neutral: { main: '#F2F2F2', soft: 'rgba(255, 255, 255, 0.08)', border: 'rgba(255, 255, 255, 0.15)' },
} as const;

// ─── Sidebar Colors ───────────────────────────────────────────────
export const sidebarLight = {
  background: '#FAFAFA',
  panel: '#FFFFFF',
  hover: '#FEF3F2',
  active: '#B42318',
  divider: '#EDEDED',
  text: '#1A1A1A',
  muted: '#6B6B6B',
  accent: '#B42318',
  accentSoft: 'rgba(180, 35, 24, 0.08)',
} as const;

export const sidebarDark = {
  background: '#161617',
  panel: '#1A1A1B',
  hover: 'rgba(255, 255, 255, 0.06)',
  active: '#F04438',
  divider: '#2D2D30',
  text: '#F2F2F2',
  muted: '#BDBDBD',
  accent: '#F04438',
  accentSoft: 'rgba(240, 68, 56, 0.16)',
} as const;
