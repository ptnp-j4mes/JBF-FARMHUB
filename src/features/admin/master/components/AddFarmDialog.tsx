'use client';

import React, { useEffect, useState } from 'react';
import { DialogTitleWithClose } from '@/components/common';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import type { Farm, FarmFormData, ScopeStatus } from '../types';

type AddFarmDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: FarmFormData) => void;
  mode: 'create' | 'edit';
  initialData: Farm | null;
};

export default function AddFarmDialog({
  open,
  onClose,
  onSave,
  mode,
  initialData,
}: AddFarmDialogProps) {
  const theme = useTheme();
  const dialogBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const [formData, setFormData] = useState<FarmFormData>({
    name: '',
    code: '',
    location: '',
    status: 'Active',
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        location: initialData.location,
        status: initialData.status,
      });
      return;
    }
    setFormData({
      name: '',
      code: '',
      location: '',
      status: 'Active',
    });
  }, [initialData, mode, open]);

  const isFormValid = Boolean(formData.name.trim() && formData.code.trim() && formData.location.trim());

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ borderBottom: `1px solid ${dialogBorder}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'แก้ไขฟาร์ม' : 'เพิ่มฟาร์ม'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {mode === 'edit' ? 'แก้ไขข้อมูลฟาร์ม' : 'สร้างข้อมูลฟาร์มใหม่'}
        </Typography>
      </DialogTitleWithClose>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="รหัสฟาร์ม"
            placeholder="เช่น NF-001"
            value={formData.code}
            onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="ชื่อฟาร์ม"
            placeholder="เช่น North Farm"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="พื้นที่"
            placeholder="เช่น Northern Region"
            value={formData.location}
            onChange={(event) => setFormData((prev) => ({ ...prev, location: event.target.value }))}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>สถานะ</InputLabel>
            <Select
              value={formData.status}
              label="สถานะ"
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, status: event.target.value as ScopeStatus }))
              }
            >
              <MenuItem value="Active">ใช้งาน</MenuItem>
              <MenuItem value="Inactive">ไม่ใช้งาน</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: `1px solid ${dialogBorder}` }}>
        <Button
          variant="contained"
          disabled={!isFormValid}
          onClick={() => {
            onSave({
              name: formData.name.trim(),
              code: formData.code.trim(),
              location: formData.location.trim(),
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
