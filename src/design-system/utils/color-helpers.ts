/**
 * Color Helper Utilities
 * FarmHUB Design System - Menu gradients, alpha conversions, indicators
 */

import type { SxProps, Theme } from '@mui/material';

/**
 * Convert hex color to rgba string
 * @example withAlpha('#1F8A56', 0.12) // => 'rgba(31, 138, 86, 0.12)'
 */
export function withAlpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Create active menu gradient background
 */
export function activeMenuGradient(isDark: boolean): string {
  return isDark
    ? 'linear-gradient(to right, rgba(240, 68, 56, 0.18), rgba(26, 26, 27, 0.94))'
    : 'linear-gradient(to right, rgba(254, 243, 242, 0.96), rgba(255,255,255,0.9))';
}

/**
 * Create selected sub-menu background
 */
export function selectedSubMenuBackground(isDark: boolean): string {
  return isDark
    ? 'rgba(240, 68, 56, 0.12)'
    : 'rgba(180, 35, 24, 0.08)';
}

/**
 * Create dot indicator style for sub-menu items
 */
export function dotIndicatorSx(
  isActive: boolean,
  isDark: boolean,
): SxProps {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    mr: 1.5,
    flexShrink: 0,
    transition: 'all 200ms ease',
    bgcolor: isActive
      ? isDark ? '#F97066' : '#B42318'
      : isDark ? '#475569' : '#cbd5e1',
    boxShadow: isActive
      ? isDark
        ? '0 0 5px rgba(240,68,56,0.6)'
        : '0 0 5px rgba(180,35,24,0.6)'
      : 'none',
  } as SxProps;
}

/**
 * Create accent gradient line for StatsCard top border
 */
export function statsAccentGradient(
  variant: 'primary' | 'warning' | 'danger' | 'info',
): string {
  const gradients = {
    primary: 'linear-gradient(90deg, #D92D20, #F472B6)',
    warning: 'linear-gradient(90deg, #B98511, #F4C453)',
    danger: 'linear-gradient(90deg, #D92D20, #FCA5A5)',
    info: 'linear-gradient(90deg, #2D78C5, #7DD3FC)',
  };
  return gradients[variant];
}

/**
 * Create vertical gradient tint for card backgrounds
 */
export function cardTintGradient(
  variant: 'primary' | 'warning' | 'danger' | 'info',
  isDark: boolean,
): string {
  const colors = {
    primary: isDark ? 'rgba(240, 68, 56, 0.14)' : 'rgba(180, 35, 24, 0.12)',
    warning: isDark ? 'rgba(227, 193, 90, 0.14)' : 'rgba(185, 133, 17, 0.12)',
    danger: isDark ? 'rgba(249, 112, 102, 0.14)' : 'rgba(217, 45, 32, 0.12)',
    info: isDark ? 'rgba(114, 180, 255, 0.14)' : 'rgba(45, 120, 197, 0.12)',
  };
  return `${colors[variant]}, transparent 60%`;
}
