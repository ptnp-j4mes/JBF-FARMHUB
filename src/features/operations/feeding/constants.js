import React from 'react';
import {
  Dashboard as TodayIcon,
  Construction as PlanIcon,
  PlayArrow as ExecutionIcon,
  BarChart as ReportsIcon,
} from '@mui/icons-material';

// ── UI Design Tokens ──
export const UI = {
  bg: '#fafafa',
  panel: '#ffffff',
  panelSoft: '#fdf7f6',
  panelMuted: '#f8ecea',
  border: '#e5e5e5',
  borderStrong: '#d6d6d6',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  accent: '#B42318',
  accentDark: '#912018',
  accentSoft: '#fef3f2',
  accentSurface: '#fff7f7',
  accentWarm: '#7b5f18',
  shadow:
    '0 18px 44px rgba(20, 20, 20, 0.08), 0 4px 12px rgba(20, 20, 20, 0.05)',
  shadowSoft:
    '0 10px 24px rgba(20, 20, 20, 0.06), 0 2px 6px rgba(20, 20, 20, 0.04)',
  shadowLift:
    '0 20px 52px rgba(20, 20, 20, 0.10), 0 8px 18px rgba(20, 20, 20, 0.06)',
};

// ── Shared Style Objects ──
export const panelSx = {
  borderRadius: 10,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

export const softPanelSx = {
  borderRadius: 10,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panelSoft,
  boxShadow: UI.shadowSoft,
};

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
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
  borderRadius: 10,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': {
    bgcolor: UI.accentDark,
  },
};

export const secondaryButtonSx = {
  borderRadius: 10,
  boxShadow: UI.shadowSoft,
  bgcolor: '#fff',
  color: UI.text,
  borderColor: UI.borderStrong,
  '&:hover': {
    borderColor: UI.accent,
    bgcolor: `rgba(180, 35, 24, 0.05)`,
  },
};

export const dialogPaperSx = {
  borderRadius: 10,
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
