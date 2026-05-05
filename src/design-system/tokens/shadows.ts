/**
 * Shadow Design Tokens
 * FarmHUB Design System - 6 shadow levels with light/dark variants
 */

export const shadowsLight = {
  /** Icon containers, button hover */
  tiny: '0 4px 12px rgba(0, 0, 0, 0.04)',
  /** Active menu glow (red-tinted) */
  soft: '0 4px 15px -3px rgba(180, 35, 24, 0.18)',
  /** Default Paper/Card */
  card: '0 10px 26px rgba(20, 20, 20, 0.06)',
  /** Popovers, menus, dropdowns */
  raised: '0 18px 44px rgba(20, 20, 20, 0.10)',
  /** Sidebar/header glass panels */
  glass: '0 8px 30px rgba(0, 0, 0, 0.04)',
  /** Accent/highlight elements */
  accent: '0 6px 18px -6px rgba(180, 35, 24, 0.55)',
} as const;

export const shadowsDark = {
  tiny: '0 4px 12px rgba(0, 0, 0, 0.16)',
  soft: '0 4px 15px -3px rgba(240, 68, 56, 0.22)',
  card: '0 10px 24px rgba(0, 0, 0, 0.24)',
  raised: '0 16px 40px rgba(0, 0, 0, 0.34)',
  glass: '0 8px 30px rgba(0, 0, 0, 0.12)',
  accent: '0 6px 18px -6px rgba(240, 68, 56, 0.40)',
} as const;

/** Glass panel complex shadow (sidebar, header, dialogs) */
export const glassShadowLight = [
  '0 1px 0 rgba(255, 255, 255, 0.9) inset',
  '0 0 0 1px rgba(255, 255, 255, 0.04) inset',
  '0 18px 40px -18px rgba(20, 20, 20, 0.18)',
  '0 6px 16px -8px rgba(180, 35, 24, 0.08)',
].join(', ');

export const glassShadowDark = [
  '0 1px 0 rgba(255, 255, 255, 0.06) inset',
  '0 0 0 1px rgba(255, 255, 255, 0.02) inset',
  '0 18px 40px -18px rgba(0, 0, 0, 0.40)',
  '0 6px 16px -8px rgba(240, 68, 56, 0.12)',
].join(', ');

/** Active sidebar accent bar glow */
export const accentBarGlow = {
  light: '0 0 8px rgba(180, 35, 24, 0.5)',
  dark: '0 0 8px rgba(240, 68, 56, 0.5)',
} as const;

/** No inner shadows are used anywhere */
export const NO_INNER_SHADOW = 'none';
