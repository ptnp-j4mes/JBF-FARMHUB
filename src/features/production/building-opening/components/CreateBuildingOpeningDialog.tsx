'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { alpha } from '@mui/material/styles';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { DialogTitleWithClose } from '@/components/common';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import { buildingOpeningService } from '../services/building-opening.service';
import { MASTER_DIALOG_FORM_SX } from '@/core/ui-patterns/pr-ui.constants';
import type {
  BuildingOpeningHouseOption,
  BuildingOpeningResponse,
  CreateBuildingOpeningRequest,
} from '../types';

const UI = {
  accent: 'rgb(22, 90, 80)',
  accentDark: '#10473f',
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#eef4ef',
  border: '#d8dfda',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const DIALOG_PAPER_SX = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  boxShadow: UI.shadow,
  overflow: 'hidden',
  bgcolor: UI.panel,
};

const DIALOG_TITLE_SX = {
  bgcolor: UI.accent,
  color: '#fff',
  borderBottom: `1px solid ${alpha(UI.accent, 0.24)}`,
  fontWeight: 800,
  '& .MuiIconButton-root': {
    color: '#fff',
  },
};

const DIALOG_CONTENT_SX = {
  ...MASTER_DIALOG_FORM_SX,
  bgcolor: '#fcfdfc',
  px: { xs: 1.5, md: 2 },
  py: { xs: 1.5, md: 2 },
  '& .MuiAlert-root': {
    borderRadius: 2.4,
  },
};

const SECTION_FIELDSET_SX = {
  border: `1px solid ${UI.border}`,
  borderRadius: 3,
  p: { xs: 1.25, md: 1.5 },
  minWidth: 0,
  bgcolor: UI.panel,
  boxShadow: UI.shadowSoft,
};

const SECTION_LEGEND_SX = {
  px: 1.1,
  fontSize: '0.95rem',
  fontWeight: 800,
  color: UI.text,
  letterSpacing: '-0.01em',
};

const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.2,
    bgcolor: UI.panelSoft,
    boxShadow: UI.shadowSoft,
    '& fieldset': {
      borderColor: UI.border,
    },
    '&:hover fieldset': {
      borderColor: UI.borderStrong,
    },
    '&.Mui-focused fieldset': {
      borderColor: UI.accent,
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: UI.accent,
  },
};

const ERROR_ALERT_SX = {
  border: '1px solid #f3c2c2',
  bgcolor: '#fff4f4',
  color: '#8c2f2f',
  boxShadow: UI.shadowSoft,
};

const ACTIONS_SX = {
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  borderTop: `1px solid ${UI.border}`,
  bgcolor: '#fbfcfb',
};

const PRIMARY_BUTTON_SX = {
  borderRadius: 2.2,
  px: 2.2,
  boxShadow: UI.shadowSoft,
  bgcolor: UI.accent,
  '&:hover': {
    bgcolor: UI.accentDark,
  },
};

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
          optionRows,
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
        optionRows,
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
      <DialogTitleWithClose onClose={handleClose} disabled={saving} sx={DIALOG_TITLE_SX}>
        {isEdit ? 'แก้ไขรายการเปิดโรงเรือน' : 'สร้างรายการเปิดโรงเรือน'}
      </DialogTitleWithClose>
      <DialogContent dividers sx={DIALOG_CONTENT_SX}>
        <Stack spacing={2}>
          {error ? <Alert severity="error" sx={ERROR_ALERT_SX}>{error}</Alert> : null}

          <Box component="fieldset" sx={SECTION_FIELDSET_SX}>
            <Typography component="legend" sx={SECTION_LEGEND_SX}>
              ข้อมูลการเปิดโรงเรือน
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField size="small"
                  label="วันที่สร้าง"
                  value={createdDateDisplay}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
                />
              </Stack>
            </Stack>
          </Box>

          <Box component="fieldset" sx={SECTION_FIELDSET_SX}>
            <Typography component="legend" sx={SECTION_LEGEND_SX}>
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
                      sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
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
                  sx={INPUT_SX}
                />
                <TextField size="small"
                  label="มูลค่ารวม"
                  value={totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  InputProps={{ readOnly: true, style: { textAlign: 'right' } }}
                  fullWidth
                  sx={INPUT_SX}
                />
              </Stack>

              <TextField size="small"
                label="หมายเหตุ"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                multiline
                minRows={2}
                fullWidth
                sx={INPUT_SX}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={ACTIONS_SX}>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading} sx={PRIMARY_BUTTON_SX}>
          {isEdit ? 'บันทึกการแก้ไข' : 'สร้างรายการ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
