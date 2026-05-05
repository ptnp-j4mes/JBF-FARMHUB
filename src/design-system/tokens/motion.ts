/**
 * Motion / Animation Design Tokens
 * FarmHUB Design System - Easing curves, transition durations
 */

// ─── Easing Curves ────────────────────────────────────────────────
export const easing = {
  /** Layout transitions (sidebar, menus) */
  standard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  /** Micro-interactions (hover, focus) */
  ease: 'ease',
  /** Deceleration (entering elements) */
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  /** Acceleration (leaving elements) */
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// ─── Transition Durations ─────────────────────────────────────────
export const duration = {
  fast: 160,     // ms - Hover, focus micro-interactions
  smooth: 200,   // ms - Hover/focus states
  textFade: 300, // ms - Text opacity changes
  layout: 300,   // ms - Sidebar, accent bar transitions
  menu: 400,     // ms - Sidebar width, menu state changes
} as const;

// ─── Transition Presets ───────────────────────────────────────────
export const transitions = {
  /** Sidebar width transition */
  sidebarWidth: `${duration.menu}ms ${easing.standard}`,
  /** Menu item state changes */
  menu: `${duration.menu}ms ${easing.standard}`,
  /** Text opacity fade */
  textFade: `${duration.textFade}ms ${easing.ease}`,
  /** Chevron rotation */
  chevron: `${duration.smooth}ms ${easing.standard}`,
  /** Accent bar slide */
  accentBar: `${duration.layout}ms ${easing.standard}`,
  /** General smooth transition */
  smooth: `${duration.smooth}ms ${easing.ease}`,
  /** Glass panel hover */
  glassHover: `${duration.smooth}ms ${easing.ease}`,
  /** Input focus transition */
  inputFocus: `${duration.fast}ms ${easing.ease}`,
} as const;

// ─── Animation Rules ──────────────────────────────────────────────
// - No bounces, no spring physics, no entrance animations on page load
// - Cards do NOT lift on hover (no translateY)
