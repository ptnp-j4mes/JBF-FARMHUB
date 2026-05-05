'use client';

import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, TableRow } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import { MenuManagementRowCells } from './MenuManagementRowCells';

interface MenuManagementSortableRowProps {
  item: MenuListResponse;
  isSaving: boolean;
  onEdit: (item: MenuListResponse) => void;
  onToggle: (item: MenuListResponse) => void;
  onDelete: (item: MenuListResponse) => void;
  onCreateChild: (item: MenuListResponse) => void;
}

export function MenuManagementSortableRow({
  item,
  isSaving,
  onEdit,
  onToggle,
  onDelete,
  onCreateChild,
}: MenuManagementSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: item.nodeType === 'Folder' || isSaving,
  });

  return (
    <TableRow
      ref={setNodeRef}
      hover
      sx={{
        opacity: isDragging ? 0.7 : 1,
        backgroundColor: isDragging ? 'action.hover' : undefined,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <MenuManagementRowCells
        item={item}
        isSaving={isSaving}
        onEdit={onEdit}
        onToggle={onToggle}
        onDelete={onDelete}
        onCreateChild={onCreateChild}
        leadingCell={
          <Box
            {...attributes}
            {...listeners}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 1,
              color: 'text.secondary',
              cursor: isSaving ? 'not-allowed' : 'grab',
              '&:active': { cursor: 'grabbing' },
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            }}
            aria-label={`ลาก ${item.labelTh}`}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        }
      />
    </TableRow>
  );
}
