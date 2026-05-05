import { alpha, type Theme } from '@mui/material/styles';

export type QuickStatusTone = 'neutral' | 'warning' | 'success' | 'info' | 'danger';

export const getQuickStatusTone = (status?: string | null): QuickStatusTone => {
  const normalized = String(status ?? '').trim().toLowerCase();

  switch (normalized) {
    case '':
    case 'all':
    case 'draft':
      return 'neutral';
    case 'pending':
    case 'low':
    case 'returned':
      return 'warning';
    case 'approved':
    case 'normal':
      return 'success';
    case 'completed':
      return 'info';
    case 'rejected':
    case 'out':
    case 'cancelled':
    case 'canceled':
      return 'danger';
    default:
      return 'neutral';
  }
};

const QUICK_STATUS_TONE_MAP = {
  neutral: {
    color: 'text',
    main: (theme: Theme) => theme.palette.text.primary,
  },
  warning: {
    color: 'warning',
    main: (theme: Theme) => theme.palette.warning.main,
  },
  success: {
    color: 'success',
    main: (theme: Theme) => theme.palette.success.main,
  },
  info: {
    color: 'info',
    main: (theme: Theme) => theme.palette.info.main,
  },
  danger: {
    color: 'error',
    main: (theme: Theme) => theme.palette.error.main,
  },
} as const;

type QuickStatusToneKey = keyof typeof QUICK_STATUS_TONE_MAP;

const resolveTonePalette = (theme: Theme, tone: QuickStatusTone) => {
  const toneKey = tone as QuickStatusToneKey;
  const palette = QUICK_STATUS_TONE_MAP[toneKey];
  const main = palette.main(theme);
  const selectedBgAlpha = theme.palette.mode === 'dark' ? 0.24 : 0.16;
  const idleBgAlpha = theme.palette.mode === 'dark' ? 0.14 : 0.08;
  const selectedBorderAlpha = theme.palette.mode === 'dark' ? 0.42 : 0.34;
  const idleBorderAlpha = theme.palette.mode === 'dark' ? 0.22 : 0.18;
  const countBgAlpha = theme.palette.mode === 'dark' ? 0.18 : 0.12;

  if (tone === 'neutral') {
    return {
      buttonBg: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.04),
      selectedBg: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.22 : 0.1),
      buttonColor: theme.palette.text.primary,
      selectedColor: theme.palette.text.primary,
      border: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.16 : 0.12),
      selectedBorder: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.28 : 0.2),
      countBg: alpha(theme.palette.text.primary, countBgAlpha),
      countColor: theme.palette.text.primary,
      countBorder: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.16 : 0.12),
      countShadow: 'none',
      hoverBg: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.16 : 0.08),
      hoverBorder: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.3 : 0.22),
    };
  }

  return {
    buttonBg: alpha(main, idleBgAlpha),
    selectedBg: alpha(main, selectedBgAlpha),
    buttonColor: theme.palette[palette.color].dark ?? main,
    selectedColor: theme.palette[palette.color].dark ?? main,
    border: alpha(main, idleBorderAlpha),
    selectedBorder: alpha(main, selectedBorderAlpha),
    countBg: alpha(main, countBgAlpha),
    countColor: theme.palette[palette.color].dark ?? main,
    countBorder: alpha(main, idleBorderAlpha),
    countShadow: `0 2px 6px ${alpha(main, 0.14)}`,
    hoverBg: alpha(main, selectedBgAlpha),
    hoverBorder: alpha(main, selectedBorderAlpha),
  };
};

export const getQuickStatusButtonSx = (
  theme: Theme,
  tone: QuickStatusTone,
  selected: boolean,
) => {
  const palette = resolveTonePalette(theme, tone);

  return {
    height: 36,
    borderRadius: 2,
    px: 1.2,
    minWidth: 0,
    textTransform: 'none',
    bgcolor: selected ? palette.selectedBg : palette.buttonBg,
    boxShadow: selected ? `0 8px 18px ${alpha(theme.palette.common.black, 0.08)}` : 'none',
    color: selected ? palette.selectedColor : palette.buttonColor,
    border: `1px solid ${selected ? palette.selectedBorder : palette.border}`,
    '&:hover': {
      bgcolor: palette.hoverBg,
      borderColor: palette.hoverBorder,
    },
  } as const;
};

export const getQuickStatusCountSx = (
  theme: Theme,
  tone: QuickStatusTone,
  selected: boolean,
) => {
  const palette = resolveTonePalette(theme, tone);

  return {
    minWidth: 24,
    height: 24,
    borderRadius: '999px',
    bgcolor: selected ? palette.selectedBg : palette.countBg,
    boxShadow: selected ? 'none' : palette.countShadow,
    color: selected ? palette.selectedColor : palette.countColor,
    border: `1px solid ${selected ? palette.selectedBorder : palette.countBorder}`,
    px: 0.8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.05rem',
    lineHeight: 1,
    fontWeight: 700,
  } as const;
};
