/**
 * EmptyState Component
 * 
 * Reusable empty state display
 */

import { Box, Typography, Button } from '@mui/material';
import { Inbox } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title = 'ไม่มีข้อมูล',
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          mb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        }}
      >
        {icon || <Inbox sx={{ fontSize: 34, color: 'primary.main' }} />}
      </Box>
      
      <Typography variant="h6" color="text.primary" gutterBottom fontWeight={800}>
        {title}
      </Typography>
      
      {message && (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2, maxWidth: 520 }}>
          {message}
        </Typography>
      )}
      
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2, px: 2.5 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
