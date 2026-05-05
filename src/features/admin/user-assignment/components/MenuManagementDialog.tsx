'use client';

import { Alert, Dialog, DialogActions, DialogContent, MenuItem, Stack, TextField, Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { DialogTitleWithClose } from '@/components/common';
import type { MenuListResponse } from '@/features/admin/menu-management/types';
import type { MenuManagementFormState, MenuManagementDialogMode } from './menu-management.types';
import { resolveMenuIcon } from '@/lib/utils/menu-icons';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';

interface MenuManagementDialogProps {
  open: boolean;
  isSaving: boolean;
  mode: MenuManagementDialogMode;
  editing: MenuListResponse | null;
  initialForm: MenuManagementFormState;
  parentOptions: MenuListResponse[];
  onClose: () => void;
  onStartEditing: () => void;
  onSave: (form: MenuManagementFormState) => void | Promise<void>;
}

function getDialogTitle(mode: MenuManagementDialogMode): string {
  if (mode === 'create') return 'เพิ่มเมนู';
  if (mode === 'edit') return 'แก้ไขเมนู';
  return 'ดูรายละเอียดเมนู';
}

export function MenuManagementDialog({
  open,
  isSaving,
  mode,
  editing,
  initialForm,
  parentOptions,
  onClose,
  onStartEditing,
  onSave,
}: MenuManagementDialogProps) {
  const [draftForm, setDraftForm] = useState<MenuManagementFormState>(initialForm);

  useEffect(() => {
    setDraftForm(initialForm);
  }, [initialForm, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitleWithClose onClose={onClose}>
        {getDialogTitle(mode)}
      </DialogTitleWithClose>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {mode === 'view' && editing ? (
            <Alert severity="info">
              กดปุ่ม <strong>แก้ไข</strong> เพื่อปลดล็อกฟิลด์ก่อนบันทึก
            </Alert>
          ) : null}
          <TextField
            label="ชื่อเมนู (ไทย)"
            value={draftForm.labelTh}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, labelTh: event.target.value }))}
            required
            fullWidth
            disabled={mode === 'view'}
          />
          <TextField
            label="Code / Slug (เช่น operations.dashboard)"
            value={draftForm.code}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, code: event.target.value }))}
            helperText="แนะนำใช้จุดแยกโมดูล เช่น admin.user_assignment"
            fullWidth
            disabled={mode === 'view'}
          />
          <TextField
            select
            label="ประเภท (NodeType)"
            value={draftForm.nodeType}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, nodeType: event.target.value }))}
            fullWidth
            disabled={mode === 'view'}
          >
            <MenuItem value="Link">Link (หน้าจอ)</MenuItem>
            <MenuItem value="Folder">Folder (โฟลเดอร์เก็บเมนู)</MenuItem>
          </TextField>
          <TextField
            select
            label="อยู่ภายใต้โฟลเดอร์ (Parent)"
            value={draftForm.parentId ?? ''}
            onChange={(event) =>
              setDraftForm((prev) => ({
                ...prev,
                parentId: event.target.value ? Number(event.target.value) : null,
              }))
            }
            fullWidth
            disabled={mode === 'view'}
          >
            <MenuItem value="">เมนูหลัก (Root)</MenuItem>
            {parentOptions.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                {opt.labelTh}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              label="ไอคอน (Icon Key เช่น dashboard, settings)"
              value={draftForm.iconKey}
              onChange={(event) => setDraftForm((prev) => ({ ...prev, iconKey: event.target.value }))}
              disabled={mode === 'view'}
            />
            <Box
              sx={{
                width: 56,
                height: 56,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'primary.main',
                bgcolor: 'action.hover',
              }}
            >
              {resolveMenuIcon(draftForm.iconKey)}
            </Box>
          </Box>
          <TextField
            label="URL Path (เช่น /warehouse/stock)"
            value={draftForm.path}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, path: event.target.value }))}
            fullWidth
            helperText="สำหรับNodeType เป็น Link"
            disabled={mode === 'view'}
          />
          <TextField
            label="Active Path Prefix (เช่น /warehouse)"
            value={draftForm.activePathPrefix}
            onChange={(event) => setDraftForm((prev) => ({ ...prev, activePathPrefix: event.target.value }))}
            fullWidth
            helperText="ใช้ Highlight เมนูเมื่อ Path ปัจจุบันขึ้นต้นด้วยค่านี้"
            disabled={mode === 'view'}
          />
          <TextField
            label="Sort Order"
            value={draftForm.sortOrder}
            onChange={(event) =>
              setDraftForm((prev) => ({
                ...prev,
                sortOrder: Number.parseInt(event.target.value || '0', 10) || 0,
              }))
            }
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            fullWidth
            disabled={mode === 'view'}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={isSaving}>
          {mode === 'view' ? 'ปิด' : 'ยกเลิก'}
        </StockActionButton>
        {mode === 'view' && editing ? (
          <StockActionButton tone="info" onClick={onStartEditing} disabled={isSaving}>
            แก้ไข
          </StockActionButton>
        ) : (
          <StockActionButton tone="primary" onClick={() => onSave(draftForm)} disabled={isSaving}>
            บันทึก
          </StockActionButton>
        )}
      </DialogActions>
    </Dialog>
  );
}
