'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import { MENU_TABLE_CHILD_COLUMNS, MENU_TABLE_COLUMN_WIDTHS } from './menu-management.constants';
import { MenuManagementSortableRow } from './MenuManagementSortableRow';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';

interface MenuManagementFolderAccordionProps {
  folder: MenuListResponse;
  children: MenuListResponse[];
  isSaving: boolean;
  isDirty: boolean;
  onToggle: (item: MenuListResponse) => void;
  onEdit: (item: MenuListResponse) => void;
  onDelete: (item: MenuListResponse) => void;
  onCreateChild: (item: MenuListResponse) => void;
  onSaveOrder: (folderId: number) => void;
}

export function MenuManagementFolderAccordion({
  folder,
  children,
  isSaving,
  isDirty,
  onToggle,
  onEdit,
  onDelete,
  onCreateChild,
  onSaveOrder,
}: MenuManagementFolderAccordionProps) {
  return (
    <Accordion
      key={folder.id}
      defaultExpanded
      disableGutters
      sx={{
        mt: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 10,
        overflow: 'hidden',
        '&:before': { display: 'none' },
        '&:first-of-type, &:last-of-type': { borderRadius: 10},
        '&.Mui-expanded': { margin: 0, mt: 1 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: 'action.hover',
          borderBottom: '1px solid',
          borderColor: 'divider',
          minHeight: 48,
          '& .MuiAccordionSummary-content': { my: 0.5 },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 1 }}>
          <Typography fontWeight={700} sx={{ flex: 1 }}>
            {folder.labelTh}
          </Typography>
          <Chip size="small" label={folder.code} variant="outlined" />
          <Chip size="small" label={`${children.length} รายการ`} color="primary" variant="outlined" />
          <Chip
            size="small"
            color={folder.isActive ? 'success' : 'default'}
            label={folder.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
            variant="outlined"
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              รายการย่อยภายใต้เมนูหลักนี้
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Switch
                checked={folder.isActive}
                onChange={() => onToggle(folder)}
                disabled={isSaving}
                size="small"
              />
              <Divider orientation="vertical" flexItem />
              <StockActionButton
                tone="info"
                size="small"
                shape="pill"
                onClick={() => onEdit(folder)}
                disabled={isSaving}
              >
                แก้ไขหมวดหลัก
              </StockActionButton>
              <StockActionButton
                tone="success"
                size="small"
                shape="pill"
                onClick={() => onCreateChild(folder)}
                disabled={isSaving}
              >
                เพิ่ม menu list ใต้หมวดนี้
              </StockActionButton>
              <Divider orientation="vertical" flexItem />
              <StockActionButton
                tone="warning"
                size="small"
                shape="pill"
                onClick={() => onSaveOrder(folder.id)}
                disabled={isSaving || !isDirty}
              >
                บันทึกลำดับ
              </StockActionButton>
            </Stack>
          </Stack>

          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10}}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {MENU_TABLE_CHILD_COLUMNS.map((column, index) => (
                    <TableCell
                      key={`${column}-${index}`}
                      align="center"
                      sx={MENU_TABLE_COLUMN_WIDTHS[column] ? { width: MENU_TABLE_COLUMN_WIDTHS[column] } : undefined}
                    >
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <SortableContext items={children.map((child) => child.id)} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {children.length > 0 ? (
                    children.map((item) => (
                      <MenuManagementSortableRow
                        key={item.id}
                        item={item}
                        isSaving={isSaving}
                        onEdit={onEdit}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onCreateChild={onCreateChild}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={MENU_TABLE_CHILD_COLUMNS.length}>
                        <Typography variant="body2" color="text.secondary">
                          ยังไม่มี menu list ใต้หมวดนี้
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </SortableContext>
            </Table>
          </TableContainer>

          <Divider />

          <Typography variant="caption" color="text.secondary">
            ลากเฉพาะ menu list ภายในหมวดเดียวกันเพื่อเปลี่ยนลำดับ แล้วกดบันทึกการจัดลำดับเพื่อยืนยัน
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
