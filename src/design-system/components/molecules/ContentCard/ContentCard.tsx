import { Paper, type SxProps, type Theme } from '@mui/material';
import type { ResponsiveStyleValue } from '@mui/system';
import type { ReactNode } from 'react';

interface ContentCardProps {
  children: ReactNode;
  borderColor?: string;
  backgroundColor?: string;
  padding?: ResponsiveStyleValue<number | string>;
  paddingTop?: ResponsiveStyleValue<number | string>;
  paddingX?: ResponsiveStyleValue<number | string>;
  paddingBottom?: ResponsiveStyleValue<number | string>;
  sx?: SxProps<Theme>;
}

export default function ContentCard({
  children,
  borderColor,
  backgroundColor,
  padding,
  paddingTop = { xs: 2.5, md: 3.25 },
  paddingX = { xs: 2.5, md: 3.25 },
  paddingBottom = { xs: 3, md: 3.75 },
  sx,
}: ContentCardProps) {
  const extraSx = Array.isArray(sx) ? sx : sx ? [sx] : [];
  const spacingSx =
    padding !== undefined
      ? { p: padding }
      : { pt: paddingTop, px: paddingX, pb: paddingBottom };

  return (
    <Paper
      elevation={0}
      sx={[
        {
          borderRadius: 2,
          border: '1px solid',
          borderColor: borderColor ?? 'divider',
          bgcolor: backgroundColor ?? 'background.paper',
          boxShadow: 'none',
          ...spacingSx,
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          alignContent: 'flex-start',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        },
        ...extraSx,
      ]}
    >
      {children}
    </Paper>
  );
}
