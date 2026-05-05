/**
 * NotificationBell Component
 * 
 * Notification icon with badge and dropdown
 */

'use client';

import { useState, type MouseEvent } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Tooltip,
} from '@mui/material';
import { Notifications, Circle } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
  onViewAll?: () => void;
  tooltipTitle?: string;
  iconButtonSx?: SxProps<Theme>;
}

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
  tooltipTitle,
  iconButtonSx,
}: NotificationBellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: number) => {
    onMarkAsRead?.(id);
    handleClose();
  };

  return (
    <>
      <Tooltip title={tooltipTitle ?? 'การแจ้งเตือน'}>
        <IconButton onClick={handleClick} color="inherit" sx={iconButtonSx}>
          <Badge badgeContent={unreadCount} color="error">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 360, maxHeight: 400 },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">การแจ้งเตือน</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={onMarkAllAsRead}>
              อ่านทั้งหมด
            </Button>
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              ไม่มีการแจ้งเตือน
            </Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                {!notification.isRead && (
                  <Circle sx={{ fontSize: 8, color: 'primary.main', mt: 0.5 }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.createdAt}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))
        )}

        <Divider />

        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" fullWidth onClick={onViewAll}>
            ดูทั้งหมด
          </Button>
        </Box>
      </Menu>
    </>
  );
}
