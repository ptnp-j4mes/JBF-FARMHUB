/**
 * Theme Token Factory
 * FarmHUB Design System - Expanded token factory importing from granular token files
 */

import type { PaletteMode } from '@mui/material';
import {
  primaryLight,
  primaryDark,
  surfaceLight,
  surfaceDark,
  foregroundLight,
  foregroundDark,
  borderLight,
  borderDark,
  semanticLight,
  semanticDark,
  sidebarLight,
  sidebarDark,
  shadowsLight,
  shadowsDark,
} from '../tokens';

/**
 * ThemeTokens interface - same shape as original for backward compatibility
 */
export interface ThemeTokens {
  background: {
    page: string;
    surface: string;
    surfaceMuted: string;
    surfaceStrong: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  primary: {
    main: string;
    light: string;
    dark: string;
    soft: string;
  };
  success: {
    main: string;
    soft: string;
  };
  warning: {
    main: string;
    soft: string;
  };
  danger: {
    main: string;
    soft: string;
  };
  info: {
    main: string;
    soft: string;
  };
  sidebar: {
    background: string;
    panel: string;
    hover: string;
    active: string;
    divider: string;
    text: string;
    muted: string;
    accent: string;
    accentSoft: string;
  };
  shadow: {
    card: string;
    raised: string;
  };
}

/**
 * Get theme tokens for the given mode
 * Uses the same values as the original tokens.ts for full backward compatibility
 */
export const getThemeTokens = (mode: PaletteMode): ThemeTokens => {
  if (mode === 'dark') {
    return {
      background: surfaceDark,
      text: foregroundDark,
      border: borderDark.default,
      primary: {
        main: primaryDark.main,
        light: primaryDark.light,
        dark: primaryDark.dark,
        soft: primaryDark.soft,
      },
      success: {
        main: semanticDark.success.main,
        soft: semanticDark.success.soft,
      },
      warning: {
        main: semanticDark.warning.main,
        soft: semanticDark.warning.soft,
      },
      danger: {
        main: semanticDark.danger.main,
        soft: semanticDark.danger.soft,
      },
      info: {
        main: semanticDark.info.main,
        soft: semanticDark.info.soft,
      },
      sidebar: sidebarDark,
      shadow: {
        card: shadowsDark.card,
        raised: shadowsDark.raised,
      },
    };
  }

  return {
    background: surfaceLight,
    text: foregroundLight,
    border: borderLight.default,
    primary: {
      main: primaryLight.main,
      light: primaryLight.light,
      dark: primaryLight.dark,
      soft: primaryLight.soft,
    },
    success: {
      main: semanticLight.success.main,
      soft: semanticLight.success.soft,
    },
    warning: {
      main: semanticLight.warning.main,
      soft: semanticLight.warning.soft,
    },
    danger: {
      main: semanticLight.danger.main,
      soft: semanticLight.danger.soft,
    },
    info: {
      main: semanticLight.info.main,
      soft: semanticLight.info.soft,
    },
    sidebar: sidebarLight,
    shadow: {
      card: shadowsLight.card,
      raised: shadowsLight.raised,
    },
  };
};
