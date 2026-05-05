/**
 * Sidemenu Theme Factory
 * FarmHUB Design System - Complete sidemenu theme with glass morphism
 *
 * Moved from src/core/theme/sidemenu-master-theme.ts
 */

import type { PaletteMode, SxProps, Theme } from '@mui/material';
import {
  type SidemenuRadiusScale,
  type SidemenuShadowScale,
  type SidemenuSpacingScale,
  type SidemenuGlassTokens,
  type SidemenuTypography,
  type SidemenuInteractionTokens,
  type SidemenuLayoutTokens,
  type SidemenuMenuStateStyles,
  type SidemenuTransitionPresets,
  type SidemenuMasterTheme,
} from '../types';
import { createGlassStyle, glassPanelSx } from '../utils/glass';
import { activeMenuGradient, selectedSubMenuBackground, dotIndicatorSx } from '../utils/color-helpers';

// Re-export types for backward compatibility
export type {
  SidemenuRadiusScale,
  SidemenuShadowScale,
  SidemenuSpacingScale,
  SidemenuGlassTokens,
  SidemenuTypography,
  SidemenuInteractionTokens,
  SidemenuLayoutTokens,
  SidemenuMenuStateStyles,
  SidemenuTransitionPresets,
  SidemenuMasterTheme,
};

// Re-export utilities for backward compatibility
export { createGlassStyle, glassPanelSx } from '../utils/glass';
export { withAlpha, activeMenuGradient, selectedSubMenuBackground, dotIndicatorSx } from '../utils/color-helpers';

// ---------------------------------------------------------------------------
// Layout Constants
// ---------------------------------------------------------------------------

const SIDEMENU_LAYOUT: SidemenuLayoutTokens = {
  sidebarWidth: 256,
  sidebarCollapsedWidth: 80,
  headerHeight: 80,
  sidebarZIndex: 1200,
  headerZIndex: 1100,
  drawerZIndex: 1300,
  dialogZIndex: 1400,
  tooltipZIndex: 1500,
  mobileBreakpoint: 640,
};

/** Shared spacing tokens for sidemenu layouts */
export const SIDEMENU_SPACING_CONSTANTS = {
  layoutGap: 2,
  layoutPadding: 2,
  menuGap: 0.75,
  subMenuGap: 0.5,
  headerPaddingX: { mobile: 1.25, desktop: 2 },
  headerPaddingY: { mobile: 0, desktop: 0 },
  headerContentGap: { compact: 0.75, regular: 1 },
  contentTopMargin: { collapsed: 0.75, expanded: 1.25 },
  contentHorizontalPadding: { collapsed: 0.75, expanded: 1.5 },
  contentBottomPadding: 1.25,
  groupSpacing: { collapsed: 0.2, expanded: 0.5 },
  groupPaddingX: { collapsed: 0, expanded: 0.1 },
  singleItemSpacing: { collapsed: 0.24, expanded: 0.6 },
  footerPaddingX: { collapsed: 0.1, expanded: 0.75, mobile: 0 },
  footerPaddingBottom: 0.5,
} as const;

/** Shared transition tokens for sidemenu layouts */
export const SIDEMENU_TRANSITION_CONSTANTS = {
  sidebarWidth: 'width 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  menu: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  textFade: 'opacity 300ms ease',
  chevron: 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  accentBar: 'height 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  smooth: 'all 200ms ease',
  glassHover: 'all 200ms ease',
} as const;

// ---------------------------------------------------------------------------
// Master Theme Factory
// ---------------------------------------------------------------------------

export function createSidemenuMasterTheme(mode: PaletteMode): SidemenuMasterTheme {
  const isDark = mode === 'dark';
  const primary = isDark ? '#F04438' : '#B42318';
  const primaryDarkVal = isDark ? '#D92D20' : '#912018';
  const primaryLightVal = isDark ? '#F97066' : '#D92D20';

  const radius: SidemenuRadiusScale = { xs: 1, sm: 1.5, md: 2, lg: 2.5, xl: 3, pill: 999 };
  const shadow: SidemenuShadowScale = {
    tiny: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.04)',
    soft: '0 4px 15px -3px rgba(180,35,24,0.15)',
    card: isDark ? '0 10px 24px rgba(0,0,0,0.24)' : '0 10px 26px rgba(18,54,37,0.06)',
    raised: isDark ? '0 16px 40px rgba(0,0,0,0.34)' : '0 18px 44px rgba(18,54,37,0.10)',
    glass: isDark ? '0 8px 30px rgba(0,0,0,0.32)' : '0 8px 30px rgba(0,0,0,0.04)',
    accent: isDark ? '0 8px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.16)' : '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(18,54,37,0.04)',
  };
  const spacing: SidemenuSpacingScale = { layoutGap: 2, layoutPadding: 2, menuGap: 0.75, subMenuGap: 0.5 };

  const glass: SidemenuGlassTokens = {
    sidebar: createGlassStyle(mode, 'sidebar', radius.md),
    header: createGlassStyle(mode, 'header', radius.md),
    dialog: createGlassStyle(mode, 'dialog', radius.md),
    dropdown: createGlassStyle(mode, 'dropdown', radius.md),
    raw: {
      backgroundColor: isDark ? 'rgba(17,26,21,0.84)' : 'rgba(255,255,255,0.4)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'}`,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
      boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.32)' : '0 8px 30px rgba(0,0,0,0.04)',
    },
  };

  const typography: SidemenuTypography = {
    appName: { fontSize: '1rem', fontWeight: 700, color: primary, lineHeight: 1 },
    groupName: { fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.25 },
    menuLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.25 },
    subMenuLabel: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.25 },
    caption: { fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.15, color: isDark ? '#BDBDBD' : '#6B6B6B' },
    tooltip: { fontSize: '0.8125rem', fontWeight: 500 },
  };

  const interaction: SidemenuInteractionTokens = {
    hover: { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,35,24,0.08)', color: isDark ? primaryLightVal : primaryDarkVal },
    active: { background: activeMenuGradient(isDark), color: isDark ? primaryLightVal : primaryDarkVal, borderColor: isDark ? 'rgba(240,68,56,0.4)' : 'rgba(180,35,24,0.18)', boxShadow: shadow.soft },
    selected: { background: activeMenuGradient(isDark), color: isDark ? primaryLightVal : primaryDarkVal, borderColor: isDark ? 'rgba(240,68,56,0.4)' : 'rgba(180,35,24,0.18)', boxShadow: shadow.soft },
    focus: { outline: isDark ? '3px solid rgba(240,68,56,0.32)' : '3px solid rgba(180,35,24,0.22)', outlineOffset: 2 },
    disabled: { opacity: 1 },
  };

  const menu: SidemenuMenuStateStyles = {
    group: {
      default: { borderRadius: radius.md, px: 2, py: 1.5, minHeight: 64, width: '100%', background: 'transparent', color: 'text.secondary', border: '1px solid transparent', boxShadow: 'none', transition: 'all 400ms cubic-bezier(0.2,0.8,0.2,1)', cursor: 'pointer' } as SxProps,
      hover: { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,35,24,0.08)', color: isDark ? primaryLightVal : primaryDarkVal } as SxProps,
      active: { background: activeMenuGradient(isDark), color: isDark ? primaryLightVal : primaryDarkVal, borderColor: isDark ? 'rgba(240,68,56,0.4)' : 'rgba(180,35,24,0.18)', boxShadow: shadow.soft } as SxProps,
      collapsed: { px: 1, py: 1, justifyContent: 'center', background: isDark ? 'rgba(17,26,21,0.82)' : 'rgba(255,255,255,0.76)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(220,232,223,0.92)', cursor: 'default' } as SxProps,
      accentBar: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 6, height: 32, bgcolor: 'primary.main', borderTopRightRadius: 4, borderBottomRightRadius: 4, boxShadow: isDark ? '0 0 8px rgba(240,68,56,0.6)' : '0 0 8px rgba(180,35,24,0.6)', transition: 'height 400ms cubic-bezier(0.2,0.8,0.2,1)' } as SxProps,
    },
    subMenu: {
      default: { borderRadius: radius.lg, py: 1, px: 2, mb: 0.5, minHeight: 44, width: '100%', background: 'transparent', border: '1px solid transparent', transition: 'all 300ms cubic-bezier(0.2,0.8,0.2,1)' } as SxProps,
      hover: { background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(180,35,24,0.06)', color: 'primary.main' } as SxProps,
      active: { background: selectedSubMenuBackground(isDark), color: isDark ? primaryLightVal : primaryDarkVal, borderColor: isDark ? 'rgba(240,68,56,0.3)' : 'rgba(180,35,24,0.14)' } as SxProps,
      dotIndicator: { active: dotIndicatorSx(true, isDark), inactive: dotIndicatorSx(false, isDark) },
    },
    dashboard: {
      default: { borderRadius: radius.md, minHeight: 64, width: '100%', px: 1.5, py: 1.25, justifyContent: 'flex-start', alignItems: 'center', gap: 1.2, transition: 'all 400ms cubic-bezier(0.2,0.8,0.2,1)' } as SxProps,
      hover: { borderColor: isDark ? 'rgba(240,68,56,0.3)' : 'rgba(180,35,24,0.18)', boxShadow: shadow.tiny } as SxProps,
      active: { background: activeMenuGradient(isDark), borderColor: isDark ? 'rgba(240,68,56,0.4)' : 'rgba(180,35,24,0.18)', boxShadow: shadow.soft } as SxProps,
    },
  };

  const transitions: SidemenuTransitionPresets = {
    sidebarWidth: 'width 400ms cubic-bezier(0.2,0.8,0.2,1)',
    menu: 'all 400ms cubic-bezier(0.2,0.8,0.2,1)',
    textFade: 'opacity 300ms ease',
    chevron: 'transform 300ms cubic-bezier(0.2,0.8,0.2,1)',
    accentBar: 'height 400ms cubic-bezier(0.2,0.8,0.2,1)',
    smooth: 'all 200ms ease',
    glassHover: 'all 200ms ease',
  };

  const colors = {
    background: { page: isDark ? '#0F0F10' : '#FAFAFA', surface: isDark ? '#121D17' : '#FFFFFF', surfaceMuted: isDark ? '#232325' : '#F5F5F5', surfaceStrong: isDark ? '#2A2A2D' : '#EEEEEE' },
    text: { primary: isDark ? '#F2F2F2' : '#1A1A1A', secondary: isDark ? '#BDBDBD' : '#525252', muted: isDark ? '#8A8A8A' : '#8A8A8A' },
    border: isDark ? '#2D2D30' : '#E5E5E5',
    primary: { main: primary, light: primaryLightVal, dark: primaryDarkVal, soft: isDark ? 'rgba(240,68,56,0.16)' : 'rgba(180,35,24,0.12)' },
    success: { main: isDark ? '#4EAF77' : '#1F8A56', soft: isDark ? 'rgba(78,175,119,0.16)' : 'rgba(31,138,86,0.12)' },
    warning: { main: isDark ? '#E3C15A' : '#B98511', soft: isDark ? 'rgba(227,193,90,0.14)' : 'rgba(185,133,17,0.12)' },
    danger: { main: isDark ? '#F97066' : '#D92D20', soft: isDark ? 'rgba(249,112,102,0.14)' : 'rgba(217,45,32,0.12)' },
    info: { main: isDark ? '#72B4FF' : '#2D78C5', soft: isDark ? 'rgba(114,180,255,0.14)' : 'rgba(45,120,197,0.12)' },
    accent: primary,
    accentSoft: isDark ? 'rgba(240,68,56,0.16)' : 'rgba(180,35,24,0.10)',
    accentRing: isDark ? 'rgba(240,68,56,0.18)' : 'rgba(180,35,24,0.18)',
  };

  return { mode, isDark, layout: SIDEMENU_LAYOUT, radius, shadow, spacing, glass, typography, interaction, menu, transitions, colors };
}

// ---------------------------------------------------------------------------
// MUI Component Overrides
// ---------------------------------------------------------------------------

export function sidemenuComponentOverrides(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const tokens = createSidemenuMasterTheme(mode);

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { scrollbarGutter: 'stable' },
        body: { scrollbarGutter: 'stable', overflowY: 'scroll', background: isDark ? `radial-gradient(circle at top, rgba(240,68,56,0.10), transparent 42%), ${tokens.colors.background.page}` : `linear-gradient(180deg, ${tokens.colors.background.page} 0%, #ffffff 100%)`, color: tokens.colors.text.primary },
        '*::selection': { backgroundColor: isDark ? 'rgba(240,68,56,0.28)' : 'rgba(180,35,24,0.18)' },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', borderRadius: tokens.radius.md, boxShadow: tokens.shadow.card } } },
    MuiCard: { styleOverrides: { root: { borderRadius: tokens.radius.md, boxShadow: tokens.shadow.card, transition: tokens.transitions.smooth } } },
    MuiButton: { styleOverrides: { root: { borderRadius: tokens.radius.sm, textTransform: 'none' as const, fontWeight: 700, boxShadow: 'none' }, contained: { '&:hover': { boxShadow: tokens.shadow.tiny } } } },
    MuiButtonBase: { styleOverrides: { root: { '&.Mui-focusVisible': tokens.interaction.focus } } },
    MuiListItemButton: { styleOverrides: { root: { transition: tokens.transitions.menu, '&.Mui-selected': { background: tokens.menu.group.active.background, color: tokens.menu.group.active.color } } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: tokens.radius.sm, transition: tokens.transitions.smooth } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: isDark ? tokens.colors.background.surfaceStrong : tokens.colors.text.primary, color: isDark ? tokens.colors.text.primary : '#ffffff', borderRadius: tokens.radius.sm, boxShadow: tokens.shadow.card, fontSize: tokens.typography.tooltip.fontSize, fontWeight: tokens.typography.tooltip.fontWeight } } },
    MuiDivider: { styleOverrides: { root: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(220,232,223,0.5)' } } },
    MuiDialog: { defaultProps: { disableScrollLock: true }, styleOverrides: { paper: { ...tokens.glass.dialog, overflow: 'hidden' } } },
    MuiDialogContent: { styleOverrides: { root: { '.MuiDialogTitle-root + &': { paddingTop: 20 } } } },
    MuiDialogActions: { styleOverrides: { root: { borderTop: `1px solid ${tokens.colors.border}`, padding: '16px 20px 20px' } } },
    MuiChip: { styleOverrides: { root: { borderRadius: tokens.radius.pill, fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { backgroundColor: isDark ? tokens.colors.background.surfaceMuted : tokens.colors.background.surface, borderRadius: tokens.radius.sm, transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease' } } },
    MuiMenu: { defaultProps: { disableScrollLock: true } },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
  };
}

// ---------------------------------------------------------------------------
// Layout Constants (re-export)
// ---------------------------------------------------------------------------

export const SIDEMENU_LAYOUT_CONSTANTS = SIDEMENU_LAYOUT;

// ---------------------------------------------------------------------------
// MUI Theme Factory (convenience wrapper)
// ---------------------------------------------------------------------------

export function createSidemenuTheme(mode: PaletteMode) {
  const { createTheme } = require('@mui/material');
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? '#F04438' : '#B42318', light: mode === 'dark' ? '#F97066' : '#D92D20', dark: mode === 'dark' ? '#D92D20' : '#912018' },
      success: { main: mode === 'dark' ? '#4EAF77' : '#1F8A56' },
      warning: { main: mode === 'dark' ? '#E3C15A' : '#B98511' },
      info: { main: mode === 'dark' ? '#72B4FF' : '#2D78C5' },
      error: { main: mode === 'dark' ? '#F97066' : '#D92D20' },
      background: { default: mode === 'dark' ? '#0F0F10' : '#FAFAFA', paper: mode === 'dark' ? '#121D17' : '#FFFFFF' },
      text: { primary: mode === 'dark' ? '#F2F2F2' : '#1A1A1A', secondary: mode === 'dark' ? '#BDBDBD' : '#525252' },
      divider: mode === 'dark' ? '#2D2D30' : '#E5E5E5',
      action: { hover: mode === 'dark' ? 'rgba(240,68,56,0.10)' : 'rgba(180,35,24,0.08)', selected: mode === 'dark' ? 'rgba(240,68,56,0.16)' : 'rgba(180,35,24,0.12)' },
    },
    shape: { borderRadius: 8 },
    typography: { fontFamily: 'var(--font-bai-jamjuree), "Bai Jamjuree", "Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif', h5: { fontWeight: 700, letterSpacing: '-0.02em' }, h6: { fontWeight: 700, letterSpacing: '-0.01em' }, button: { textTransform: 'none', fontWeight: 600 } },
    components: sidemenuComponentOverrides(mode),
  });
}
