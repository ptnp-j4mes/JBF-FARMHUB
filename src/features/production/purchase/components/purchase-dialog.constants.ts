import { alpha } from '@mui/material/styles';

const UI = {
  accent: '#B42318',
  accentDark: '#912018',
  panel: '#ffffff',
  panelSoft: '#fdf7f6',
  panelMuted: '#f8ecea',
  border: '#e5ddd9',
  borderStrong: '#d6c6c1',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  shadow: '0 18px 40px rgba(20, 20, 20, 0.08), 0 3px 10px rgba(20, 20, 20, 0.05)',
  shadowSoft: '0 10px 24px rgba(20, 20, 20, 0.06), 0 2px 6px rgba(20, 20, 20, 0.04)',
};

export const PURCHASE_DIALOG_UI = UI;

export const PURCHASE_DIALOG_PAPER_SX = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadow,
  overflow: 'hidden',
  bgcolor: UI.panel,
};

export const PURCHASE_DIALOG_TITLE_SX = {
  textAlign: 'center',
  bgcolor: UI.accent,
  color: '#fff',
  borderBottom: `1px solid ${alpha(UI.accent, 0.24)}`,
  fontWeight: 800,
  '& .MuiIconButton-root': {
    color: '#fff',
  },
} as const;

export const PURCHASE_DIALOG_CONTENT_SX = {
  bgcolor: '#fff',
  px: { xs: 1.5, md: 2 },
  py: { xs: 1.5, md: 2 },
  '& .MuiTextField-root .MuiOutlinedInput-root': {
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
} as const;

export const PURCHASE_DIALOG_FIELDSET_SX = {
  border: `1px solid ${UI.border}`,
  borderRadius: 3,
  p: { xs: 1.25, md: 1.5 },
  minWidth: 0,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
};

export const PURCHASE_DIALOG_LEGEND_SX = {
  px: 1.1,
  fontSize: '0.95rem',
  fontWeight: 800,
  color: UI.text,
  letterSpacing: '-0.01em',
};

export const PURCHASE_DIALOG_TABLE_SX = {
  border: `1px solid ${UI.border}`,
  borderRadius: 2.6,
  bgcolor: '#fff',
  boxShadow: UI.shadowSoft,
  '& .MuiTableCell-head': {
    bgcolor: UI.accent,
    color: '#fff',
    fontWeight: 800,
    borderBottom: `1px solid ${alpha(UI.accentDark, 0.45)}`,
  },
  '& .MuiTableCell-body': {
    color: UI.text,
    borderBottom: `1px solid ${alpha(UI.border, 0.92)}`,
  },
  '& .MuiTableRow-root:hover': {
    bgcolor: '#fef3f2',
  },
};

export const PURCHASE_DIALOG_ACTIONS_SX = {
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  borderTop: `1px solid ${UI.border}`,
  bgcolor: '#fff',
  gap: 1,
};

export const PURCHASE_DIALOG_PRIMARY_BUTTON_SX = {
  borderRadius: 12,
  px: 2.2,
  fontWeight: 600,
  textTransform: 'none' as const,
  bgcolor: 'rgba(180, 35, 24, 0.12)',
  color: '#912018',
  border: '1px solid rgba(180, 35, 24, 0.24)',
  '&:hover': {
    bgcolor: 'rgba(180, 35, 24, 0.20)',
    borderColor: 'rgba(180, 35, 24, 0.36)',
  },
};

export const PURCHASE_DIALOG_SECONDARY_BUTTON_SX = {
  borderRadius: 12,
  px: 2,
  fontWeight: 600,
  textTransform: 'none' as const,
  bgcolor: 'rgba(0, 0, 0, 0.04)',
  color: '#525252',
  border: '1px solid rgba(0, 0, 0, 0.14)',
  '&:hover': {
    bgcolor: 'rgba(0, 0, 0, 0.06)',
    borderColor: 'rgba(0, 0, 0, 0.22)',
  },
};

export const PURCHASE_DIALOG_ERROR_ALERT_SX = {
  border: '1px solid #f3c2c2',
  bgcolor: '#fff4f4',
  color: '#8c2f2f',
  boxShadow: UI.shadowSoft,
};

export const PURCHASE_DIALOG_INFO_ALERT_SX = {
  border: `1px solid ${alpha(UI.accent, 0.14)}`,
  bgcolor: '#fef3f2',
  color: UI.text,
  boxShadow: UI.shadowSoft,
};

export const PURCHASE_DIALOG_SECTION_BOX_SX = {
  p: 1.2,
  border: `1px solid ${UI.border}`,
  borderRadius: 2.4,
  bgcolor: '#fff',
};
