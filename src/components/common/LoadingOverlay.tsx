/**
 * LoadingOverlay Component
 * 
 * Full page loading overlay
 */

import { Backdrop, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export default function LoadingOverlay({ open, message = 'กำลังโหลด...' }: LoadingOverlayProps) {
  return (
    <Backdrop
      sx={{
        color: 'text.primary',
        backdropFilter: 'blur(4px)',
        backgroundColor: alpha('#ffffff', 0.82),
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2,
      }}
      open={open}
    >
      <CircularProgress color="primary" />
      <Typography variant="body1" fontWeight={700}>
        {message}
      </Typography>
    </Backdrop>
  );
}
