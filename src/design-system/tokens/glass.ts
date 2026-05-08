/**
 * Glass Morphism Design Tokens
 * FarmHUB Design System - Glass panel configurations
 */

// ─── Glass Background Opacities ───────────────────────────────────
export const glassOpacity = {
  /** Standard glass panel */
  default: 0.55,
  /** Strong glass for content-heavy panels */
  strong: 0.78,
  /** Light glass for subtle effects */
  light: 0.48,
} as const;

// ─── Glass Blur Values ────────────────────────────────────────────
export const glassBlur = {
  /** Standard glass blur */
  default: 22,
  /** Strong glass blur */
  strong: 28,
  /** Light glass blur */
  light: 16,
} as const;

// ─── Glass Panel Configs per Context ──────────────────────────────
export const glassPanel = {
  /** Sidebar glass panel */
  sidebar: {
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.48))',
    backdropFilter: 'blur(28px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  /** Header glass panel */
  header: {
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.5))',
    backdropFilter: 'blur(28px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  /** Dialog/dropdown glass */
  dialog: {
    background: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(28px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  /** Dropdown/popup glass */
  dropdown: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(22px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.65)',
    borderRadius: 10,
  },
} as const;

// ─── Dark Mode Glass ──────────────────────────────────────────────
export const glassPanelDark = {
  sidebar: {
    background: 'linear-gradient(180deg, rgba(26, 26, 27, 0.80), rgba(26, 26, 27, 0.65))',
    backdropFilter: 'blur(28px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  header: {
    background: 'linear-gradient(180deg, rgba(26, 26, 27, 0.75), rgba(26, 26, 27, 0.60))',
    backdropFilter: 'blur(28px) saturate(150%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
  dialog: {
    background: 'rgba(26, 26, 27, 0.90)',
    backdropFilter: 'blur(28px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: 10,
  },
  dropdown: {
    background: 'rgba(26, 26, 27, 0.92)',
    backdropFilter: 'blur(22px) saturate(140%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
  },
} as const;

// ─── Prism Aurora Background ──────────────────────────────────────
export const prismAurora = {
  light: [
    'radial-gradient(900px 600px at 8% -10%, rgba(244, 114, 182, 0.18), transparent 60%)',
    'radial-gradient(800px 600px at 100% 10%, rgba(180, 35, 24, 0.18), transparent 55%)',
    'radial-gradient(900px 700px at 60% 100%, rgba(125, 211, 252, 0.14), transparent 55%)',
    'radial-gradient(700px 500px at 0% 80%, rgba(253, 162, 155, 0.18), transparent 60%)',
    'linear-gradient(180deg, #FBFBFD 0%, #F4F4F7 100%)',
  ].join(', '),
  dark: [
    'radial-gradient(900px 600px at 8% -10%, rgba(244, 114, 182, 0.10), transparent 60%)',
    'radial-gradient(800px 600px at 100% 10%, rgba(240, 68, 56, 0.12), transparent 55%)',
    'radial-gradient(900px 700px at 60% 100%, rgba(125, 211, 252, 0.08), transparent 55%)',
    'radial-gradient(700px 500px at 0% 80%, rgba(253, 162, 155, 0.10), transparent 60%)',
    'linear-gradient(180deg, #0F0F10 0%, #151516 100%)',
  ].join(', '),
} as const;
