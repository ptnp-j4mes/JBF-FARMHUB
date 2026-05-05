/**
 * Typography Design Tokens
 * FarmHUB Design System - Font family, size scale, weights, line heights
 */

// ─── Font Family ──────────────────────────────────────────────────
export const fontFamily = {
  primary:
    "'Bai Jamjuree', 'Noto Sans Thai', 'Noto Sans', 'Segoe UI', system-ui, -apple-system, sans-serif",
  monospace:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

// ─── Font Size Scale ──────────────────────────────────────────────
export const fontSize = {
  xs: '0.72rem',    // ~11.5px - Captions, micro labels
  sm: '0.78rem',    // ~12.5px - Table cells (tight)
  base: '0.875rem', // 14px - Body, menu labels
  md: '1rem',       // 16px - App name, dialog body
  lg: '1.125rem',   // 18px - Section titles
  xl: '1.25rem',    // 20px - h6
  '2xl': '1.5rem',  // 24px - h5
  '3xl': '1.75rem', // 28px - h4 (page titles)
  '4xl': '2.125rem', // 34px - Display
} as const;

// ─── Font Weights ─────────────────────────────────────────────────
export const fontWeight = {
  regular: 400,    // Body text
  medium: 500,     // Labels, secondary
  semibold: 600,   // Subheadings, form labels
  bold: 700,       // Headings, buttons
  extrabold: 800,  // Display, page titles
} as const;

// ─── Line Heights ─────────────────────────────────────────────────
export const lineHeight = {
  tight: 1.15,    // Headings
  snug: 1.25,     // h3-h6, table cells
  normal: 1.43,   // Body copy
  relaxed: 1.6,   // Extended body
} as const;

// ─── Letter Spacing ───────────────────────────────────────────────
export const letterSpacing = {
  tight: '-0.02em',   // h5 and display headings
  snug: '-0.01em',    // h6
  normal: '0',
  eyebrow: '0.08em',  // Section label tracking
} as const;

// ─── Heading Hierarchy ────────────────────────────────────────────
export const headingStyles = {
  h1: {
    fontSize: '2.125rem',  // 34px
    fontWeight: 800,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  },
  h2: {
    fontSize: '1.5rem',    // 24px
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
  },
  h3: {
    fontSize: '1.25rem',   // 20px
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
  },
  h4: {
    fontSize: '1.125rem',  // 18px
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.25,
  },
  h5: {
    fontSize: '1rem',      // 16px
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.25,
  },
} as const;

// ─── Body & Special Text Styles ───────────────────────────────────
export const textStyles = {
  body: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 400,
    lineHeight: 1.43,
    color: 'var(--fg-primary)',
  },
  bodySm: {
    fontSize: '0.78rem',   // 12.5px
    fontWeight: 400,
    lineHeight: 1.4,
    color: 'var(--fg-secondary)',
  },
  label: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 500,
    color: 'var(--fg-secondary)',
  },
  caption: {
    fontSize: '0.72rem',   // 11.5px
    fontWeight: 500,
    lineHeight: 1.15,
    color: 'var(--fg-muted)',
  },
  eyebrow: {
    fontSize: '0.72rem',   // 11.5px
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'var(--fg-muted)',
  },
  button: {
    fontSize: '0.875rem',  // 14px
    fontWeight: 700,
    textTransform: 'none' as const,
  },
  tableCell: {
    fontSize: '0.78rem',   // 12.5px
    fontWeight: 400,
    lineHeight: 1.25,
    color: 'var(--fg-primary)',
  },
} as const;
