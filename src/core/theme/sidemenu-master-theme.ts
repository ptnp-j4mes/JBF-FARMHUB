/**
 * FarmHUB Sidemenu Master Theme
 *
 * Single source of truth สำหรับทุก skill frontend ที่ใช้ sidemenu layout.
 * Import ไปใช้ได้ทันทีโดยไม่ต้องปรับแต่งค่า theme พื้นฐาน
 *
 * @example
 * ```tsx
 * import { createSidemenuMasterTheme } from '@/core/theme/sidemenu-master-theme';
 *
 * const theme = createSidemenuMasterTheme('light');
 * // หรือใช้กับ MUI ThemeProvider
 * const darkTheme = createSidemenuMasterTheme('dark');
 * ```
 */

import type { PaletteMode, SxProps, Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

// ---------------------------------------------------------------------------
// 1. TypeScript Types
// ---------------------------------------------------------------------------

/** Border-radius scale สำหรับ sidebar และ component ที่เกี่ยวข้อง */
export interface SidemenuRadiusScale {
  /** 8px – sub-menu items, icon containers */
  xs: number;
  /** 12px – buttons, inputs, chips */
  sm: number;
  /** 16px – glass panels (sidebar, header), cards */
  md: number;
  /** 20px – group menu buttons */
  lg: number;
  /** 24px – accent elements, decorative */
  xl: number;
  /** 999px – pill shape (chips, badges) */
  pill: number;
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

/** Spacing scale สำหรับ sidebar */
export interface SidemenuSpacingScale {
  /** Gap ระหว่าง sidebar และ main content */
  layoutGap: number;
  /** Padding รอบ layout root */
  layoutPadding: number;
  /** Gap ระหว่าง menu items */
  menuGap: number;
  /** Gap ระหว่าง sub-menu items */
  subMenuGap: number;
}

/** Glass morphism tokens */
export interface SidemenuGlassTokens {
  sidebar: SxProps;
  header: SxProps;
  dialog: SxProps;
  dropdown: SxProps;
  /** Raw values สำหรับ custom usage */
  raw: {
    backgroundColor: string;
    backdropFilter: string;
    border: string;
    borderColor: string;
    boxShadow: string;
  };
}

/** Typography tokens สำหรับ sidebar */
export interface SidemenuTypography {
  appName: {
    fontSize: string;
    fontWeight: number;
    color: string;
    lineHeight: number;
  };
  groupName: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  menuLabel: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  subMenuLabel: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
  };
  caption: {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    color: string;
  };
  tooltip: {
    fontSize: string;
    fontWeight: number;
  };
}

/** Interaction state tokens สำหรับเมนู */
export interface SidemenuInteractionTokens {
  hover: {
    background: string;
    color: string;
    borderColor?: string;
    boxShadow?: string;
    transform?: string;
  };
  active: {
    background: string;
    color: string;
    borderColor: string;
    boxShadow: string;
  };
  selected: {
    background: string;
    color: string;
    borderColor: string;
    boxShadow: string;
  };
  focus: {
    outline: string;
    outlineOffset: number;
  };
  disabled: {
    opacity: number;
  };
}

/** Layout dimension constants */
export interface SidemenuLayoutTokens {
  /** Sidebar expanded width (px) */
  sidebarWidth: number;
  /** Sidebar collapsed width (px) */
  sidebarCollapsedWidth: number;
  /** Header/topbar height (px) */
  headerHeight: number;
  /** Sidebar z-index */
  sidebarZIndex: number;
  /** Header z-index (when fixed) */
  headerZIndex: number;
  /** Drawer overlay z-index (mobile) */
  drawerZIndex: number;
  /** Dialog z-index */
  dialogZIndex: number;
  /** Tooltip z-index */
  tooltipZIndex: number;
  /** Mobile breakpoint */
  mobileBreakpoint: number;
}

/** Menu state styles สำหรับแต่ละ level */
export interface SidemenuMenuStateStyles {
  /** Level 1 – group buttons (e.g. "การผลิต", "รายงาน") */
  group: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
    collapsed: SxProps;
    accentBar: SxProps;
  };
  /** Level 2 – sub-menu items */
  subMenu: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
    dotIndicator: {
      active: SxProps;
      inactive: SxProps;
    };
  };
  /** Dashboard button */
  dashboard: {
    default: SxProps;
    hover: SxProps;
    active: SxProps;
  };
}

/** Transition presets */
export interface SidemenuTransitionPresets {
  /** Sidebar width expand/collapse */
  sidebarWidth: string;
  /** Menu item hover/active */
  menu: string;
  /** Text fade in/out */
  textFade: string;
  /** Chevron rotation */
  chevron: string;
  /** Accent bar height */
  accentBar: string;
  /** Default smooth */
  smooth: string;
  /** Glass panel hover */
  glassHover: string;
}

/** Complete master theme */
export interface SidemenuMasterTheme {
  mode: PaletteMode;
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
  /** Raw color tokens สำหรับ custom usage */
  colors: {
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
    success: { main: string; soft: string };
    warning: { main: string; soft: string };
    danger: { main: string; soft: string };
    info: { main: string; soft: string };
    accent: string;
    accentSoft: string;
    accentRing: string;
  };
}

// ---------------------------------------------------------------------------
// 2. Layout Constants
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
  headerPaddingX: {
    mobile: 1.25,
    desktop: 2,
  },
  headerPaddingY: {
    mobile: 0,
    desktop: 0,
  },
  headerContentGap: {
    compact: 0.75,
    regular: 1,
  },
  contentTopMargin: {
    collapsed: 0.75,
    expanded: 1.25,
  },
  contentHorizontalPadding: {
    collapsed: 0.75,
    expanded: 1.5,
  },
  contentBottomPadding: 1.25,
  groupSpacing: {
    collapsed: 0.2,
    expanded: 0.5,
  },
  groupPaddingX: {
    collapsed: 0,
    expanded: 0.1,
  },
  singleItemSpacing: {
    collapsed: 0.24,
    expanded: 0.6,
  },
  footerPaddingX: {
    collapsed: 0.1,
    expanded: 0.75,   // align profile card content with header logo (2 - 1.25 = 0.75)
    mobile: 0,         // align with headerPaddingX.mobile (1.25 - 1.25 = 0)
  },
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
// 3. Helper Utilities
// ---------------------------------------------------------------------------

/**
 * สร้าง glass morphism style object สำหรับ component ต่างๆ
 *
 * @param mode - 'light' หรือ 'dark'
 * @param variant - 'sidebar' | 'header' | 'dialog' | 'dropdown'
 * @param borderRadius - border-radius value (default: 2 = 16px)
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
 * สร้าง alpha color string จาก hex color
 *
 * @example
 * ```ts
 * withAlpha('#1F8A56', 0.12) // => 'rgba(31, 138, 86, 0.12)'
 * ```
 */
export function withAlpha(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * สร้าง glass panel sx สำหรับใช้กับ `<Box>` หรือ `<Paper>`
 * สะดวกกว่า `createGlassStyle` สำหรับ inline usage
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

/**
 * สร้าง active menu gradient background
 */
export function activeMenuGradient(isDark: boolean): string {
  return isDark
    ? 'linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(17, 26, 21, 0.92))'
    : 'linear-gradient(to right, #ecfdf5, rgba(255,255,255,0.9))';
}

/**
 * สร้าง selected sub-menu background
 */
export function selectedSubMenuBackground(isDark: boolean): string {
  return isDark
    ? 'rgba(116, 211, 156, 0.12)'
    : 'rgba(16, 185, 129, 0.1)';
}

/**
 * สร้าง dot indicator style สำหรับ sub-menu items
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
      ? isDark ? '#74D39C' : '#10b981'
      : isDark ? '#475569' : '#cbd5e1',
    boxShadow: isActive
      ? isDark
        ? '0 0 5px rgba(116,211,156,0.6)'
        : '0 0 5px rgba(16,185,129,0.6)'
      : 'none',
  } as SxProps;
}

// ---------------------------------------------------------------------------
// 4. Master Theme Factory
// ---------------------------------------------------------------------------

/**
 * สร้าง master theme สำหรับ sidemenu layout
 *
 * @param mode - 'light' | 'dark' | 'auto' (auto จะ return light theme เสมอ,
 *               ใช้ ThemeContext สำหรับ auto detection ที่ runtime)
 */
export function createSidemenuMasterTheme(
  mode: PaletteMode,
): SidemenuMasterTheme {
  const isDark = mode === 'dark';
  const primary = isDark ? '#74D39C' : '#1F8A56';
  const primaryDark = isDark ? '#42A96D' : '#146642';
  const primaryLight = isDark ? '#A4E8BE' : '#4EAF77';

  // -- Radius scale --
  const radius: SidemenuRadiusScale = {
    xs: 1,      // 8px
    sm: 1.5,    // 12px
    md: 2,      // 16px
    lg: 2.5,    // 20px
    xl: 3,      // 24px
    pill: 999,
  };

  // -- Shadow scale --
  const shadow: SidemenuShadowScale = {
    tiny: isDark
      ? '0 4px 12px rgba(0,0,0,0.2)'
      : '0 4px 12px rgba(0,0,0,0.04)',
    soft: '0 4px 15px -3px rgba(16,185,129,0.15)',
    card: isDark
      ? '0 10px 24px rgba(0, 0, 0, 0.24)'
      : '0 10px 26px rgba(18, 54, 37, 0.06)',
    raised: isDark
      ? '0 16px 40px rgba(0, 0, 0, 0.34)'
      : '0 18px 44px rgba(18, 54, 37, 0.10)',
    glass: isDark
      ? '0 8px 30px rgba(0,0,0,0.32)'
      : '0 8px 30px rgba(0,0,0,0.04)',
    accent: isDark
      ? '0 8px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.16)'
      : '0 8px 30px rgba(0,0,0,0.04), 0 2px 8px rgba(18, 54, 37, 0.04)',
  };

  // -- Spacing scale --
  const spacing: SidemenuSpacingScale = {
    layoutGap: 2,       // 16px
    layoutPadding: 2,   // 16px
    menuGap: 0.75,      // 6px
    subMenuGap: 0.5,    // 4px
  };

  // -- Glass tokens --
  const glass: SidemenuGlassTokens = {
    sidebar: createGlassStyle(mode, 'sidebar', radius.md),
    header: createGlassStyle(mode, 'header', radius.md),
    dialog: createGlassStyle(mode, 'dialog', radius.md),
    dropdown: createGlassStyle(mode, 'dropdown', radius.md),
    raw: {
      backgroundColor: isDark
        ? 'rgba(17, 26, 21, 0.84)'
        : 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${
        isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(255, 255, 255, 0.6)'
      }`,
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.6)',
      boxShadow: isDark
        ? '0 8px 30px rgba(0,0,0,0.32)'
        : '0 8px 30px rgba(0,0,0,0.04)',
    },
  };

  // -- Typography --
  const typography: SidemenuTypography = {
    appName: {
      fontSize: '1rem',
      fontWeight: 700,
      color: primary,
      lineHeight: 1,
    },
    groupName: {
      fontSize: '0.88rem',
      fontWeight: 600,
      lineHeight: 1.25,
    },
    menuLabel: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.25,
    },
    subMenuLabel: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.25,
    },
    caption: {
      fontSize: '0.72rem',
      fontWeight: 500,
      lineHeight: 1.15,
      color: isDark ? '#8DA399' : '#64748b',
    },
    tooltip: {
      fontSize: '0.8125rem',
      fontWeight: 500,
    },
  };

  // -- Interaction states --
  const interaction: SidemenuInteractionTokens = {
    hover: {
      background: isDark
        ? 'rgba(116, 211, 156, 0.08)'
        : 'rgba(255,255,255,0.5)',
      color: isDark ? primaryLight : primaryDark,
    },
    active: {
      background: activeMenuGradient(isDark),
      color: isDark ? primaryLight : primaryDark,
      borderColor: isDark
        ? 'rgba(116, 211, 156, 0.4)'
        : 'rgba(167, 243, 208, 0.6)',
      boxShadow: shadow.soft,
    },
    selected: {
      background: activeMenuGradient(isDark),
      color: isDark ? primaryLight : primaryDark,
      borderColor: isDark
        ? 'rgba(116, 211, 156, 0.4)'
        : 'rgba(167, 243, 208, 0.6)',
      boxShadow: shadow.soft,
    },
    focus: {
      outline: isDark
        ? '3px solid rgba(116, 211, 156, 0.32)'
        : '3px solid rgba(31, 138, 86, 0.22)',
      outlineOffset: 2,
    },
    disabled: {
      opacity: 1,
    },
  };

  // -- Menu state styles --
  const menu: SidemenuMenuStateStyles = {
    group: {
      default: {
        borderRadius: radius.md,
        px: 2,
        py: 1.5,
        minHeight: 64,
        width: '100%',
        background: 'transparent',
        color: 'text.secondary',
        border: '1px solid transparent',
        boxShadow: 'none',
        transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: 'pointer',
      } as SxProps,
      hover: {
        background: isDark
          ? 'rgba(116, 211, 156, 0.08)'
          : 'rgba(255,255,255,0.5)',
        color: isDark ? primaryLight : primaryDark,
      } as SxProps,
      active: {
        background: activeMenuGradient(isDark),
        color: isDark ? primaryLight : primaryDark,
        borderColor: isDark
          ? 'rgba(116, 211, 156, 0.4)'
          : 'rgba(167, 243, 208, 0.6)',
        boxShadow: shadow.soft,
      } as SxProps,
      collapsed: {
        px: 1,
        py: 1,
        justifyContent: 'center',
        background: isDark
          ? 'rgba(17, 26, 21, 0.82)'
          : 'rgba(255, 255, 255, 0.76)',
        borderColor: isDark
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(220, 232, 223, 0.92)',
        cursor: 'default',
      } as SxProps,
      accentBar: {
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 6,
        height: 32,
        bgcolor: 'primary.main',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
        boxShadow: isDark
          ? '0 0 8px rgba(116,211,156,0.6)'
          : '0 0 8px rgba(16,185,129,0.6)',
        transition: 'height 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      } as SxProps,
    },
    subMenu: {
      default: {
        borderRadius: radius.lg,
        py: 1,
        px: 2,
        mb: 0.5,
        minHeight: 44,
        width: '100%',
        background: 'transparent',
        border: '1px solid transparent',
        transition: 'all 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      } as SxProps,
      hover: {
        background: isDark
          ? 'rgba(116, 211, 156, 0.08)'
          : 'rgba(255,255,255,0.4)',
        color: 'primary.main',
      } as SxProps,
      active: {
        background: selectedSubMenuBackground(isDark),
        color: isDark ? primaryLight : primaryDark,
        borderColor: isDark
          ? 'rgba(116, 211, 156, 0.3)'
          : 'rgba(167, 243, 208, 0.5)',
      } as SxProps,
      dotIndicator: {
        active: dotIndicatorSx(true, isDark),
        inactive: dotIndicatorSx(false, isDark),
      },
    },
    dashboard: {
      default: {
        borderRadius: radius.md,
        minHeight: 64,
        width: '100%',
        px: 1.5,
        py: 1.25,
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 1.2,
        transition: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      } as SxProps,
      hover: {
        borderColor: isDark
          ? 'rgba(116, 211, 156, 0.3)'
          : 'rgba(16, 185, 129, 0.18)',
        boxShadow: shadow.tiny,
      } as SxProps,
      active: {
        background: activeMenuGradient(isDark),
        borderColor: isDark
          ? 'rgba(116, 211, 156, 0.4)'
          : 'rgba(209, 250, 229, 0.82)',
        boxShadow: shadow.soft,
      } as SxProps,
    },
  };

  // -- Transition presets --
  const transitions: SidemenuTransitionPresets = {
    sidebarWidth: 'width 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    menu: 'all 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    textFade: 'opacity 300ms ease',
    chevron: 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    accentBar: 'height 400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    smooth: 'all 200ms ease',
    glassHover: 'all 200ms ease',
  };

  // -- Raw color tokens --
  const colors = {
    background: {
      page: isDark ? '#0C1410' : '#F4FAF6',
      surface: isDark ? '#121D17' : '#FFFFFF',
      surfaceMuted: isDark ? '#18261F' : '#F1F7F3',
      surfaceStrong: isDark ? '#1E2D25' : '#E8F2EC',
    },
    text: {
      primary: isDark ? '#EAF3EE' : '#173127',
      secondary: isDark ? '#B6C8BE' : '#587066',
      muted: isDark ? '#8DA399' : '#819589',
    },
    border: isDark ? '#23362C' : '#D4E1D8',
    primary: {
      main: primary,
      light: primaryLight,
      dark: primaryDark,
      soft: isDark
        ? 'rgba(116, 211, 156, 0.16)'
        : 'rgba(31, 138, 86, 0.12)',
    },
    success: {
      main: isDark ? '#6AD28D' : '#2E9D5A',
      soft: isDark
        ? 'rgba(106, 210, 141, 0.16)'
        : 'rgba(46, 157, 90, 0.12)',
    },
    warning: {
      main: isDark ? '#E3C15A' : '#B98511',
      soft: isDark
        ? 'rgba(227, 193, 90, 0.14)'
        : 'rgba(185, 133, 17, 0.12)',
    },
    danger: {
      main: isDark ? '#F08A8A' : '#C94D4D',
      soft: isDark
        ? 'rgba(240, 138, 138, 0.14)'
        : 'rgba(201, 77, 77, 0.12)',
    },
    info: {
      main: isDark ? '#72B4FF' : '#2D78C5',
      soft: isDark
        ? 'rgba(114, 180, 255, 0.14)'
        : 'rgba(45, 120, 197, 0.12)',
    },
    accent: primary,
    accentSoft: isDark
      ? 'rgba(116, 211, 156, 0.16)'
      : 'rgba(16, 185, 129, 0.10)',
    accentRing: isDark
      ? 'rgba(116, 211, 156, 0.18)'
      : 'rgba(16, 185, 129, 0.18)',
  };

  return {
    mode,
    isDark,
    layout: SIDEMENU_LAYOUT,
    radius,
    shadow,
    spacing,
    glass,
    typography,
    interaction,
    menu,
    transitions,
    colors,
  };
}

// ---------------------------------------------------------------------------
// 5. MUI Component Overrides (สำหรับ inject เข้า createTheme)
// ---------------------------------------------------------------------------

/**
 * สร้าง MUI component overrides สำหรับ sidemenu layout
 * ใช้ร่วมกับ `createTheme({ components: sidemenuComponentOverrides(mode) })`
 */
export function sidemenuComponentOverrides(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const tokens = createSidemenuMasterTheme(mode);

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarGutter: 'stable',
        },
        body: {
          scrollbarGutter: 'stable',
          overflowY: 'scroll',
          background: isDark
            ? `radial-gradient(circle at top, rgba(116, 211, 156, 0.08), transparent 42%), ${tokens.colors.background.page}`
            : `linear-gradient(180deg, ${tokens.colors.background.page} 0%, #ffffff 100%)`,
          color: tokens.colors.text.primary,
        },
        '*::selection': {
          backgroundColor: isDark
            ? 'rgba(116, 211, 156, 0.28)'
            : 'rgba(31, 138, 86, 0.18)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: tokens.radius.md,
          boxShadow: tokens.shadow.card,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          boxShadow: tokens.shadow.card,
          transition: tokens.transitions.smooth,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          textTransform: 'none' as const,
          fontWeight: 700,
          boxShadow: 'none',
        },
        contained: {
          '&:hover': {
            boxShadow: tokens.shadow.tiny,
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': tokens.interaction.focus,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: tokens.transitions.menu,
          '&.Mui-selected': {
            background: tokens.menu.group.active.background,
            color: tokens.menu.group.active.color,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
          transition: tokens.transitions.smooth,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: isDark
            ? tokens.colors.background.surfaceStrong
            : tokens.colors.text.primary,
          color: isDark ? tokens.colors.text.primary : '#ffffff',
          borderRadius: tokens.radius.sm,
          boxShadow: tokens.shadow.card,
          fontSize: tokens.typography.tooltip.fontSize,
          fontWeight: tokens.typography.tooltip.fontWeight,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(220, 232, 223, 0.5)',
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
      },
      styleOverrides: {
        paper: {
          ...tokens.glass.dialog,
          overflow: 'hidden',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          '.MuiDialogTitle-root + &': {
            paddingTop: 20,
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${tokens.colors.border}`,
          padding: '16px 20px 20px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.pill,
          fontWeight: 600,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: isDark
            ? tokens.colors.background.surfaceMuted
            : tokens.colors.background.surface,
          borderRadius: tokens.radius.sm,
          transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 6. Re-export layout constants for direct usage
// ---------------------------------------------------------------------------

export const SIDEMENU_LAYOUT_CONSTANTS = SIDEMENU_LAYOUT;

// ---------------------------------------------------------------------------
// 7. MUI Theme Factory (convenience wrapper)
// ---------------------------------------------------------------------------

/**
 * สร้าง MUI Theme สำหรับ sidemenu layout skill โดยตรง
 *
 * @example
 * ```tsx
 * import { createSidemenuTheme } from '@/core/theme/sidemenu-master-theme';
 *
 * const theme = createSidemenuTheme('light');
 *
 * <ThemeProvider theme={theme}>
 *   <SidemenuLayout>...</SidemenuLayout>
 * </ThemeProvider>
 * ```
 */
export function createSidemenuTheme(mode: PaletteMode) {
  const { createTheme } = require('@mui/material');
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#74D39C' : '#1F8A56',
        light: mode === 'dark' ? '#A4E8BE' : '#4EAF77',
        dark: mode === 'dark' ? '#42A96D' : '#146642',
      },
      success: { main: mode === 'dark' ? '#6AD28D' : '#2E9D5A' },
      warning: { main: mode === 'dark' ? '#E3C15A' : '#B98511' },
      info: { main: mode === 'dark' ? '#72B4FF' : '#2D78C5' },
      error: { main: mode === 'dark' ? '#F08A8A' : '#C94D4D' },
      background: {
        default: mode === 'dark' ? '#0C1410' : '#F4FAF6',
        paper: mode === 'dark' ? '#121D17' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#EAF3EE' : '#173127',
        secondary: mode === 'dark' ? '#B6C8BE' : '#587066',
      },
      divider: mode === 'dark' ? '#23362C' : '#D4E1D8',
      action: {
        hover: mode === 'dark'
          ? 'rgba(116, 211, 156, 0.10)'
          : 'rgba(31, 138, 86, 0.08)',
        selected: mode === 'dark'
          ? 'rgba(116, 211, 156, 0.16)'
          : 'rgba(31, 138, 86, 0.12)',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily:
        'var(--font-bai-jamjuree), "Bai Jamjuree", "Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: sidemenuComponentOverrides(mode),
  });
}
