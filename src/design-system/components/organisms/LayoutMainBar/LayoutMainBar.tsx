'use client';

import { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SideMainBar from '@/design-system/components/organisms/SideMainBar/SideMainBar';
import TopMainBar from '@/design-system/components/organisms/TopMainBar/TopMainBar';
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
