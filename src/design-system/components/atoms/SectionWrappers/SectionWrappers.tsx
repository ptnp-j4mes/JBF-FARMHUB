import type { ReactNode } from 'react';
import { Box } from '@mui/material';

export const StatsWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: { xs: 1.5, md: 2.5 }, pb: { xs: 0, md: 0 } }}>{children}</Box>
);

export const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>{children}</Box>
);

export const PageRootWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: 0, bgcolor: '#f2f3f2' }}>{children}</Box>
);
