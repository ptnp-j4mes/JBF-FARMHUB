'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DialogTitleWithClose,
  FilterableSelectField,
  type FilterableSelectFieldOption,
} from '@/components/common';
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
import type {
  Farm,
  House,
  ScopeStatus,
  Silo,
  SiloFormData,
  Zone,
} from '../types';

type AddSiloDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: SiloFormData) => void;
  farms: Farm[];
  houses: House[];
  zones: Zone[];
  mode: 'create' | 'edit';
  initialData: Silo | null;
};

export default function AddSiloDialog({
  open,
  onClose,
  onSave,
  farms,
  houses,
  zones,
  mode,
  initialData,
}: AddSiloDialogProps) {
  const theme = useTheme();
  const dialogBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const [formData, setFormData] = useState<SiloFormData>({
    code: '',
    name: '',
    farmId: 0,
    houseId: 0,
    capacityKg: 14000,
    status: 'Active',
  });
  const [selectedFarmId, setSelectedFarmId] = useState<number>(0);

  const naturalTextSort = (left: string, right: string) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialData) {
      const farmId = farms.find((farm) => farm.name === initialData.farmName)?.id ?? 0;
      setSelectedFarmId(farmId);
      setFormData({
        code: initialData.code,
        name: initialData.name,
        farmId,
        houseId: initialData.houseId,
        capacityKg: initialData.capacityKg,
        status: initialData.status,
      });
      return;
    }

    setSelectedFarmId(0);
    setFormData({
      code: '',
      name: '',
      farmId: 0,
      houseId: 0,
      capacityKg: 14000,
      status: 'Active',
    });
  }, [farms, initialData, mode, open]);

  useEffect(() => {
    setFormData((prev) => {
      if (!selectedFarmId) {
        return { ...prev, farmId: 0, houseId: 0 };
      }

      const houseStillInFarm = houses.some((house) => {
        if (house.id !== prev.houseId) {
          return false;
        }

        const zone = zones.find((item) => item.id === house.zoneId);
        return zone ? zone.farmId === selectedFarmId : house.farmName === farms.find((farm) => farm.id === selectedFarmId)?.name;
      });

      if (houseStillInFarm) {
        return { ...prev, farmId: selectedFarmId };
      }

      return { ...prev, farmId: selectedFarmId, houseId: 0 };
    });
  }, [farms, houses, selectedFarmId, zones]);

  const availableHouses = useMemo(() => {
    if (!selectedFarmId) {
      return [];
    }

    return houses
      .filter((house) => {
        const zone = zones.find((item) => item.id === house.zoneId);
        if (zone) {
          return zone.farmId === selectedFarmId;
        }

        const farm = farms.find((item) => item.id === selectedFarmId);
        return house.farmName === farm?.name;
      })
      .sort((left, right) => {
        const zoneCompare = naturalTextSort(left.zoneName || '', right.zoneName || '');
        if (zoneCompare !== 0) {
          return zoneCompare;
        }

        return naturalTextSort(left.name, right.name);
      });
  }, [farms, houses, selectedFarmId, zones]);

  const farmOptions = useMemo<FilterableSelectFieldOption[]>(
    () =>
      farms.map((farm) => ({
        value: farm.id,
        label: farm.name,
        caption: `${farm.location} / ${farm.status}`,
        meta: { location: farm.location, status: farm.status },
      })),
    [farms],
  );

  const houseOptions = useMemo<FilterableSelectFieldOption[]>(
    () =>
      availableHouses.map((house) => ({
        value: house.id,
        label: house.name,
        caption: `${house.zoneName || 'ไม่มีโซน'} / ${house.status}`,
        meta: {
          zone: house.zoneName || 'ไม่มีโซน',
          status: house.status,
        },
      })),
    [availableHouses],
  );

  const selectedHouse = availableHouses.find((house) => house.id === formData.houseId) ?? null;
  const isFormValid =
    Boolean(formData.code.trim()) &&
    Boolean(formData.name.trim()) &&
    formData.farmId > 0 &&
    formData.houseId > 0 &&
    formData.capacityKg > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ borderBottom: `1px solid ${dialogBorder}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'แก้ไขไซโล' : 'เพิ่มไซโล'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          จัดการข้อมูลไซโลโดยอ้างอิงตามฟาร์มและโรงเรือน
        </Typography>
      </DialogTitleWithClose>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <FilterableSelectField
            label="ฟาร์ม"
            required
            value={selectedFarmId}
            options={farmOptions}
            onChange={(nextValue) => setSelectedFarmId(Number(nextValue))}
            searchPlaceholder="ค้นหาฟาร์ม..."
            filters={[
              { key: 'location', label: 'พื้นที่', allLabel: 'ทุกพื้นที่' },
              { key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' },
            ]}
          />

          <FilterableSelectField
            label="โรงเรือน"
            required
            disabled={!selectedFarmId}
            value={formData.houseId}
            options={houseOptions}
            onChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, houseId: Number(nextValue) }))
            }
            searchPlaceholder={selectedFarmId ? 'ค้นหาโรงเรือน...' : 'โปรดเลือกฟาร์มก่อน'}
            filters={[
              { key: 'zone', label: 'โซน', allLabel: 'ทุกโซน' },
              { key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' },
            ]}
          />

          <TextField
            label="โซน"
            value={selectedHouse?.zoneName || 'ไม่มีโซน'}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText="ระบบจะระบุโซนอัตโนมัติตามโรงเรือนที่เลือก"
          />

          <TextField
            label="รหัสไซโล"
            placeholder="เช่น JBF-ST-A-ST1-SILO"
            value={formData.code}
            onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
            fullWidth
            required
          />

          <TextField
            label="ชื่อไซโล"
            placeholder="เช่น ไซโล A-ST1"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
            required
          />

          <TextField
            label="ความจุ (กก.)"
            type="number"
            value={formData.capacityKg}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                capacityKg: Number(event.target.value),
              }))
            }
            fullWidth
            required
            inputProps={{ min: 0, step: '0.0001' }}
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
          onClick={() =>
            onSave({
              code: formData.code.trim().toUpperCase(),
              name: formData.name.trim(),
              farmId: formData.farmId,
              houseId: formData.houseId,
              capacityKg: formData.capacityKg,
              status: formData.status,
            })
          }
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {mode === 'edit' ? 'บันทึกการแก้ไข' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
