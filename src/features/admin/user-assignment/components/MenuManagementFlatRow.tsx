'use client';

import { TableRow } from '@mui/material';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import { MenuManagementRowCells } from './MenuManagementRowCells';

interface MenuManagementFlatRowProps {
  item: MenuListResponse;
  isSaving: boolean;
  onEdit: (item: MenuListResponse) => void;
  onToggle: (item: MenuListResponse) => void;
  onDelete: (item: MenuListResponse) => void;
}

export function MenuManagementFlatRow({
  item,
  isSaving,
  onEdit,
  onToggle,
  onDelete,
}: MenuManagementFlatRowProps) {
  return (
    <TableRow hover>
      <MenuManagementRowCells
        item={item}
        isSaving={isSaving}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
      />
    </TableRow>
  );
}
