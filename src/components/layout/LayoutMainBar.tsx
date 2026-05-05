'use client';

import { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SideMainBar from './SideMainBar';
import TopMainBar from './TopMainBar';
import ForcePasswordResetDialog from '@/features/auth/components/ForcePasswordResetDialog';
import {
  SIDEMENU_LAYOUT_CONSTANTS,
  SIDEMENU_TRANSITION_CONSTANTS,
} from '@/core/theme/sidemenu-master-theme';

export default function LayoutMainBar({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const desktopDrawerWidth = sidebarCollapsed
    ? SIDEMENU_LAYOUT_CONSTANTS.sidebarCollapsedWidth
    : SIDEMENU_LAYOUT_CONSTANTS.sidebarWidth;

  const handleMobileDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleSidebarToggle = () => {
    if (isMobile) {
      handleMobileDrawerToggle();
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  const isDark = theme.palette.mode === 'dark';
  const desktopLayoutGap = theme.spacing(2);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 1, md: 2 },
        bgcolor: 'background.default',
      }}
    >
      {/* Prism Background Effect */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: 400,
            height: 400,
            backgroundColor: isDark
              ? 'rgba(4, 120, 87, 0.3)'
              : 'rgba(167, 243, 208, 0.5)',
            borderRadius: '50%',
            mixBlendMode: 'multiply',
            filter: 'blur(100px)',
            opacity: isDark ? 0.4 : 0.7,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 500,
            height: 500,
            backgroundColor: isDark
              ? 'rgba(4, 120, 87, 0.25)'
              : 'rgba(220, 252, 231, 0.6)',
            borderRadius: '50%',
            mixBlendMode: 'multiply',
            filter: 'blur(120px)',
            opacity: isDark ? 0.35 : 0.7,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '15%',
            width: 300,
            height: 300,
            backgroundColor: isDark
              ? 'rgba(4, 120, 87, 0.2)'
              : 'rgba(204, 251, 241, 0.4)',
            borderRadius: '50%',
            mixBlendMode: 'multiply',
            filter: 'blur(80px)',
            opacity: isDark ? 0.3 : 0.6,
          }}
        />
      </Box>

      {/* Main Layout Container */}
      <Box
        sx={{
          display: 'block',
          height: { xs: 'calc(100dvh - 16px)', md: 'calc(100dvh - 32px)' },
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Sidebar */}
        <SideMainBar
          mobileOpen={mobileOpen}
          onDrawerToggle={handleMobileDrawerToggle}
          onToggleCollapse={handleSidebarToggle}
          drawerWidth={desktopDrawerWidth}
          collapsed={sidebarCollapsed}
          isMobile={isMobile}
        />

        {/* Main Content Area */}
        <Box
          id="main-content"
          component="main"
          sx={{
            width: { xs: '100%', sm: `calc(100% - ${desktopDrawerWidth}px - ${desktopLayoutGap})` },
            ml: { xs: 0, sm: `calc(${desktopDrawerWidth}px + ${desktopLayoutGap})` },
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
            transition: SIDEMENU_TRANSITION_CONSTANTS.sidebarWidth,
            willChange: 'width',
            height: '100%',
          }}
        >
          <TopMainBar onSidebarOpen={handleSidebarToggle} />

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              pb: 2,
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Global Modals for Authenticated Users */}
      <ForcePasswordResetDialog />
    </Box>
  );
}
