/**
 * Design System Type Definitions
 * FarmHUB Design System - Extracted from sidemenu-master-theme.ts
 */

import type { SxProps, Theme } from '@mui/material';

/** Border-radius scale for sidebar and related components */
export interface SidemenuRadiusScale {
  xs: number;   // 8px
  sm: number;   // 12px
  md: number;   // 16px
  lg: number;   // 20px
  xl: number;   // 24px
  pill: number; // 999px
}

/** Shadow scale */
export interface SidemenuShadowScale {
  tiny: string;
  soft: string;
  card: string;
  raised: string;
  glass: string;
  accent: string;
}

/** Spacing scale for sidebar */
export interface SidemenuSpacingScale {
  layoutGap: number;
  layoutPadding: number;
  menuGap: number;
  subMenuGap: number;
}

/** Glass morphism tokens */
export interface SidemenuGlassTokens {
  sidebar: SxProps;
  header: SxProps;
  dialog: SxProps;
  dropdown: SxProps;
  raw: {
    backgroundColor: string;
    backdropFilter: string;
    border: string;
    borderColor: string;
    boxShadow: string;
  };
}

/** Typography tokens for sidebar */
export interface SidemenuTypography {
  appName: { fontSize: string; fontWeight: number; color: string; lineHeight: number };
  groupName: { fontSize: string; fontWeight: number; lineHeight: number };
  menuLabel: { fontSize: string; fontWeight: number; lineHeight: number };
  subMenuLabel: { fontSize: string; fontWeight: number; lineHeight: number };
  caption: { fontSize: string; fontWeight: number; lineHeight: number; color: string };
  tooltip: { fontSize: string; fontWeight: number };
}

/** Interaction state tokens for menu */
export interface SidemenuInteractionTokens {
  hover: { background: string; color: string; borderColor?: string; boxShadow?: string; transform?: string };
  active: { background: string; color: string; borderColor: string; boxShadow: string };
  selected: { background: string; color: string; borderColor: string; boxShadow: string };
  focus: { outline: string; outlineOffset: number };
  disabled: { opacity: number };
}

/** Layout dimension constants */
export interface SidemenuLayoutTokens {
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  headerHeight: number;
  sidebarZIndex: number;
  headerZIndex: number;
  drawerZIndex: number;
  dialogZIndex: number;
  tooltipZIndex: number;
  mobileBreakpoint: number;
}

/** Menu state styles for each level */
export interface SidemenuMenuStateStyles {
  group: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
    collapsed: SxProps;
    accentBar: SxProps;
  };
  subMenu: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
    dotIndicator: { active: SxProps; inactive: SxProps };
  };
  dashboard: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
  };
}

/** Transition presets */
export interface SidemenuTransitionPresets {
  sidebarWidth: string;
  menu: string;
  textFade: string;
  chevron: string;
  accentBar: string;
  smooth: string;
  glassHover: string;
}

/** Complete sidemenu master theme */
export interface SidemenuMasterTheme {
  mode: 'light' | 'dark';
  isDark: boolean;
  layout: SidemenuLayoutTokens;
  radius: SidemenuRadiusScale;
  shadow: SidemenuShadowScale;
  spacing: SidemenuSpacingScale;
  glass: SidemenuGlassTokens;
  typography: SidemenuTypography;
  interaction: SidemenuInteractionTokens;
  menu: SidemenuMenuStateStyles;
  transitions: SidemenuTransitionPresets;
  colors: {
    background: { page: string; surface: string; surfaceMuted: string; surfaceStrong: string };
    text: { primary: string; secondary: string; muted: string };
    border: string;
    primary: { main: string; light: string; dark: string; soft: string };
    success: { main: string; soft: string };
    warning: { main: string; soft: string };
    danger: { main: string; soft: string };
    info: { main: string; soft: string };
    accent: string;
    accentSoft: string;
    accentRing: string;
  };
}

/** Theme mode type */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** Component size variants */
export type ComponentSize = 'small' | 'medium' | 'large';

/** Status badge types */
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

/** Trend direction for stats cards */
export type TrendDirection = 'up' | 'down' | 'neutral';
