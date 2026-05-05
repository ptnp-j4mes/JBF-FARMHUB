'use client';

import { Box, Chip, Divider, Stack, Switch, TableCell, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import { resolveMenuIcon } from '@/lib/utils/menu-icons';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';

interface MenuManagementRowCellsProps {
  item: MenuListResponse;
  isSaving: boolean;
  onEdit: (item: MenuListResponse) => void;
  onToggle: (item: MenuListResponse) => void;
  onDelete: (item: MenuListResponse) => void;
  onCreateChild?: (item: MenuListResponse) => void;
  leadingCell?: ReactNode;
}

export function MenuManagementRowCells({
  item,
  isSaving,
  onEdit,
  onToggle,
  onDelete,
  onCreateChild,
  leadingCell,
}: MenuManagementRowCellsProps) {
  return (
    <>
      {leadingCell ? <TableCell sx={{ width: 48, pr: 0 }}>{leadingCell}</TableCell> : null}
      <TableCell align="center" sx={{ width: 80, pl: leadingCell ? 2 : undefined }}>
        {item.sortOrder}
      </TableCell>
      <TableCell sx={{ fontWeight: item.nodeType === 'Folder' ? 700 : 400, whiteSpace: 'nowrap' }}>
        {item.labelTh}
      </TableCell>
      <TableCell sx={{ width: 140 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: 'primary.main', display: 'flex', fontSize: '1.25rem' }}>
            {resolveMenuIcon(item.iconKey || undefined)}
          </Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', whiteSpace: 'nowrap' }}>
            {item.iconKey || '-'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {item.path || '-'}
        </Typography>
      </TableCell>
      <TableCell align="center" sx={{ width: 130 }}>
        <Chip
          size="small"
          color={item.isActive ? 'success' : 'default'}
          label={item.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
          variant="outlined"
          sx={{ whiteSpace: 'nowrap' }}
        />
      </TableCell>
      <TableCell align="right" sx={{ width: 180 }}>
        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center" sx={{ whiteSpace: 'nowrap' }}>
          <Switch
            checked={item.isActive}
            onChange={() => onToggle(item)}
            disabled={isSaving}
            size="small"
          />
          <Divider orientation="vertical" flexItem />
          <StockActionButton
            tone="info"
            size="small"
            shape="pill"
            onClick={() => onEdit(item)}
            disabled={isSaving}
          >
            แก้ไข
          </StockActionButton>
          {onCreateChild && item.nodeType === 'Folder' ? (
            <StockActionButton
              tone="success"
              size="small"
              shape="pill"
              onClick={() => onCreateChild(item)}
              disabled={isSaving}
            >
              เพิ่มเมนูย่อย
            </StockActionButton>
          ) : null}
          <Divider orientation="vertical" flexItem />
          <StockActionButton
            tone="danger"
            size="small"
            shape="pill"
            onClick={() => onDelete(item)}
            disabled={isSaving || !item.isActive}
          >
            ลบ
          </StockActionButton>
        </Stack>
      </TableCell>
    </>
  );
}
