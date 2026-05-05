'use client';

import React, { useMemo } from 'react';
import { ManageAccountsRounded } from '@mui/icons-material';
import { DialogTitleWithClose } from '@/components/common';
import {
  Box,
  ButtonBase,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { RoleFormState } from '../types';
import { toRoleCode } from '../utils';

type RoleFormDialogProps = {
  open: boolean;
  editingRoleId: string | null;
  form: RoleFormState;
  currentRolePermissions?: string[];
  allPermissions?: Array<{
    id: number;
    code: string;
    description: string;
    isActive?: boolean;
  }>;
  selectedPermissionCodes?: string[];
  permissionsLoading?: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onFormChange: React.Dispatch<React.SetStateAction<RoleFormState>>;
  onTogglePermission?: (permissionCode: string) => void;
};

export default function RoleFormDialog({
  open,
  editingRoleId,
  form,
  currentRolePermissions = [],
  allPermissions = [],
  selectedPermissionCodes = [],
  permissionsLoading = false,
  onClose,
  onSubmit,
  onFormChange,
  onTogglePermission,
}: RoleFormDialogProps) {
  const selectedSet = new Set(selectedPermissionCodes.map((code) => code.trim()));
  const permissionByCode = useMemo(
    () =>
      new Map(
        allPermissions.map((permission) => [
          permission.code.trim(),
          permission.description?.trim() ?? '',
        ]),
      ),
    [allPermissions],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ fontWeight: 800 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ManageAccountsRounded />
          <span>{editingRoleId ? 'แก้ไขบทบาท' : 'เพิ่มบทบาท'}</span>
        </Stack>
      </DialogTitleWithClose>
      <Divider />

      <Box component="form" onSubmit={onSubmit}>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            label="ชื่อบทบาท"
            required
            value={form.name}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                name: event.target.value,
                code: toRoleCode(event.target.value),
              }))
            }
          />

          <TextField
            label="โค้ดบทบาท"
            required
            value={form.code}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                code: toRoleCode(event.target.value),
              }))
            }
            disabled
            helperText="คำนวณจากชื่อบทบาท (backend ยังไม่รองรับ field นี้)"
          />

          <TextField
            label="คำอธิบาย"
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) =>
              onFormChange((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
          />

          {editingRoleId && (
            <Box sx={{ mt: 0.75, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                จัดการสิทธิ์จากคลังสิทธิทั้งหมด ({allPermissions.length}) | Active ของ role ({selectedPermissionCodes.length})
              </Typography>
              <Box sx={{ mt: 1, maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                {permissionsLoading && (
                  <Typography variant="caption" color="text.secondary">
                    กำลังโหลดสิทธิ์...
                  </Typography>
                )}

                {!permissionsLoading && allPermissions.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ไม่พบข้อมูลสิทธิ์
                  </Typography>
                )}

                {!permissionsLoading && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {allPermissions.map((permission) => (
                      <ButtonBase
                        key={permission.id}
                        disabled={permission.isActive === false}
                        onClick={() => onTogglePermission?.(permission.code)}
                        sx={{
                          display: 'inline-flex',
                          maxWidth: '100%',
                          px: 0.6,
                          py: 0.1,
                          borderRadius: 0.75,
                          opacity: permission.isActive === false ? 0.45 : 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.2,
                            py: 0.45,
                            borderRadius: 999,
                            border: '1px solid',
                            borderColor: selectedSet.has(permission.code.trim()) ? 'primary.main' : 'divider',
                            bgcolor: selectedSet.has(permission.code.trim()) ? 'primary.main' : 'background.paper',
                            color: selectedSet.has(permission.code.trim()) ? 'primary.contrastText' : 'text.secondary',
                            fontFamily: 'monospace',
                            fontWeight: selectedSet.has(permission.code.trim()) ? 700 : 500,
                            fontSize: '0.72rem',
                            lineHeight: 1.1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {permission.code}
                        </Box>
                      </ButtonBase>
                    ))}
                  </Box>
                )}
              </Box>

              {currentRolePermissions.length > 0 && (
                <Box sx={{ mt: 0.8, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">
                    สิทธิ์ปัจจุบัน
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentRolePermissions.map((code, index) => {
                      const normalizedCode = code.trim();
                      const description = permissionByCode.get(normalizedCode);
                      const label = description ? `${normalizedCode} · ${description}` : normalizedCode;

                      return (
                        <Chip
                          key={`${normalizedCode}-${index}`}
                          label={label}
                          size="small"
                          variant="outlined"
                          title={normalizedCode}
                          sx={{
                            maxWidth: '100%',
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button type="submit" variant="contained">
            {editingRoleId ? 'บันทึกการแก้ไข' : 'บันทึก'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
