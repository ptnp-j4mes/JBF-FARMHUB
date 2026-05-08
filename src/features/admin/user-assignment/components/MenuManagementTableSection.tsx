'use client';

import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import { MENU_TABLE_COLUMNS, MENU_TABLE_COLUMN_WIDTHS } from './menu-management.constants';
import { MenuManagementFlatRow } from './MenuManagementFlatRow';

interface MenuManagementTableSectionProps {
  title: string;
  borderColor: string;
  headerBackground: string;
  items: MenuListResponse[];
  isSaving: boolean;
  emptyMessage?: string;
  onEdit: (item: MenuListResponse) => void;
  onToggle: (item: MenuListResponse) => void;
  onDelete: (item: MenuListResponse) => void;
}

export function MenuManagementTableSection({
  title,
  borderColor,
  headerBackground,
  items,
  isSaving,
  emptyMessage = 'ไม่มีรายการ',
  onEdit,
  onToggle,
  onDelete,
}: MenuManagementTableSectionProps) {
  return (
    <Box sx={{ border: '1px solid', borderColor, borderRadius: 10, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: headerBackground, borderBottom: '1px solid', borderColor }}>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {MENU_TABLE_COLUMNS.map((column) => (
                <TableCell
                  key={column}
                  align="center"
                  sx={MENU_TABLE_COLUMN_WIDTHS[column] ? { width: MENU_TABLE_COLUMN_WIDTHS[column] } : undefined}
                >
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => (
                <MenuManagementFlatRow
                  key={item.id}
                  item={item}
                  isSaving={isSaving}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={MENU_TABLE_COLUMNS.length}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
