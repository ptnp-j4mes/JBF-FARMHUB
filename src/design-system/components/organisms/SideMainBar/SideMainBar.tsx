'use client';

import { Box, Drawer } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SideMenu from '@/design-system/components/organisms/SideMenu/SideMenu';
import {
  createSidemenuMasterTheme,
  SIDEMENU_LAYOUT_CONSTANTS,
  SIDEMENU_TRANSITION_CONSTANTS,
} from '@/core/theme/sidemenu-master-theme';

interface SideMainBarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
  isMobile: boolean;
}

export default function SideMainBar({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
  onToggleCollapse,
  collapsed,
  isMobile,
}: SideMainBarProps) {
  const theme = useTheme();
  const desktopInset = theme.spacing(2);
  const sidemenuTokens = createSidemenuMasterTheme(theme.palette.mode);

  return (
    <Box component="nav" aria-label="sidebar navigation">
      {/* Mobile Drawer (overlay) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEMENU_LAYOUT_CONSTANTS.sidebarWidth,
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...sidemenuTokens.glass.sidebar,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(229, 229, 229, 0.9)'}`,
            borderRadius: 10,
          },
        }}
      >
        <SideMenu
          mobile
          onClose={onDrawerToggle}
          onToggleCollapse={onDrawerToggle}
        />
      </Drawer>

      {/* Desktop - Floating Glass Panel */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          position: 'fixed',
          top: { sm: desktopInset },
          left: { sm: desktopInset },
          bottom: { sm: desktopInset },
          flexDirection: 'column',
          width: drawerWidth,
          height: { sm: `calc(100dvh - ${theme.spacing(4)})` },
          flexShrink: 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          zIndex: 10,
          ...sidemenuTokens.glass.sidebar,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(229, 229, 229, 0.9)'}`,
          transition: SIDEMENU_TRANSITION_CONSTANTS.sidebarWidth,
          willChange: 'width',
        }}
      >
        <SideMenu
          mobile={false}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </Box>
    </Box>
  );
}
