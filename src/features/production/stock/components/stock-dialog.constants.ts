import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export function getStockDialogPaperSx(theme: Theme) {
  return {
    borderRadius: 3.5,
    border: '1px solid',
    borderColor: theme.palette.divider,
    boxShadow: 2,
    overflow: 'hidden',
    bgcolor: theme.palette.background.paper,
  };
}

export function getStockDialogTitleSx(theme: Theme) {
  return {
    textAlign: 'center' as const,
    bgcolor: theme.palette.primary.main,
    color: '#fff',
    borderBottom: `1px solid ${alpha(theme.palette.primary.dark, 0.24)}`,
    fontWeight: 800,
    '& .MuiIconButton-root': {
      color: '#fff',
    },
  };
}

export function getStockDialogFormSx(theme: Theme) {
  return {
    '& .MuiTextField-root .MuiOutlinedInput-root': {
      minHeight: 36,
      borderRadius: 2.2,
      bgcolor: alpha(theme.palette.primary.main, 0.03),
      boxShadow: 1,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.text.secondary,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiTextField-root .MuiOutlinedInput-input': {
      py: '8px',
    },
    '& .MuiTextField-root .MuiOutlinedInput-root.MuiInputBase-multiline': {
      minHeight: 74,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: theme.palette.primary.main,
    },
    '& .MuiFormLabel-asterisk': {
      color: theme.palette.error.main,
    },
    bgcolor: theme.palette.background.paper,
    px: { xs: 1.5, md: 2 },
    py: { xs: 1.5, md: 2 },
  };
}

export function getStockDialogFieldsetSx(theme: Theme) {
  return {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
    p: { xs: 1.25, md: 1.5 },
    minWidth: 0,
    bgcolor: theme.palette.background.paper,
    boxShadow: 1,
  };
}

export const STOCK_DIALOG_LEGEND_SX = {
  px: 1.1,
  fontSize: '0.95rem',
  fontWeight: 800,
  color: 'text.primary',
  letterSpacing: '-0.01em',
};

export function getStockDialogSectionBoxSx(theme: Theme) {
  return {
    p: 1.25,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2.4,
    bgcolor: theme.palette.background.paper,
  };
}

export function getStockDialogTableSx(theme: Theme) {
  return {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 2.6,
    bgcolor: theme.palette.background.paper,
    boxShadow: 1,
    '& .MuiTableCell-head': {
      bgcolor: theme.palette.primary.main,
      color: '#fff',
      fontWeight: 800,
      borderBottom: `1px solid ${alpha(theme.palette.primary.dark, 0.45)}`,
    },
    '& .MuiTableCell-body': {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .MuiTableRow-root:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.04),
    },
  };
}

export function getStockDialogActionsSx(theme: Theme) {
  return {
    px: { xs: 1.5, md: 2 },
    py: 1.25,
    borderTop: `1px solid ${theme.palette.divider}`,
    bgcolor: theme.palette.background.paper,
    gap: 1,
  };
}

export function getStockDialogPrimaryButtonSx(theme: Theme) {
  return {
    borderRadius: 12,
    px: 2.2,
    fontWeight: 600,
    textTransform: 'none',
    bgcolor: alpha(theme.palette.primary.main, 0.12),
    color: theme.palette.primary.dark,
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, 0.24),
    '&:hover': {
      bgcolor: alpha(theme.palette.primary.main, 0.20),
      borderColor: alpha(theme.palette.primary.main, 0.36),
    },
  };
}

export function getStockDialogSecondaryButtonSx(theme: Theme) {
  return {
    borderRadius: 12,
    px: 2,
    fontWeight: 600,
    textTransform: 'none',
    bgcolor: alpha(theme.palette.text.primary, 0.04),
    color: theme.palette.text.secondary,
    border: '1px solid',
    borderColor: alpha(theme.palette.text.primary, 0.14),
    '&:hover': {
      bgcolor: alpha(theme.palette.text.primary, 0.06),
      borderColor: alpha(theme.palette.text.primary, 0.22),
    },
  };
}

export function getStockDialogInfoAlertSx(theme: Theme) {
  return {
    border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
    bgcolor: alpha(theme.palette.primary.main, 0.04),
    color: theme.palette.text.primary,
    boxShadow: 1,
  };
}

export function getStockDialogErrorAlertSx(theme: Theme) {
  return {
    border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
    bgcolor: alpha(theme.palette.error.main, 0.04),
    color: theme.palette.error.dark,
    boxShadow: 1,
  };
}
