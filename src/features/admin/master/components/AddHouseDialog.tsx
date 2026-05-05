'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  FilterableSelectField,
  DialogTitleWithClose,
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
import type { Farm, House, HouseFormData, Zone, ScopeStatus } from '../types';

type AddHouseDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: HouseFormData) => void;
  farms: Farm[];
  zones: Zone[];
  mode: 'create' | 'edit';
  initialData: House | null;
};

export default function AddHouseDialog({
  open,
  onClose,
  onSave,
  farms,
  zones,
  mode,
  initialData,
}: AddHouseDialogProps) {
  const theme = useTheme();
  const dialogBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const [formData, setFormData] = useState<HouseFormData>({
    name: '',
    farmId: 0,
    zoneId: 0,
    status: 'Active',
  });
  const [selectedFarmId, setSelectedFarmId] = useState<number>(0);

  useEffect(() => {
    setFormData((prev) => {
      if (!selectedFarmId) {
        return { ...prev, farmId: 0, zoneId: 0 };
      }
      const hasZoneInFarm = zones.some(
        (zone) => prev.zoneId > 0 && zone.id === prev.zoneId && zone.farmId === selectedFarmId,
      );
      if (hasZoneInFarm) {
        return { ...prev, farmId: selectedFarmId };
      }
      return { ...prev, farmId: selectedFarmId, zoneId: 0 };
    });
  }, [zones, selectedFarmId]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initialData) {
      const currentZone = zones.find((zone) => zone.id === initialData.zoneId);
      const farmIdFromZone = currentZone?.farmId;
      const farmIdFromName = farms.find((farm) => farm.name === initialData.farmName)?.id;
      const resolvedFarmId = farmIdFromZone ?? farmIdFromName ?? 0;
      setSelectedFarmId(resolvedFarmId);
      setFormData({
        name: initialData.name,
        farmId: resolvedFarmId,
        zoneId: initialData.zoneId > 0 ? initialData.zoneId : 0,
        status: initialData.status,
      });
      return;
    }
    setSelectedFarmId(0);
    setFormData({
      name: '',
      farmId: 0,
      zoneId: 0,
      status: 'Active',
    });
  }, [farms, initialData, mode, open, zones]);

  const availableZones = useMemo(
    () => (selectedFarmId ? zones.filter((zone) => zone.farmId === selectedFarmId) : []),
    [zones, selectedFarmId],
  );
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
  const zoneSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () => {
      if (!selectedFarmId) {
        return [];
      }
      const selectedFarmName = farms.find((farm) => farm.id === selectedFarmId)?.name ?? '-';
      return [
        {
          value: 0,
          label: '(ไม่มีโซน)',
          caption: `${selectedFarmName} / ไม่ระบุโซน`,
          meta: {
            farm: selectedFarmName,
            status: 'Active',
          },
        },
        ...availableZones.map((zone) => ({
          value: zone.id,
          label: zone.name,
          caption: `${zone.farmName} / ${zone.status}`,
          meta: {
            farm: zone.farmName,
            status: zone.status,
          },
        })),
      ];
    },
    [availableZones, farms, selectedFarmId],
  );
  const isFormValid = Boolean(formData.name.trim() && formData.farmId > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ borderBottom: `1px solid ${dialogBorder}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'แก้ไขโรงเรือน' : 'เพิ่มโรงเรือน'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {mode === 'edit'
            ? 'แก้ไขข้อมูลโรงเรือน'
            : 'สร้างข้อมูลโรงเรือนได้ทั้งแบบ ฟาร์ม > โซน > โรงเรือน หรือ ฟาร์ม > โรงเรือน'}
        </Typography>
      </DialogTitleWithClose>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={2}>
          <FilterableSelectField
            label="ฟาร์ม"
            required
            value={selectedFarmId}
            options={farmSelectOptions}
            onChange={(nextValue) => setSelectedFarmId(Number(nextValue))}
            searchPlaceholder="ค้นหาฟาร์ม..."
            filters={[
              { key: 'location', label: 'พื้นที่', allLabel: 'ทุกพื้นที่' },
              { key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' },
            ]}
          />

          <FilterableSelectField
            label="โซน"
            disabled={!selectedFarmId}
            value={formData.zoneId}
            options={zoneSelectOptions}
            onChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, zoneId: Number(nextValue) }))
            }
            searchPlaceholder={selectedFarmId ? 'ค้นหาโซน...' : 'โปรดเลือกฟาร์มก่อน'}
            filters={[{ key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' }]}
          />

          <TextField
            label="ชื่อโรงเรือน"
            placeholder="เช่น House A-03"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
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
              farmId: formData.farmId,
              zoneId: formData.zoneId,
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
