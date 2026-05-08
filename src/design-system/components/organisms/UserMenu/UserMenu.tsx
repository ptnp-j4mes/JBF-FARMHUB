/**
 * UserMenu Component
 * 
 * User profile menu with dropdown
 */

'use client';

import { useState } from 'react';
import { IconButton, Menu, MenuItem, Avatar, Typography, Divider, Box } from '@mui/material';
import { Person, Settings, Logout } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { useTheme, alpha } from '@mui/material/styles';

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

export default function UserMenu({ userName, userEmail, avatarUrl }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    router.push('/profile');
    handleClose();
  };

  const handleSettings = () => {
    router.push('/settings');
    handleClose();
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/auth/login');
    handleClose();
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Avatar
          src={avatarUrl}
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.primary.main,
            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.22)}`,
          }}
        >
          {userName?.charAt(0) || <Person />}
        </Avatar>
      </IconButton>
      
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
          sx: {
            mt: 1,
            borderRadius: '10px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 16px 36px rgba(0, 0, 0, 0.38)'
                : '0 16px 36px rgba(18, 54, 37, 0.10)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {userName || 'ผู้ใช้'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userEmail || ''}
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleProfile}>
          <Person fontSize="small" sx={{ mr: 1 }} />
          โปรไฟล์
        </MenuItem>
        
        <MenuItem onClick={handleSettings}>
          <Settings fontSize="small" sx={{ mr: 1 }} />
          ตั้งค่า
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 1 }} />
          ออกจากระบบ
        </MenuItem>
      </Menu>
    </>
  );
}
