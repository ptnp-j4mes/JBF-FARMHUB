/**
 * ActionMenu Component
 * 
 * Reusable dropdown menu for row actions
 */

import { useState, MouseEvent } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
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
      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={(e) => handleAction(action, e)}
            disabled={action.disabled}
          >
            {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
            <ListItemText
              primary={action.label}
              sx={{ color: action.color === 'error' ? 'error.main' : 'inherit' }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
