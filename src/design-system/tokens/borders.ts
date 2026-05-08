/**
 * Border Design Tokens
 * FarmHUB Design System - Border radius, widths, colors
 */

// ─── Border Radius Scale ──────────────────────────────────────────
export const radius = {
  xs: 10,    // Sub-menu items, icon containers
  sm: 10,    // Buttons, inputs, chips, default Paper
  md: 10,    // Cards, glass panels (sidebar/header)
  lg: 10,    // Group menu buttons
  xl: 10,    // Decorative, login card
  pill: 999, // Chips, badges, status pills, avatars
} as const;

// ─── Default MUI shape ────────────────────────────────────────────
export const defaultBorderRadius = 10; // matches the standard surface radius

// ─── Border Widths ────────────────────────────────────────────────
export const borderWidth = {
  default: '1px',       // Always 1px solid (never thicker)
  focus: '1.5px',       // Inputs get 1.5px on focus
  accent: '2.5px',      // Active tab bottom border
} as const;

// ─── Focus Outline ────────────────────────────────────────────────
export const focusOutline = {
  width: '3px',
  color: 'rgba(180, 35, 24, 0.22)',
  offset: 2,
} as const;

/** Focus ring as box-shadow (used by inputs, buttons) */
export const focusRing = {
  light: '0 0 0 3px rgba(180, 35, 24, 0.12)',
  dark: '0 0 0 3px rgba(240, 68, 56, 0.18)',
} as const;

// ─── Divider ──────────────────────────────────────────────────────
export const divider = {
  opacity: 0.7,
  bottomBorder: '1px solid rgba(229, 229, 229, 0.7)',
} as const;
