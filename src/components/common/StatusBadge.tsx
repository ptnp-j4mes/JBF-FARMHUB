/**
 * StatusBadge Component
 * 
 * Reusable status badge with color coding
 */

import { Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface StatusBadgeProps {
  label: string;
  type?: StatusType;
  size?: 'small' | 'medium';
}

const statusColorMap: Record<StatusType, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
  default: 'default',
};

export default function StatusBadge({ label, type = 'default', size = 'small' }: StatusBadgeProps) {
  const theme = useTheme();
  const color = statusColorMap[type];
  const palette =
    color === 'default'
      ? {
          bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          color: theme.palette.text.primary,
          borderColor: theme.palette.divider,
        }
      : {
          bgcolor: alpha(theme.palette[color].main, theme.palette.mode === 'dark' ? 0.16 : 0.1),
          color: theme.palette[color].dark ?? theme.palette[color].main,
          borderColor: alpha(theme.palette[color].main, 0.22),
        };

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: palette.bgcolor,
        color: palette.color,
        border: `1px solid ${palette.borderColor}`,
      }}
    />
  );
}
