/**
 * App Theme Factory
 * FarmHUB Design System - MUI theme creation using design tokens
 *
 * Moved from src/core/theme/create-app-theme.ts
 */

import { createTheme, type PaletteMode } from '@mui/material';
import { getThemeTokens } from './create-tokens';

export const createAppTheme = (mode: PaletteMode) => {
  const tokens = getThemeTokens(mode);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary.main,
        light: tokens.primary.light,
        dark: tokens.primary.dark,
      },
      success: {
        main: tokens.success.main,
      },
      warning: {
        main: tokens.warning.main,
      },
      info: {
        main: tokens.info.main,
      },
      error: {
        main: tokens.danger.main,
      },
      background: {
        default: tokens.background.page,
        paper: tokens.background.surface,
      },
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
      },
      divider: tokens.border,
      action: {
        hover: mode === 'dark'
          ? 'rgba(240, 68, 56, 0.10)'
          : 'rgba(180, 35, 24, 0.08)',
        selected: mode === 'dark'
          ? 'rgba(240, 68, 56, 0.16)'
          : 'rgba(180, 35, 24, 0.12)',
      },
    },
    shape: {
      borderRadius: 1,
    },
    typography: {
      fontFamily:
        'var(--font-bai-jamjuree), "Bai Jamjuree", "Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
      h5: {
        fontWeight: 800,
        letterSpacing: '-0.03em',
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarGutter: 'stable',
            fontFamily:
              'var(--font-bai-jamjuree), "Bai Jamjuree", "Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
            backgroundColor: tokens.background.page,
          },
          body: {
            scrollbarGutter: 'stable',
            overflowY: 'scroll',
            background:
              mode === 'dark'
                ? `radial-gradient(circle at top, rgba(240, 68, 56, 0.10), transparent 42%), ${tokens.background.page}`
                : `linear-gradient(180deg, ${tokens.background.page} 0%, #ffffff 100%)`,
            color: tokens.text.primary,
            fontFamily:
              'var(--font-bai-jamjuree), "Bai Jamjuree", "Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
          },
          '*::selection': {
            backgroundColor: mode === 'dark'
              ? 'rgba(240, 68, 56, 0.28)'
              : 'rgba(180, 35, 24, 0.18)',
          },
          '.jbf-swal-container': {
            zIndex: '2000 !important',
          },
          '.swal2-container': {
            zIndex: '2000 !important',
          },
          '.admin-table-exempt .MuiTableCell-root': {
            fontSize: '0.875rem',
            lineHeight: 1.43,
            paddingTop: 12,
            paddingBottom: 12,
          },
          '.admin-table-exempt .MuiTableCell-head': {
            fontSize: '0.875rem',
            lineHeight: 1.43,
            paddingTop: 14,
            paddingBottom: 14,
          },
          'fieldset:not(.MuiOutlinedInput-notchedOutline)': {
            backgroundColor: '#fff',
          },
          'fieldset.MuiOutlinedInput-notchedOutline': {
            backgroundColor: 'transparent',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${tokens.border}`,
            borderRadius: 10,
            boxShadow: tokens.shadow.card,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${tokens.border}`,
            borderRadius: 10,
            boxShadow: tokens.shadow.card,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${tokens.border}`,
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            verticalAlign: 'top',
            fontSize: '0.78rem',
            lineHeight: 1.25,
            paddingTop: 6,
            paddingBottom: 6,
          },
          head: {
            fontWeight: 600,
            color: tokens.text.secondary,
            background: tokens.background.surfaceMuted,
            fontSize: '0.78rem',
            lineHeight: 1.25,
            paddingTop: 6,
            paddingBottom: 6,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            width: '100%',
            overflowX: 'auto',
            scrollbarColor:
              mode === 'dark'
                ? `${tokens.sidebar.accent} ${tokens.background.surfaceMuted}`
                : `${tokens.primary.main} ${tokens.background.surfaceMuted}`,
          },
        },
      },
      MuiTable: {
        styleOverrides: {
          root: {
            width: '100%',
            tableLayout: 'fixed',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 'none',
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${tokens.primary.light} 0%, ${tokens.primary.main} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${tokens.primary.main} 0%, ${tokens.primary.dark} 100%)`,
              boxShadow: tokens.shadow.card,
            },
          },
          outlinedPrimary: {
            borderColor: tokens.primary.main,
            color: tokens.primary.main,
            '&:hover': {
              borderColor: tokens.primary.dark,
              backgroundColor:
                mode === 'dark'
                  ? 'rgba(240, 68, 56, 0.08)'
                  : 'rgba(180, 35, 24, 0.06)',
            },
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '&.Mui-focusVisible': {
              outline: `3px solid ${mode === 'dark'
                ? 'rgba(240, 68, 56, 0.32)'
                : 'rgba(180, 35, 24, 0.22)'}`,
              outlineOffset: 2,
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            color: tokens.text.primary,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === 'dark' ? tokens.background.surfaceMuted : tokens.background.surface,
            borderRadius: 10,
            transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.border,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: tokens.primary.main,
              borderWidth: 1.5,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px ${mode === 'dark'
                ? 'rgba(240, 68, 56, 0.24)'
                : 'rgba(180, 35, 24, 0.14)'}`,
            },
          },
          input: {
            paddingTop: 11,
            paddingBottom: 11,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
          indicator: {
            height: 3,
            borderRadius: 999,
            backgroundColor: tokens.primary.main,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 600,
            color: tokens.text.secondary,
            '&.Mui-selected': {
              color: tokens.primary.main,
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor:
              mode === 'dark'
                ? tokens.background.surfaceStrong
                : tokens.text.primary,
            color: mode === 'dark' ? tokens.text.primary : '#ffffff',
            borderRadius: 10,
            boxShadow: tokens.shadow.card,
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          disableScrollLock: true,
        },
        styleOverrides: {
          paper: {
            borderRadius: 10,
            border: `1px solid ${tokens.border}`,
            boxShadow: tokens.shadow.raised,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${tokens.border}`,
            padding: '16px 20px 20px',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            '.MuiDialogTitle-root + &': {
              paddingTop: 20,
            },
          },
        },
      },
      MuiPopover: {
        defaultProps: {
          disableScrollLock: true,
        },
      },
      MuiMenu: {
        defaultProps: {
          disableScrollLock: true,
        },
      },
    },
  });
};
