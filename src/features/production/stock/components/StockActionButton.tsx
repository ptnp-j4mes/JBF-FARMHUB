'use client';

import { Button, type ButtonProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { STOCK_WORKSPACE_UI } from './StockWorkspaceChrome';

type StockActionTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

type StockButtonShape = 'rounded' | 'pill';

type StockActionButtonProps = ButtonProps & {
  tone?: StockActionTone;
  shape?: StockButtonShape;
};

const sharedButtonSx = {
  textTransform: 'none' as const,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  minWidth: 0,
  width: 'fit-content',
  whiteSpace: 'nowrap' as const,
  display: 'inline-flex',
  alignSelf: 'flex-start',
  transition:
    'background-color 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease',
  '& .MuiButton-startIcon': {
    marginRight: 0.6,
  },
  '& .MuiButton-startIcon > *:first-of-type': {
    fontSize: '1rem',
  },
  '&.Mui-disabled': {
    opacity: 0.5,
  },
};

const shapeButtonSx: Record<StockButtonShape, Record<string, unknown>> = {
  rounded: { borderRadius: 12 },
  pill: { borderRadius: 999 },
};

const sizeButtonSx: Record<NonNullable<ButtonProps['size']>, Record<string, unknown>> = {
  small: {
    minHeight: 32,
    px: 1.5,
    fontSize: '0.8rem',
  },
  medium: {
    minHeight: 38,
    px: 2,
    fontSize: '0.875rem',
  },
  large: {
    minHeight: 44,
    px: 2.4,
    fontSize: '0.93rem',
  },
};

const toneButtonSx: Record<StockActionTone, Record<string, unknown>> = {
  primary: {
    bgcolor: 'rgba(31, 138, 86, 0.08)',
    color: '#146642',
    border: '1px solid rgba(31, 138, 86, 0.22)',
  },
  neutral: {
    bgcolor: 'rgba(23, 49, 39, 0.04)',
    color: '#41514b',
    border: '1px solid rgba(23, 49, 39, 0.12)',
  },
  success: {
    bgcolor: 'rgba(46, 157, 90, 0.08)',
    color: '#1a6b3a',
    border: '1px solid rgba(46, 157, 90, 0.22)',
  },
  info: {
    bgcolor: 'rgba(45, 120, 197, 0.06)',
    color: '#1d5fa3',
    border: '1px solid rgba(45, 120, 197, 0.18)',
  },
  warning: {
    bgcolor: 'rgba(185, 133, 17, 0.08)',
    color: '#7a5c0a',
    border: '1px solid rgba(185, 133, 17, 0.22)',
  },
  danger: {
    bgcolor: 'rgba(201, 77, 77, 0.08)',
    color: '#8f2d25',
    border: '1px solid rgba(201, 77, 77, 0.22)',
  },
  secondary: {
    bgcolor: 'rgba(47, 101, 112, 0.06)',
    color: '#2f6570',
    border: '1px solid rgba(47, 101, 112, 0.18)',
  },
};

const toneHoverSx: Record<StockActionTone, Record<string, unknown>> = {
  primary: {
    bgcolor: 'rgba(31, 138, 86, 0.16)',
    borderColor: 'rgba(31, 138, 86, 0.34)',
  },
  neutral: {
    bgcolor: 'rgba(23, 49, 39, 0.08)',
    borderColor: 'rgba(23, 49, 39, 0.20)',
  },
  success: {
    bgcolor: 'rgba(46, 157, 90, 0.16)',
    borderColor: 'rgba(46, 157, 90, 0.34)',
  },
  info: {
    bgcolor: 'rgba(45, 120, 197, 0.12)',
    borderColor: 'rgba(45, 120, 197, 0.28)',
  },
  warning: {
    bgcolor: 'rgba(185, 133, 17, 0.16)',
    borderColor: 'rgba(185, 133, 17, 0.34)',
  },
  danger: {
    bgcolor: 'rgba(201, 77, 77, 0.16)',
    borderColor: 'rgba(201, 77, 77, 0.34)',
  },
  secondary: {
    bgcolor: 'rgba(47, 101, 112, 0.12)',
    borderColor: 'rgba(47, 101, 112, 0.28)',
  },
};

export function StockActionButton({
  tone = 'primary',
  shape = 'rounded',
  size = 'medium',
  variant,
  sx,
  ...props
}: StockActionButtonProps) {
  const resolvedVariant = variant ?? 'outlined';
  const composedSx = {
    ...sharedButtonSx,
    ...shapeButtonSx[shape],
    ...sizeButtonSx[size ?? 'medium'],
    ...toneButtonSx[tone],
    '& .MuiButton-startIcon': {
      marginRight: 0.6,
    },
    '& .MuiButton-startIcon > *:first-of-type': {
      fontSize: '1rem',
    },
    '&.MuiButton-outlined': {
      bgcolor: toneButtonSx[tone].bgcolor,
      color: toneButtonSx[tone].color,
      borderColor: String(toneButtonSx[tone].border).replace('1px solid ', ''),
      borderWidth: 1,
      borderStyle: 'solid',
    },
    '&.MuiButton-contained': {
      bgcolor: toneButtonSx[tone].bgcolor,
      color: toneButtonSx[tone].color,
      borderColor: String(toneButtonSx[tone].border).replace('1px solid ', ''),
      borderWidth: 1,
      borderStyle: 'solid',
    },
    '&:hover': {
      ...toneHoverSx[tone],
    },
    '&:focus-visible': {
      outline: `3px solid ${alpha(STOCK_WORKSPACE_UI.accent, 0.22)}`,
      outlineOffset: 2,
    },
    ...(typeof sx === 'object' && !Array.isArray(sx) ? sx : {}),
  };

  return (
    <Button
      disableElevation
      fullWidth={false}
      variant={resolvedVariant}
      size={size}
      sx={composedSx}
      {...props}
    />
  );
}
