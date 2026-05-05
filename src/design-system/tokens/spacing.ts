/**
 * Spacing Design Tokens
 * FarmHUB Design System - 8px base grid
 */

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
} as const;

/** Semantic spacing names for common use cases */
export const semanticSpacing = {
  /** Compact layout gap */
  compact: 8,   // spacing(1) in MUI = 8px
  /** Default layout gap and padding */
  default: 16,  // spacing(2) in MUI = 16px
  /** Relaxed section spacing */
  relaxed: 24,  // spacing(3) in MUI = 24px
  /** Spacious page-level spacing */
  spacious: 32, // spacing(4) in MUI = 32px
} as const;

/** Content padding per breakpoint */
export const contentPadding = {
  mobile: { x: 8, y: 8 },    // spacing(1)
  tablet: { x: 16, y: 16 },  // spacing(2)
  desktop: { x: 32, y: 28 }, // 32px horizontal, 28px vertical (spec)
} as const;

/** Page header spacing */
export const pageHeaderSpacing = {
  marginBottom: 24,    // mb: 3
  paddingBottom: 4,    // pb: 0.5
} as const;
