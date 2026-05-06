'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FilterableSelectField,
  DialogTitleWithClose,
  type FilterableSelectFieldOption,
} from '@/components/common';
import { FormField, FormSelect } from '@/components/forms';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Farm, Phase, PhaseFormData, ScopeStatus } from '@/features/admin/user-assignment/types';

type AddPhaseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: PhaseFormData) => void;
  farms: Farm[];
  mode: 'create' | 'edit';
  initialData: Phase | null;
};

export default function AddPhaseDialog({
  open,
  onClose,
  onSave,
  farms,
  mode,
  initialData,
}: AddPhaseDialogProps) {
  const theme = useTheme();
  const dialogBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const [formData, setFormData] = useState<PhaseFormData>({
    name: '',
    farmId: 0,
    status: 'Active',
  });

  const farmSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () =>
      farms.map((farm) => ({
        value: farm.id,
        label: farm.name,
        caption: `${farm.location} / ${farm.status}`,
        meta: {
          location: farm.location,
          status: farm.status,
        },
      })),
    [farms],
  );

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        farmId: initialData.farmId,
        status: initialData.status,
      });
      return;
    }
    setFormData({
      name: '',
      farmId: 0,
      status: 'Active',
    });
  }, [initialData, mode, open]);

  const isFormValid = Boolean(formData.name.trim() && formData.farmId > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ borderBottom: `1px solid ${dialogBorder}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'แก้ไขเฟส' : 'เพิ่มเฟส'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {mode === 'edit' ? 'แก้ไขข้อมูลเฟส' : 'สร้างข้อมูลเฟสภายใต้ฟาร์ม'}
        </Typography>
      </DialogTitleWithClose>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <FilterableSelectField
            label="ฟาร์ม"
            required
            value={formData.farmId}
            options={farmSelectOptions}
            onChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, farmId: Number(nextValue) }))
            }
            searchPlaceholder="ค้นหาฟาร์ม..."
            filters={[
              { key: 'location', label: 'พื้นที่', allLabel: 'ทุกพื้นที่' },
              { key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' },
            ]}
          />
          <FormField
            label="ชื่อเฟส"
            placeholder="เช่น Phase 1"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            required
          />
          <FormSelect
            label="สถานะ"
            value={formData.status}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, status: event.target.value as ScopeStatus }))
            }
            options={[
              { value: 'Active', label: 'ใช้งาน' },
              { value: 'Inactive', label: 'ไม่ใช้งาน' },
            ]}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${dialogBorder}` }}>
        <Button
          variant="contained"
          disabled={!isFormValid}
          onClick={() => {
            onSave({
              name: formData.name.trim(),
              farmId: formData.farmId,
              status: formData.status,
            });
          }}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {mode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
