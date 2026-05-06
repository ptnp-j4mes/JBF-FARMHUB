'use client';

import { Button, type ButtonProps } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

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

function getToneColors(theme: ReturnType<typeof useTheme>, tone: StockActionTone) {
  const palette = theme.palette;
  const mode = palette.mode;
  const alphaBg = mode === 'dark' ? 0.18 : 0.08;
  const alphaBorder = mode === 'dark' ? 0.32 : 0.22;
  const alphaHoverBg = mode === 'dark' ? 0.26 : 0.16;
  const alphaHoverBorder = mode === 'dark' ? 0.42 : 0.34;

  switch (tone) {
    case 'primary':
      return {
        bg: alpha(palette.primary.main, alphaBg),
        text: palette.primary.dark,
        border: alpha(palette.primary.main, alphaBorder),
        hoverBg: alpha(palette.primary.main, alphaHoverBg),
        hoverBorder: alpha(palette.primary.main, alphaHoverBorder),
      };
    case 'success':
      return {
        bg: alpha(palette.success.main, alphaBg),
        text: palette.success.dark,
        border: alpha(palette.success.main, alphaBorder),
        hoverBg: alpha(palette.success.main, alphaHoverBg),
        hoverBorder: alpha(palette.success.main, alphaHoverBorder),
      };
    case 'warning':
      return {
        bg: alpha(palette.warning.main, alphaBg),
        text: palette.warning.dark ?? palette.warning.main,
        border: alpha(palette.warning.main, alphaBorder),
        hoverBg: alpha(palette.warning.main, alphaHoverBg),
        hoverBorder: alpha(palette.warning.main, alphaHoverBorder),
      };
    case 'danger':
      return {
        bg: alpha(palette.error.main, alphaBg),
        text: palette.error.dark,
        border: alpha(palette.error.main, alphaBorder),
        hoverBg: alpha(palette.error.main, alphaHoverBg),
        hoverBorder: alpha(palette.error.main, alphaHoverBorder),
      };
    case 'info':
      return {
        bg: alpha(palette.info.main, alphaBg),
        text: palette.info.dark ?? palette.info.main,
        border: alpha(palette.info.main, alphaBorder),
        hoverBg: alpha(palette.info.main, alphaHoverBg),
        hoverBorder: alpha(palette.info.main, alphaHoverBorder),
      };
    case 'secondary':
      return {
        bg: alpha(palette.secondary.main, alphaBg),
        text: palette.secondary.dark ?? palette.secondary.main,
        border: alpha(palette.secondary.main, alphaBorder),
        hoverBg: alpha(palette.secondary.main, alphaHoverBg),
        hoverBorder: alpha(palette.secondary.main, alphaHoverBorder),
      };
    case 'neutral':
    default:
      return {
        bg: alpha(palette.text.primary, alphaBg * 0.5),
        text: palette.text.primary,
        border: alpha(palette.text.primary, alphaBorder * 0.55),
        hoverBg: alpha(palette.text.primary, alphaHoverBg * 0.7),
        hoverBorder: alpha(palette.text.primary, alphaHoverBorder * 0.6),
      };
  }
}

export function StockActionButton({
  tone = 'primary',
  shape = 'rounded',
  size = 'medium',
  variant,
  sx,
  ...props
}: StockActionButtonProps) {
  const theme = useTheme();
  const resolvedVariant = variant ?? 'outlined';
  const toneColors = getToneColors(theme, tone);

  const composedSx = {
    ...sharedButtonSx,
    ...shapeButtonSx[shape],
    ...sizeButtonSx[size ?? 'medium'],
    '& .MuiButton-startIcon': {
      marginRight: 0.6,
    },
    '& .MuiButton-startIcon > *:first-of-type': {
      fontSize: '1rem',
    },
    '&.MuiButton-outlined': {
      bgcolor: toneColors.bg,
      color: toneColors.text,
      borderColor: toneColors.border,
      borderWidth: 1,
      borderStyle: 'solid',
    },
    '&.MuiButton-contained': {
      bgcolor: toneColors.bg,
      color: toneColors.text,
      borderColor: toneColors.border,
      borderWidth: 1,
      borderStyle: 'solid',
    },
    '&:hover': {
      bgcolor: toneColors.hoverBg,
      borderColor: toneColors.hoverBorder,
    },
    '&:focus-visible': {
      outline: `3px solid ${alpha(theme.palette.primary.main, 0.22)}`,
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
