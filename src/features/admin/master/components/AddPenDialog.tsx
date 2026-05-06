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
import type {
  Farm,
  House,
  Pen,
  PenFormData,
  Zone,
  ScopeStatus,
} from '@/features/admin/user-assignment/types';

type AddPenDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: PenFormData) => void;
  farms: Farm[];
  zones: Zone[];
  houses: House[];
  mode: 'create' | 'edit';
  initialData: Pen | null;
};

export default function AddPenDialog({
  open,
  onClose,
  onSave,
  farms,
  zones,
  houses,
  mode,
  initialData,
}: AddPenDialogProps) {
  const theme = useTheme();
  const dialogBorder = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.82 : 0.6);
  const [formData, setFormData] = useState<PenFormData>({
    name: '',
    houseId: 0,
    status: 'Active',
  });
  const [selectedFarmId, setSelectedFarmId] = useState<number>(0);
  const [selectedZoneId, setSelectedZoneId] = useState<number>(0);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && initialData) {
      const currentHouse = houses.find((house) => house.id === initialData.houseId);
      const currentZone = currentHouse
        ? zones.find((zone) => zone.id === currentHouse.zoneId)
        : zones.find((zone) => zone.name === initialData.zoneName);
      const currentFarm = currentZone
        ? farms.find((farm) => farm.id === currentZone.farmId)
        : farms.find((farm) => farm.name === initialData.farmName);

      setSelectedFarmId(currentFarm?.id ?? 0);
      setSelectedZoneId(currentZone?.id ?? 0);
      setFormData({
        name: initialData.name,
        houseId: initialData.houseId,
        status: initialData.status,
      });
      return;
    }

    setSelectedFarmId(0);
    setSelectedZoneId(0);
    setFormData({
      name: '',
      houseId: 0,
      status: 'Active',
    });
  }, [farms, houses, initialData, mode, open, zones]);

  useEffect(() => {
    setSelectedZoneId((prevZoneId) => {
      if (!selectedFarmId) {
        return 0;
      }

      const hasZoneInFarm = zones.some(
        (zone) => zone.id === prevZoneId && zone.farmId === selectedFarmId,
      );
      return hasZoneInFarm ? prevZoneId : 0;
    });
  }, [zones, selectedFarmId]);

  useEffect(() => {
    setFormData((prev) => {
      if (!selectedFarmId) {
        return { ...prev, houseId: 0 };
      }

      const selectedFarmName = farms.find((farm) => farm.id === selectedFarmId)?.name ?? '';
      const hasHouseInZone = houses.some((house) => {
        if (house.id !== prev.houseId) {
          return false;
        }
        if (selectedZoneId > 0) {
          return house.zoneId === selectedZoneId;
        }
        return house.zoneId === 0 && house.farmName === selectedFarmName;
      });
      return hasHouseInZone ? prev : { ...prev, houseId: 0 };
    });
  }, [farms, houses, selectedFarmId, selectedZoneId]);

  const availableZones = useMemo(
    () => (selectedFarmId ? zones.filter((zone) => zone.farmId === selectedFarmId) : []),
    [zones, selectedFarmId],
  );

  const availableHouses = useMemo(
    () => {
      if (!selectedFarmId) {
        return [];
      }
      const selectedFarmName = farms.find((farm) => farm.id === selectedFarmId)?.name ?? '';
      if (selectedZoneId > 0) {
        return houses.filter((house) => house.zoneId === selectedZoneId);
      }
      return houses.filter(
        (house) => house.zoneId === 0 && house.farmName === selectedFarmName,
      );
    },
    [farms, houses, selectedFarmId, selectedZoneId],
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

  const houseSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () =>
      availableHouses.map((house) => ({
        value: house.id,
        label: house.name,
        caption: `${house.zoneName} / ${house.status}`,
        meta: {
          zone: house.zoneName,
          status: house.status,
        },
      })),
    [availableHouses],
  );

  const isFormValid = Boolean(formData.name.trim() && formData.houseId > 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ borderBottom: `1px solid ${dialogBorder}`, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'edit' ? 'แก้ไขคอก' : 'เพิ่มคอก'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {mode === 'edit'
            ? 'แก้ไขข้อมูลคอก'
            : 'สร้างข้อมูลคอกได้ทั้งแบบ ฟาร์ม > โซน > โรงเรือน > คอก หรือ ฟาร์ม > โรงเรือน > คอก'}
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
            value={selectedZoneId}
            options={zoneSelectOptions}
            onChange={(nextValue) => setSelectedZoneId(Number(nextValue))}
            searchPlaceholder={selectedFarmId ? 'ค้นหาโซน...' : 'โปรดเลือกฟาร์มก่อน'}
            filters={[{ key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' }]}
          />

          <FilterableSelectField
            label="โรงเรือน"
            required
            disabled={!selectedFarmId}
            value={formData.houseId}
            options={houseSelectOptions}
            onChange={(nextValue) =>
              setFormData((prev) => ({ ...prev, houseId: Number(nextValue) }))
            }
            searchPlaceholder={selectedFarmId ? 'ค้นหาโรงเรือน...' : 'โปรดเลือกฟาร์มก่อน'}
            filters={[{ key: 'status', label: 'สถานะ', allLabel: 'ทุกสถานะ' }]}
          />

          <FormField
            label="ชื่อคอก"
            placeholder="เช่น Pen A-01"
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
              houseId: formData.houseId,
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
