/**
 * Glass Morphism Utilities
 * FarmHUB Design System - Glass panel helpers
 */

import type { PaletteMode, SxProps, Theme } from '@mui/material';

/**
 * Create glass morphism style object for various components
 */
export function createGlassStyle(
  mode: PaletteMode,
  variant: 'sidebar' | 'header' | 'dialog' | 'dropdown' = 'sidebar',
  borderRadius: number = 2,
): SxProps {
  const isDark = mode === 'dark';

  const bgOpacity: Record<string, { light: number; dark: number }> = {
    sidebar: { light: 0.4, dark: 0.84 },
    header: { light: 0.4, dark: 0.84 },
    dialog: { light: 0.95, dark: 0.95 },
    dropdown: { light: 0.95, dark: 0.95 },
  };

  const opacity = isDark
    ? bgOpacity[variant].dark
    : bgOpacity[variant].light;

  const bgBase = isDark ? '17, 26, 21' : '255, 255, 255';
  const border =
    variant === 'dropdown'
      ? isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(220, 232, 223, 0.9)'
      : isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.6)';

  const shadow =
    variant === 'dialog' || variant === 'dropdown'
      ? isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
        : '0 8px 32px rgba(18, 54, 37, 0.10)'
      : isDark
        ? '0 8px 30px rgba(0,0,0,0.32)'
        : '0 8px 30px rgba(0,0,0,0.04)';

  return {
    backgroundColor: `rgba(${bgBase}, ${opacity})`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${border}`,
    boxShadow: shadow,
    borderRadius,
  } as SxProps;
}

/**
 * Create glass panel sx for Box or Paper (simplified inline usage)
 */
export function glassPanelSx(
  mode: PaletteMode,
  borderRadius: number = 2,
): SxProps {
  const isDark = mode === 'dark';
  return {
    backgroundColor: isDark
      ? 'rgba(17, 26, 21, 0.84)'
      : 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${
      isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.6)'
    }`,
    boxShadow: isDark
      ? '0 8px 30px rgba(0,0,0,0.32)'
      : '0 8px 30px rgba(0,0,0,0.04)',
    borderRadius,
  } as SxProps;
}
