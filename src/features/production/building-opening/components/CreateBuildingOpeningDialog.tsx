'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DialogTitleWithClose } from '@/components/common';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import { buildingOpeningService } from '../services/building-opening.service';
import type {
  BuildingOpeningHouseOption,
  BuildingOpeningResponse,
  CreateBuildingOpeningRequest,
} from '../types';
import {
  buildingOpeningDialogActionsSx,
  buildingOpeningDialogContentSx,
  buildingOpeningDialogPaperSx,
  buildingOpeningDialogTitleSx,
  buildingOpeningErrorAlertSx,
  buildingOpeningFieldsetSx,
  buildingOpeningInputSx,
  buildingOpeningLegendSx,
  buildingOpeningPrimaryButtonSx,
} from './BuildingOpeningWorkspaceChrome';

type CreateBuildingOpeningDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  mode?: 'create' | 'edit';
  initialData?: BuildingOpeningResponse | null;
};

function parseNumberInput(value: string): number | null {
  if (!/^\d*(\.\d*)?$/.test(value)) return null;
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDisplayDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function CreateBuildingOpeningDialog({
  open,
  onClose,
  onSaved,
  mode = 'create',
  initialData = null,
}: CreateBuildingOpeningDialogProps) {
  const isEdit = mode === 'edit';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [pigSources, setPigSources] = useState<Array<{ sourceCode: string; sourceName: string }>>([]);
  const [houses, setHouses] = useState<BuildingOpeningHouseOption[]>([]);
  const [facilityId, setFacilityId] = useState(0);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedHouseId, setSelectedHouseId] = useState(0);
  const [houseCode, setHouseCode] = useState('');
  const [houseName, setHouseName] = useState('');
  const [zone, setZone] = useState('');
  const [generation, setGeneration] = useState('');
  const [pigSource, setPigSource] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [expectedReceiveDate, setExpectedReceiveDate] = useState('');
  const [avgWeight, setAvgWeight] = useState(0);
  const [pricePerHead, setPricePerHead] = useState(0);
  const [remarks, setRemarks] = useState('');
  const facilityOptionsRef = useRef<Array<{ id: number; code: string; name: string }>>([]);

  const resolveFacilitySelection = (
    options: Array<{ id: number; code: string; name: string }>,
    preferredId: number | null | undefined,
    preferredCode: string | null | undefined,
  ) => {
    if (!options.length) return null;

    const normalizedCode = (preferredCode || '').trim().toUpperCase();
    const byId = options.find((item) => item.id === preferredId);
    if (byId) return byId;

    const byCode = options.find((item) => (item.code || '').trim().toUpperCase() === normalizedCode);
    if (byCode) return byCode;

    // Support cases where current context is zone/house code, e.g. JBF-NN-Z01 -> JBF-NN
    if (normalizedCode) {
      const byPrefix = options.find((item) => normalizedCode.startsWith(`${(item.code || '').trim().toUpperCase()}-`));
      if (byPrefix) return byPrefix;
    }

    return options[0];
  };

  useEffect(() => {
    if (!open) return;
    let active = true;

    const loadOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const options = await buildingOpeningService.getCreateOptions();
        if (!active) return;

        const optionRows = options.facilities.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
        }));
        facilityOptionsRef.current = optionRows;
        setFacilities(optionRows);
        setPigSources(
          (options.pigSources ?? []).map((item) => ({
            sourceCode: item.sourceCode,
            sourceName: item.sourceName,
          })),
        );
        setHouses(options.houses ?? []);

        if (isEdit && initialData) {
          setFacilityId(initialData.facilityId);
          setSelectedZone(initialData.zone || '');
          setHouseCode(initialData.houseCode || '');
          setHouseName(initialData.houseName || '');
          const matchedHouse = (options.houses ?? []).find(
            (item) =>
              item.facilityNodeId === initialData.facilityId
              && item.houseCode === (initialData.houseCode || ''),
          );
          setSelectedHouseId(matchedHouse?.id ?? 0);
          setZone(initialData.zone || '');
          setGeneration(initialData.generation || '');
          setPigSource(initialData.pigSource || '');
          setQuantity(Number(initialData.quantity || 0));
          setExpectedReceiveDate(
            initialData.expectedReceiveDate ? String(initialData.expectedReceiveDate).slice(0, 10) : '',
          );
          setAvgWeight(Number(initialData.avgWeight || 0));
          setPricePerHead(Number(initialData.pricePerHead || 0));
          setRemarks(initialData.remarks || '');
          return;
        }

        const matched = resolveFacilitySelection(
          facilityOptionsRef.current,
          getCurrentFacilityId(),
          getCurrentFacilityCode(),
        );

        setFacilityId(matched?.id ?? 0);
        setSelectedZone('');
        setSelectedHouseId(0);
        setHouseCode('');
        setHouseName('');
        if (options.pigSources?.length) {
          setPigSource((current) => current || options.pigSources[0].sourceName);
        }
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        if (!active) return;
        setError(axiosError.response?.data?.message || 'โหลดข้อมูลสำหรับเปิดโรงเรือนไม่สำเร็จ');
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void loadOptions();

    const onFacilityChanged = () => {
      if (isEdit) return;
      const matched = resolveFacilitySelection(
        facilityOptionsRef.current,
        getCurrentFacilityId(),
        getCurrentFacilityCode(),
      );
      setFacilityId(matched?.id ?? 0);
      setSelectedZone('');
      setSelectedHouseId(0);
      setHouseCode('');
      setHouseName('');
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => {
      active = false;
      window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    };
  }, [open, initialData, isEdit]);

  const facilityHouses = useMemo(
    () =>
      houses
        .filter((item) => item.facilityNodeId === facilityId)
        .sort((a, b) => {
          const byCode = (a.houseCode || '').localeCompare(b.houseCode || '', 'th', {
            numeric: true,
            sensitivity: 'base',
          });
          if (byCode !== 0) return byCode;
          return (a.houseName || '').localeCompare(b.houseName || '', 'th', {
            numeric: true,
            sensitivity: 'base',
          });
        }),
    [facilityId, houses],
  );

  const zoneOptions = useMemo(() => {
    const distinct = Array.from(
      new Set(facilityHouses.map((item) => (item.zoneName || '').trim()).filter(Boolean)),
    );
    return distinct.sort((a, b) => a.localeCompare(b));
  }, [facilityHouses]);

  const selectableHouses = useMemo(() => {
    if (!selectedZone) return facilityHouses;
    return facilityHouses.filter((item) => (item.zoneName || '').trim() === selectedZone);
  }, [facilityHouses, selectedZone]);

  useEffect(() => {
    if (!facilityHouses.length) {
      setSelectedHouseId(0);
      setHouseCode('');
      setHouseName('');
      return;
    }

    const selected = facilityHouses.find((item) => item.id === selectedHouseId);
    if (selected) {
      if (selectedZone && (selected.zoneName || '').trim() !== selectedZone) {
        setSelectedHouseId(0);
      }
      return;
    }

    setSelectedHouseId(0);
  }, [facilityHouses, selectedHouseId, selectedZone]);

  useEffect(() => {
    const selected = houses.find((item) => item.id === selectedHouseId);
    if (!selected) {
      setHouseCode((current) => (selectableHouses.length ? current : ''));
      setHouseName((current) => (selectableHouses.length ? current : ''));
      return;
    }

    setHouseCode(selected.houseCode);
    setHouseName(selected.houseName);
    if (!selectedZone && selected.zoneName) {
      setSelectedZone(selected.zoneName);
      setZone(selected.zoneName);
    } else if (selected.zoneName) {
      setZone(selected.zoneName);
    }
  }, [houses, selectedHouseId, selectedZone, selectableHouses.length]);

  const totalAmount = useMemo(() => Number((quantity * pricePerHead).toFixed(2)), [quantity, pricePerHead]);
  const createdDateDisplay = useMemo(() => {
    if (isEdit && initialData?.requestDate) {
      return formatDisplayDate(initialData.requestDate);
    }
    return formatDisplayDate(new Date());
  }, [initialData?.requestDate, isEdit]);

  const handleClose = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  const handleSave = async () => {
    setError(null);
    if (!facilityId || !houseCode.trim() || !houseName.trim() || !pigSource.trim() || quantity <= 0) {
      setError('กรุณากรอกข้อมูลหลักให้ครบ: ฟาร์ม, รหัสโรงเรือน, ชื่อโรงเรือน, แหล่งสุกร และจำนวน');
      return;
    }

    const payload: CreateBuildingOpeningRequest = {
      facilityId,
      houseCode: houseCode.trim(),
      houseName: houseName.trim(),
      zone: zone.trim() || undefined,
      generation: generation.trim() || undefined,
      pigSource: pigSource.trim(),
      quantity,
      expectedReceiveDate: expectedReceiveDate || undefined,
      avgWeight: avgWeight > 0 ? avgWeight : undefined,
      pricePerHead: pricePerHead > 0 ? pricePerHead : undefined,
      remarks: remarks.trim() || undefined,
    };

    const confirm = await Swal.fire({
      icon: 'question',
      title: isEdit ? 'ยืนยันการแก้ไขข้อมูล' : 'ยืนยันการสร้างรายการเปิดโรงเรือน',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      if (isEdit && initialData) {
        await buildingOpeningService.update(initialData.id, payload);
      } else {
        await buildingOpeningService.create(payload);
      }

      await onSaved();
      await Swal.fire({
        icon: 'success',
        title: isEdit ? 'บันทึกการแก้ไขสำเร็จ' : 'สร้างรายการเปิดโรงเรือนสำเร็จ',
        timer: 1300,
        showConfirmButton: false,
      });
      handleClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ';
      setError(message);
      await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: buildingOpeningDialogPaperSx }}>
      <DialogTitleWithClose onClose={handleClose} disabled={saving} sx={buildingOpeningDialogTitleSx}>
        {isEdit ? 'แก้ไขรายการเปิดโรงเรือน' : 'สร้างรายการเปิดโรงเรือน'}
      </DialogTitleWithClose>
      <DialogContent dividers sx={{ ...buildingOpeningDialogContentSx, '& .MuiAlert-root': { borderRadius: 10} }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" sx={buildingOpeningErrorAlertSx}>{error}</Alert> : null}

          <Box component="fieldset" sx={buildingOpeningFieldsetSx}>
            <Typography component="legend" sx={buildingOpeningLegendSx}>
              ข้อมูลการเปิดโรงเรือน
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  label="วันที่สร้าง"
                  value={createdDateDisplay}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  select
                  label="ฟาร์ม *"
                  value={facilityId}
                  onChange={(event) => {
                    const nextFacilityId = Number(event.target.value);
                    setFacilityId(nextFacilityId);
                    setSelectedZone('');
                    setSelectedHouseId(0);
                    setHouseCode('');
                    setHouseName('');
                  }}
                  disabled={loading || saving || facilities.length === 0}
                  fullWidth
                  sx={buildingOpeningInputSx}
                >
                  {facilities.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{`${item.code} - ${item.name}`}</MenuItem>
                  ))}
                </TextField>
                <TextField size="small"
                  select
                  label="โรงเรือน *"
                  value={selectedHouseId}
                  onChange={(event) => setSelectedHouseId(Number(event.target.value))}
                  disabled={loading || saving || selectableHouses.length === 0}
                  fullWidth
                  sx={buildingOpeningInputSx}
                >
                  {selectableHouses.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.houseCode}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  select
                  label="โซน"
                  value={selectedZone}
                  onChange={(event) => {
                    const nextZone = event.target.value;
                    setSelectedZone(nextZone);
                    setZone(nextZone);
                    setSelectedHouseId(0);
                    setHouseCode('');
                    setHouseName('');
                  }}
                  disabled={loading || saving || zoneOptions.length === 0}
                  fullWidth
                  sx={buildingOpeningInputSx}
                >
                  {zoneOptions.map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </TextField>
                <TextField size="small"
                  label="Generation"
                  value={generation}
                  onChange={(event) => setGeneration(event.target.value)}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
              </Stack>
            </Stack>
          </Box>

          <Box component="fieldset" sx={buildingOpeningFieldsetSx}>
            <Typography component="legend" sx={buildingOpeningLegendSx}>
              ข้อมูลสุกร
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Autocomplete
                  freeSolo
                  options={pigSources.map((item) => item.sourceName)}
                  value={pigSource}
                  onInputChange={(_, value) => setPigSource(value)}
                  onChange={(_, value) => setPigSource(typeof value === 'string' ? value : '')}
                  disabled={loading || saving}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="แหล่งสุกร *"
                      placeholder="เลือกหรือพิมพ์เพิ่มแหล่งสุกร"
                      sx={buildingOpeningInputSx}
                    />
                  )}
                />
                <TextField size="small"
                  label="จำนวนที่รับ (ตัว) *"
                  value={quantity}
                  onChange={(event) => {
                    const parsed = parseNumberInput(event.target.value);
                    if (parsed !== null) setQuantity(parsed);
                  }}
                  inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  label="น้ำหนักเฉลี่ย (กก.)"
                  value={avgWeight}
                  onChange={(event) => {
                    const parsed = parseNumberInput(event.target.value);
                    if (parsed !== null) setAvgWeight(parsed);
                  }}
                  inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
                <TextField size="small"
                  label="ราคาต่อตัว (บาท)"
                  value={pricePerHead}
                  onChange={(event) => {
                    const parsed = parseNumberInput(event.target.value);
                    if (parsed !== null) setPricePerHead(parsed);
                  }}
                  inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  label="วันที่คาดว่าจะรับสุกร"
                  type="date"
                  value={expectedReceiveDate}
                  onChange={(event) => setExpectedReceiveDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
                <TextField size="small"
                  label="มูลค่ารวม"
                  value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{ readOnly: true, style: { textAlign: 'right' } }}
                  fullWidth
                  sx={buildingOpeningInputSx}
                />
              </Stack>

              <TextField size="small"
                label="หมายเหตุ"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                multiline
                minRows={2}
                fullWidth
                sx={buildingOpeningInputSx}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={buildingOpeningDialogActionsSx}>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading} sx={buildingOpeningPrimaryButtonSx}>
          {isEdit ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
