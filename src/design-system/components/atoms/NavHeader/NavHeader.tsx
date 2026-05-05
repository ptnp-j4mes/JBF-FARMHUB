// components/sidebar/NavHeader.tsx
import { Box, Typography } from '@mui/material';

interface NavHeaderProps {
  title: string;
}

export default function NavHeader({ title }: NavHeaderProps) {
  return (
    <Box sx={{ px: 2, mb: 1.5 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          display: 'block',
          fontSize: '0.75rem',
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}
