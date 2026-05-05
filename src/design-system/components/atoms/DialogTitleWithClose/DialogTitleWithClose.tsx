import type { ElementType, ReactNode } from 'react';
import { CloseOutlined } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';
import { DialogTitle, IconButton } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type DialogTitleWithCloseProps = {
  children: ReactNode;
  onClose: () => void;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  component?: ElementType;
  variant?: 'master' | 'plain';
};

export default function DialogTitleWithClose({
  children,
  onClose,
  disabled = false,
  sx,
  component,
  variant = 'master',
}: DialogTitleWithCloseProps) {
  const theme = useTheme();
  const masterSx: SxProps<Theme> = {
    textAlign: 'center',
    bgcolor: theme.palette.primary.main,
    color: '#fff',
    borderBottom: `1px solid ${alpha('#ffffff', 0.16)}`,
    boxShadow: `inset 0 -1px 0 ${alpha(theme.palette.primary.dark, 0.18)}`,
    '& .MuiIconButton-root': {
      color: '#fff',
    },
  };

  const plainSx: SxProps<Theme> = {
    borderBottom: `1px solid ${theme.palette.divider}`,
  };

  return (
    <DialogTitle
      component={component ?? 'div'}
      sx={{
        position: 'relative',
        pr: 7,
        ...(variant === 'master' ? masterSx : plainSx),
        ...sx,
      }}
    >
      {children}
      <IconButton
        aria-label="close"
        size="small"
        onClick={onClose}
        disabled={disabled}
        sx={{
          position: 'absolute',
          top: 10,
          right: 12,
          color: variant === 'master' ? '#fff' : 'text.secondary',
        }}
      >
        <CloseOutlined fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
}
