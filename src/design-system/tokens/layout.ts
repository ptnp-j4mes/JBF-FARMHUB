/**
 * Layout Design Tokens
 * FarmHUB Design System - Sidebar dimensions, header, z-index, breakpoints
 */

// ─── Sidebar Dimensions ───────────────────────────────────────────
export const sidebar = {
  /** Expanded sidebar width */
  width: 256,
  /** Collapsed sidebar width */
  collapsedWidth: 80,
  /** Sidebar margin from edge */
  margin: 14,
} as const;

// ─── Header Dimensions ────────────────────────────────────────────
export const header = {
  /** Top header bar height */
  height: 80,
  /** Header margin from edge */
  margin: 14,
} as const;

// ─── Z-Index Scale ────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  sidebar: 1200,
  header: 1100,
  drawer: 1300,
  dialog: 1400,
  tooltip: 1500,
  notification: 1600,
} as const;

// ─── Breakpoints ──────────────────────────────────────────────────
export const breakpoints = {
  /** Mobile breakpoint (sidebar becomes drawer) */
  mobile: 640,
  /** Tablet breakpoint */
  tablet: 768,
  /** Desktop minimum */
  desktop: 1024,
  /** Wide desktop (optimal) */
  wide: 1280,
} as const;

// ─── Content Area ─────────────────────────────────────────────────
export const content = {
  /** Desktop content padding */
  padding: '28px 32px 48px',
  /** Layout gap between sidebar and content */
  layoutGap: 16,
} as const;

// ─── Layout Constants (replaces SIDEMENU_LAYOUT_CONSTANTS) ────────
export const SIDEMENU_LAYOUT_CONSTANTS = {
  sidebarWidth: sidebar.width,
  sidebarCollapsedWidth: sidebar.collapsedWidth,
  headerHeight: header.height,
  mobileBreakpoint: breakpoints.mobile,
  zIndex: zIndex,
} as const;
