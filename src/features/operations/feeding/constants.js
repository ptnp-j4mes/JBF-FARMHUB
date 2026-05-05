import React from 'react';
import {
  Dashboard as TodayIcon,
  Construction as PlanIcon,
  PlayArrow as ExecutionIcon,
  BarChart as ReportsIcon,
} from '@mui/icons-material';

// ── UI Design Tokens ──
export const UI = {
  bg: '#eef3ee',
  panel: '#ffffff',
  panelSoft: '#f7faf8',
  panelMuted: '#edf3ef',
  border: '#d9e2dc',
  borderStrong: '#c6d2cb',
  text: '#21312c',
  muted: '#6f7f77',
  accent: '#165a50',
  accentDark: '#0f453d',
  accentSoft: '#d9e8e3',
  accentSurface: '#edf6f2',
  accentWarm: '#7b5f18',
  shadow:
    '0 18px 44px rgba(18, 38, 33, 0.08), 0 4px 12px rgba(18, 38, 33, 0.05)',
  shadowSoft:
    '0 10px 24px rgba(18, 38, 33, 0.06), 0 2px 6px rgba(18, 38, 33, 0.04)',
  shadowLift:
    '0 20px 52px rgba(18, 38, 33, 0.10), 0 8px 18px rgba(18, 38, 33, 0.06)',
};

// ── Shared Style Objects ──
export const panelSx = {
  borderRadius: 3.6,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

export const softPanelSx = {
  borderRadius: 3.2,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panelSoft,
  boxShadow: UI.shadowSoft,
};

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.2,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
    '& fieldset': {
      borderColor: UI.border,
    },
    '&:hover fieldset': {
      borderColor: UI.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: UI.accent,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: UI.accent,
  },
};

export const primaryButtonSx = {
  borderRadius: 2.4,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': {
    bgcolor: UI.accentDark,
  },
};

export const secondaryButtonSx = {
  borderRadius: 2.4,
  boxShadow: UI.shadowSoft,
  bgcolor: '#fff',
  color: UI.text,
  borderColor: UI.borderStrong,
  '&:hover': {
    borderColor: UI.accent,
    bgcolor: `rgba(22, 90, 80, 0.05)`,
  },
};

export const dialogPaperSx = {
  borderRadius: 3.75,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadow,
  overflow: 'hidden',
};

// ── Tab Configuration ──
export const TABS = [
  { id: 'today', label: 'Today Board', icon: <TodayIcon /> },
  { id: 'plan', label: 'Plan Builder', icon: <PlanIcon /> },
  { id: 'execution', label: 'Execution', icon: <ExecutionIcon /> },
  { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
];

export const TAB_IDS = new Set(TABS.map((tab) => tab.id));
