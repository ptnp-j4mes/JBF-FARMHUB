/**
 * PageHeader Component
 * 
 * Reusable page header with title and action buttons
 */

import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';
import MainBreadcrumb from '@/components/layout/MainBreadcrumb';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBreadcrumb?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  showBreadcrumb = true,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 3,
        pb: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {showBreadcrumb ? <MainBreadcrumb /> : null}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" fontWeight={800}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 900 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions ? <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box> : null}
      </Box>
    </Box>
  );
}
