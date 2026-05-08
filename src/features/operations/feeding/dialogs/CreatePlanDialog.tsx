'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import {
  CalendarToday as CalendarIcon,
  Agriculture as FarmIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import Swal from 'sweetalert2';
import { feedingService } from '../services/feeding.service';
import { UI, dialogPaperSx, primaryButtonSx, secondaryButtonSx } from '../constants';
import { toDisplayQty, toKgQty, formatSignedKg, getCartCount } from '../utils';
import type {
  CreateFeedingPlanLineBulkRequest,
  FeedingFiScheduleRowResponse,
  FeedingOptionFacility,
  FeedingOptionHouse,
} from '../types';

type CreateDraftLine = {
  feedItemId: number;
  feedCode: string;
  feedItemName: string;
  selected: boolean;
  plannedQtyKg: number;
  fiSuggestedKg: number;
  backlogKg: number;
  feedingFormat?: string;
  cartWeightKg?: number | null;
  roundCount?: number;
  cartPlanText?: string;
  isBagDisplay?: boolean;
  displayUomName?: string;
  kgPerDisplayUnit?: number;
  note?: string;
};

type CreatePlanForm = {
  planDate: string;
  facilityId: number;
  houseId: number | null;
  scheduledTime: string;
  note: string;
};

function buildCreateDraftLines(sourceRows: FeedingFiScheduleRowResponse[]): CreateDraftLine[] {
  return sourceRows
    .filter((row) => (row.feedItemId ?? 0) > 0)
    .map((row) => {
      const plannedKg = Number(row.plannedKg ?? row.targetFeedKg ?? 0);
      return {
        feedItemId: row.feedItemId as number,
        feedCode: row.feedCode ?? '',
        feedItemName: row.feedItemName ?? '',
        selected: plannedKg > 0,
        plannedQtyKg: plannedKg,
        fiSuggestedKg: Number(row.suggestedKg ?? row.targetFeedKg ?? 0),
        backlogKg: Number(row.backlogKg ?? 0),
        feedingFormat: row.feedingFormat,
        cartWeightKg: row.cartWeightKg,
        roundCount: row.roundCount,
        cartPlanText: row.cartPlanText,
        isBagDisplay: row.isBagDisplay,
        displayUomName: row.displayUomName,
        kgPerDisplayUnit: row.kgPerDisplayUnit,
        note: '',
      };
    });
}

interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  date: string;
  facilities: FeedingOptionFacility[];
  selectedFacilityId: number | '';
  fiScheduleRows: FeedingFiScheduleRowResponse[];
}

export default function CreatePlanDialog({
  open,
  onClose,
  onSuccess,
  date,
  facilities,
  selectedFacilityId,
  fiScheduleRows,
}: CreatePlanDialogProps) {
  const [createForm, setCreateForm] = useState<CreatePlanForm>({
    planDate: date,
    facilityId: 0,
    houseId: null,
    scheduledTime: '',
    note: '',
  });
  const [createDraftLines, setCreateDraftLines] = useState<CreateDraftLine[]>([]);
  const [localFiSchedules, setLocalFiSchedules] = useState<FeedingFiScheduleRowResponse[]>([]);
  const [openHouses, setOpenHouses] = useState<FeedingOptionHouse[]>([]);
  const [loadingOpenHouses, setLoadingOpenHouses] = useState(false);
  const openHouseRequestId = useRef(0);

  const createSelectedTotals = useMemo(
    () => createDraftLines
      .filter((line) => line.selected)
      .reduce((acc, line) => {
        acc.fi += line.fiSuggestedKg;
        acc.plan += line.plannedQtyKg;
        acc.carts += getCartCount(line.plannedQtyKg, line.cartWeightKg);
        return acc;
      }, { fi: 0, plan: 0, carts: 0 }),
    [createDraftLines],
  );

  const formatMasterCartLabel = (line: CreateDraftLine) => {
    const cartName = String(line.feedingFormat || '').trim();
    const cartWeight = Number(line.cartWeightKg ?? 0);
    if (!cartName && cartWeight <= 0) {
      return 'Master cart: -';
    }

    const segments = [];
    if (cartName) {
      segments.push(cartName);
    }
    if (cartWeight > 0) {
      segments.push(`${cartWeight.toLocaleString()} กก./เที่ยว`);
    }
    return `Master cart: ${segments.join(' • ')}`;
  };

  const fetchFiRowsByHouse = useCallback(async (planDate: string, targetFacilityId: number, targetHouseId?: number | null) => {
    if (!targetHouseId || targetFacilityId <= 0) return [];
    try {
      const rows = await feedingService.getFiSchedule(planDate, targetFacilityId, targetHouseId);
      return rows;
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!open) {
      openHouseRequestId.current += 1;
      setLoadingOpenHouses(false);
      return;
    }

    const initialFacilityId = typeof selectedFacilityId === 'number' && selectedFacilityId > 0
      ? selectedFacilityId
      : (facilities[0]?.id ?? 0);

    setCreateForm({
      planDate: date,
      facilityId: initialFacilityId,
      houseId: null,
      scheduledTime: '',
      note: '',
    });
    setOpenHouses([]);
    setLoadingOpenHouses(false);
    setLocalFiSchedules([]);
    setCreateDraftLines([]);
  }, [open, date, selectedFacilityId, facilities]);

  useEffect(() => {
    if (!open || createForm.facilityId <= 0) {
      if (open) {
        setOpenHouses([]);
      }
      return;
    }

    const requestId = ++openHouseRequestId.current;
    setLoadingOpenHouses(true);
    setOpenHouses([]);

    void feedingService.getOpenHouses(createForm.facilityId)
      .then((rows) => {
        if (openHouseRequestId.current !== requestId) {
          return;
        }

        const sorted = [...rows].sort((a, b) => (
          a.houseCode.localeCompare(b.houseCode, 'en', { numeric: true, sensitivity: 'base' })
          || a.id - b.id
        ));
        setOpenHouses(sorted);
      })
      .catch((error) => {
        console.error(error);
        if (openHouseRequestId.current === requestId) {
          setOpenHouses([]);
        }
      })
      .finally(() => {
        if (openHouseRequestId.current === requestId) {
          setLoadingOpenHouses(false);
        }
      });
  }, [open, createForm.facilityId]);

  useEffect(() => {
    if (!open || createForm.facilityId <= 0 || loadingOpenHouses) {
      return;
    }

    if (openHouses.length === 0) {
      setCreateForm((prev) => (prev.houseId === null ? prev : { ...prev, houseId: null }));
      return;
    }

    setCreateForm((prev) => {
      const nextHouseId = openHouses.some((house) => house.id === prev.houseId)
        ? prev.houseId
        : openHouses[0].id;

      if (prev.houseId === nextHouseId) {
        return prev;
      }

      return { ...prev, houseId: nextHouseId };
    });
  }, [createForm.facilityId, loadingOpenHouses, open, openHouses]);

  useEffect(() => {
    if (!open || createForm.facilityId <= 0 || !createForm.houseId) {
      if (open && (!createForm.houseId || createForm.facilityId <= 0)) {
        setLocalFiSchedules([]);
        setCreateDraftLines([]);
      }
      return;
    }

    let cancelled = false;
    void fetchFiRowsByHouse(createForm.planDate, createForm.facilityId, createForm.houseId)
      .then((fiRows) => {
        if (cancelled) return;
        setLocalFiSchedules(fiRows);
        setCreateDraftLines(buildCreateDraftLines(fiRows.length > 0
          ? fiRows
          : fiScheduleRows.filter((row) => row.houseId === createForm.houseId)));
      });

    return () => {
      cancelled = true;
    };
  }, [open, createForm.planDate, createForm.facilityId, createForm.houseId, fetchFiRowsByHouse, fiScheduleRows]);

  const handleFacilityChange = (nextFacilityId: number) => {
    setCreateForm((prev) => ({
      ...prev,
      facilityId: nextFacilityId,
      houseId: null,
    }));
    setOpenHouses([]);
    setLocalFiSchedules([]);
    setCreateDraftLines([]);
  };

  const handleHouseChange = (nextHouseId: number | null) => {
    setCreateForm((prev) => ({ ...prev, houseId: nextHouseId }));
  };

  const handleDateChange = (nextPlanDate: string) => {
    setCreateForm((prev) => ({ ...prev, planDate: nextPlanDate }));
  };

  const handleCreate = async () => {
    const selectedLines = createDraftLines.filter((line) => line.selected && line.plannedQtyKg > 0);
    if (createForm.facilityId <= 0 || !createForm.houseId || !createForm.scheduledTime || selectedLines.length === 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเลือกโรงเรือน เวลา และรายการอาหารอย่างน้อย 1 เบอร์' });
      return;
    }

    try {
      const createPayload: CreateFeedingPlanLineBulkRequest = {
        planDate: createForm.planDate,
        facilityId: createForm.facilityId,
        houseId: createForm.houseId,
        scheduledTime: createForm.scheduledTime,
        note: createForm.note || undefined,
        isBulk: true,
        lines: selectedLines.map((line) => ({
          feedItemId: line.feedItemId,
          feedCode: line.feedCode,
          plannedQtyKg: line.plannedQtyKg,
          plannedDisplayQty: line.isBagDisplay ? toDisplayQty(line.plannedQtyKg, line) : undefined,
          note: line.note || undefined,
        })),
      };
      await feedingService.createPlanLinesBulk(createPayload);
      onClose();
      onSuccess();
      await Swal.fire({ icon: 'success', title: 'บันทึก/ปรับปรุงแผนสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      const responseMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'กรุณาลองใหม่อีกครั้ง';
      await Swal.fire({ icon: 'error', title: 'เพิ่มแผนไม่สำเร็จ', text: responseMessage });
    }
  };

  const displayFiSchedules = localFiSchedules.length > 0
    ? localFiSchedules
    : (createForm.houseId
      ? fiScheduleRows.filter((row) => row.houseId === createForm.houseId)
      : []);
  const hasVisibleHouses = openHouses.length > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: dialogPaperSx }}>
      {/* Header */}
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: UI.accent, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>📝 เพิ่มรายการแผนให้อาหาร</Typography>
        <Chip size="small" label="Bulk Create" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, height: 24 }} />
      </Box>

      <DialogContent sx={{ bgcolor: '#FAFAFA', px: { xs: 1.5, md: 2.5 }, py: 2 }}>
        <Stack spacing={2}>
          {/* Selection fields in grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              type="date"
              label="วันที่"
              size="small"
              value={createForm.planDate}
              onChange={(event) => void handleDateChange(event.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <CalendarIcon sx={{ fontSize: 16, color: UI.muted, mr: 1 }} /> }}
            />
            <TextField
              label="เวลา"
              type="time"
              size="small"
              value={createForm.scheduledTime}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, scheduledTime: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <TimeIcon sx={{ fontSize: 16, color: UI.muted, mr: 1 }} /> }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel><FarmIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} /> ฟาร์ม</InputLabel>
              <Select
                label="ฟาร์ม"
                value={createForm.facilityId || ''}
                onChange={(event) => handleFacilityChange(Number(event.target.value))}
              >
                {facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.id}>{facility.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>โรงเรือน</InputLabel>
              <Select
                label="โรงเรือน"
                value={createForm.houseId ?? ''}
                disabled={loadingOpenHouses || !hasVisibleHouses}
                onChange={(event) => {
                  const selectedHouse = String(event.target.value);
                  void handleHouseChange(selectedHouse === '' ? null : Number(selectedHouse));
                }}
              >
                {loadingOpenHouses && (
                  <MenuItem value="" disabled>กำลังโหลดโรงเรือนที่เปิดอยู่...</MenuItem>
                )}
                {!loadingOpenHouses && openHouses.length === 0 && (
                  <MenuItem value="" disabled>ไม่พบโรงเรือนในฟาร์มนี้</MenuItem>
                )}
                {openHouses.map((house) => (
                  <MenuItem key={house.id} value={house.id}>{house.houseCode} {house.houseName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {loadingOpenHouses && (
            <Alert severity="info" sx={{ borderRadius: 10}}>
              กำลังดึงรายชื่อโรงเรือนที่เปิดอยู่จาก backend...
            </Alert>
          )}

          {!loadingOpenHouses && !hasVisibleHouses && createForm.facilityId > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 10}}>
              ไม่พบโรงเรือนสำหรับฟาร์มที่เลือก
            </Alert>
          )}

          {/* FI Summary Panel */}
          {displayFiSchedules.length > 0 && (
            <Box sx={{ border: `1px solid ${alpha(UI.accent, 0.14)}`, bgcolor: '#F0FDF4', borderRadius: 10, p: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#14532D', display: 'block', mb: 0.5 }}>
                📊 สรุปแผนจาก FI มาตรฐาน
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {displayFiSchedules[0].houseCode} {displayFiSchedules[0].houseName} • Day {displayFiSchedules[0].targetDay ?? '-'} • {displayFiSchedules[0].stockHead.toLocaleString()} ตัว
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 0.8 }}>
                <Box sx={{ textAlign: 'center', py: 0.5, borderRadius: 10, bgcolor: '#DCFCE7' }}>
                  <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>FI Baseline</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#15803D', fontSize: '0.88rem' }}>
                    {createSelectedTotals.fi.toLocaleString(undefined, { maximumFractionDigits: 1 })} กก.
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', py: 0.5, borderRadius: 10, bgcolor: UI.accentSurface }}>
                  <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>รวมแผน</Typography>
                  <Typography sx={{ fontWeight: 800, color: UI.accent, fontSize: '0.88rem' }}>
                    {createSelectedTotals.plan.toLocaleString(undefined, { maximumFractionDigits: 1 })} กก.
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', py: 0.5, borderRadius: 10, bgcolor: createSelectedTotals.plan - createSelectedTotals.fi > 0 ? '#FEF3C7' : '#F0FDF4' }}>
                  <Typography variant="caption" sx={{ color: UI.muted, display: 'block' }}>ส่วนต่าง</Typography>
                  <Typography sx={{ fontWeight: 800, color: createSelectedTotals.plan - createSelectedTotals.fi > 0 ? '#B45309' : '#15803D', fontSize: '0.88rem' }}>
                    {formatSignedKg(createSelectedTotals.plan - createSelectedTotals.fi)}
                  </Typography>
                </Box>
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mt={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Chip
                  size="small"
                  label={`รถเข็นรวม ${createSelectedTotals.carts} คัน`}
                  sx={{ fontWeight: 700, bgcolor: '#DBEAFE', color: '#1D4ED8' }}
                />
                {createSelectedTotals.carts > 0 && (
                  <Typography variant="caption" sx={{ color: UI.muted }}>
                    คำนวณจากปริมาณที่เลือกและน้ำหนักรถเข็นต่อเที่ยว
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          <Divider sx={{ borderColor: UI.border }} />

          {/* Feed items */}
          <Typography variant="caption" sx={{ fontWeight: 800, color: UI.text }}>
            🍽️ รายการอาหาร ({createDraftLines.filter((l) => l.selected).length}/{createDraftLines.length} เลือก)
          </Typography>
          <Stack spacing={1}>
            {createDraftLines.length === 0 && (
              <Alert severity="info" sx={{ borderRadius: 10}}>ยังไม่มีเบอร์อาหารแนะนำสำหรับวันเลี้ยงนี้</Alert>
            )}
            {createDraftLines.map((line, index) => {
              const diffKg = line.plannedQtyKg - line.fiSuggestedKg;
              return (
                <Box
                  key={`${line.feedItemId}-${index}`}
                  sx={{
                    border: `1px solid ${line.selected ? alpha(UI.accent, 0.3) : UI.border}`,
                    borderRadius: 10,
                    p: 1.2,
                    bgcolor: line.selected ? UI.accentSurface : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={line.selected}
                          onChange={(event) => setCreateDraftLines((prev) => prev.map((draft, di) =>
                            di === index ? { ...draft, selected: event.target.checked } : draft
                          ))}
                          sx={{ color: UI.accent, '&.Mui-checked': { color: UI.accent } }}
                        />
                      }
                      label={<Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{line.feedCode || '-'} {line.feedItemName}</Typography>}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label={`ปริมาณ (${line.isBagDisplay ? line.displayUomName || 'กระสอบ' : 'กก.'})`}
                      value={line.isBagDisplay ? toDisplayQty(line.plannedQtyKg, line) : line.plannedQtyKg}
                      onChange={(event) => {
                        const nextQtyKg = toKgQty(Number(event.target.value), line);
                        setCreateDraftLines((prev) => prev.map((draft, di) =>
                          di === index ? { ...draft, plannedQtyKg: nextQtyKg } : draft
                        ));
                      }}
                      sx={{ minWidth: { xs: '100%', sm: 200 } }}
                      inputProps={{ sx: { textAlign: 'right', fontWeight: 700 } }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5} mt={0.5} ml={4.5}>
                    <Typography variant="caption" sx={{ color: UI.muted }}>
                      FI {line.fiSuggestedKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} กก.
                    </Typography>
                    <Typography variant="caption" sx={{ color: UI.muted }}>
                      Backlog {line.backlogKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} กก.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 700 }}>
                      รถเข็น {getCartCount(line.plannedQtyKg, line.cartWeightKg)} คัน
                      {line.cartWeightKg != null ? ` (${Number(line.cartWeightKg).toLocaleString()} กก./เที่ยว)` : ''}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#0F766E', fontWeight: 700 }}>
                      {formatMasterCartLabel(line)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: diffKg > 0 ? '#B45309' : diffKg < 0 ? '#DC2626' : '#15803D', fontWeight: 700 }}>
                      Diff {formatSignedKg(diffKg)}
                    </Typography>
                  </Stack>
                  {line.cartPlanText && (
                    <Typography variant="caption" sx={{ color: UI.muted, display: 'block', mt: 0.25, ml: 4.5 }}>
                      {line.cartPlanText}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Note */}
          <TextField
            label="หมายเหตุ"
            multiline
            minRows={2}
            size="small"
            value={createForm.note ?? ''}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, note: event.target.value }))}
            placeholder="เพิ่มหมายเหตุ (ถ้ามี)"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${UI.border}`, bgcolor: '#fff' }}>
        <StockActionButton tone="neutral" onClick={onClose}>ยกเลิก</StockActionButton>
        <StockActionButton tone="primary" onClick={() => void handleCreate()}>
          บันทึกแผน
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
