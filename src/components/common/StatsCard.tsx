/**
 * StatsCard Component
 * 
 * Reusable card for displaying statistics/metrics
 */

import { Card, CardContent, Typography, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}: StatsCardProps) {
  const theme = useTheme();
  const accent = theme.palette[color].main;
  return (
    <Card
      sx={{
        borderColor: 'divider',
        background: `linear-gradient(180deg, ${alpha(accent, 0.08)} 0%, ${theme.palette.background.paper} 60%)`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color="text.primary" fontWeight={800}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Typography
                variant="caption"
                color={trend.isPositive ? 'success.main' : 'error.main'}
                sx={{ mt: 1, display: 'block' }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color: accent, opacity: 0.22, fontSize: 48 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
