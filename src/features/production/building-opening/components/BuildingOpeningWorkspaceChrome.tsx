'use client';

import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { StockSection, StockSummaryCard } from '@/features/production/stock/components/StockWorkspaceChrome';

export const BUILDING_OPENING_UI = {
  accent: 'rgb(22, 90, 80)',
  accentDark: '#10473f',
  background: '#f4f7f5',
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#eef4ef',
  border: '#d8dfda',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  softShadow: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

export const buildingOpeningPageShellSx = {
  minHeight: '100%',
  p: { xs: 1, md: 2 },
};

export const buildingOpeningPanelSx = {
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

export const buildingOpeningFieldsetSx = {
  ...buildingOpeningPanelSx,
  minWidth: 0,
  p: { xs: 1.25, md: 1.5 },
};

export const buildingOpeningLegendSx = {
  px: 1,
  color: 'primary.main',
  fontWeight: 800,
  fontSize: '0.98rem',
};

export const buildingOpeningSectionBoxSx = {
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  p: 1.25,
};

export const buildingOpeningTableShellSx = {
  ...buildingOpeningPanelSx,
  p: { xs: 1.25, md: 1.5 },
};

export const buildingOpeningInputSx = {
  '& .MuiOutlinedInput-root': {
    height: 40,
    borderRadius: 2,
    bgcolor: 'background.paper',
    boxShadow: 1,
    '& fieldset': {
      borderColor: BUILDING_OPENING_UI.border,
    },
    '&:hover fieldset': {
      borderColor: BUILDING_OPENING_UI.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: BUILDING_OPENING_UI.accent,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: BUILDING_OPENING_UI.accent,
  },
};

export const buildingOpeningDialogPaperSx = (theme: Theme) => ({
  borderRadius: 3.5,
  border: '1px solid',
  borderColor: theme.palette.divider,
  boxShadow: 2,
  overflow: 'hidden',
  bgcolor: theme.palette.background.paper,
});

export const buildingOpeningDialogTitleSx = (theme: Theme) => ({
  bgcolor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 800,
  '& .MuiIconButton-root': {
    color: theme.palette.text.secondary,
  },
});

export const buildingOpeningDialogContentSx = {
  bgcolor: 'background.paper',
  px: { xs: 1.5, md: 2 },
  py: { xs: 1.5, md: 2 },
};

export const buildingOpeningDialogActionsSx = {
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  borderTop: `1px solid ${BUILDING_OPENING_UI.border}`,
  bgcolor: 'background.paper',
  gap: 1,
};

export const buildingOpeningInfoAlertSx = {
  border: `1px solid ${alpha(BUILDING_OPENING_UI.accent, 0.14)}`,
  bgcolor: '#f2f7f4',
  color: BUILDING_OPENING_UI.text,
  boxShadow: BUILDING_OPENING_UI.softShadow,
};

export const buildingOpeningErrorAlertSx = {
  border: '1px solid #f3c2c2',
  bgcolor: '#fff4f4',
  color: '#8c2f2f',
  boxShadow: BUILDING_OPENING_UI.softShadow,
};

export const buildingOpeningOutlinedButtonSx = {
  borderRadius: 2.2,
  px: 2,
  boxShadow: BUILDING_OPENING_UI.softShadow,
  bgcolor: '#fff',
  borderColor: BUILDING_OPENING_UI.borderStrong,
  color: BUILDING_OPENING_UI.text,
  '&:hover': {
    borderColor: BUILDING_OPENING_UI.accent,
    bgcolor: '#f7faf7',
  },
};

export const buildingOpeningPrimaryButtonSx = {
  borderRadius: 2.2,
  px: 2.2,
  boxShadow: BUILDING_OPENING_UI.softShadow,
  bgcolor: BUILDING_OPENING_UI.accent,
  '&:hover': {
    bgcolor: BUILDING_OPENING_UI.accentDark,
  },
};

export {
  StockSection as BuildingOpeningSection,
  StockSummaryCard as BuildingOpeningSummaryCard,
};
