'use client';

/**
 * ActionMenu Component
 *
 * Reusable dropdown menu for row actions
 */

import { useState, MouseEvent } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: 'inherit' | 'error' | 'warning';
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
}

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: MouseEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleAction = (action: ActionMenuItem, event: MouseEvent) => {
    event.stopPropagation();
    handleClose();
    action.onClick();
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 16px 40px rgba(20,20,20,0.10)',
            overflow: 'hidden',
          },
        }}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={(e) => handleAction(action, e)}
            disabled={action.disabled}
            sx={{
              color: action.color === 'error' ? 'error.main' : 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
