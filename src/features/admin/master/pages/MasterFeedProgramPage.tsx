'use client';

import { Add, DeleteOutline, RefreshOutlined, SaveOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import EmptyState from '@/components/common/EmptyState';
import SearchField from '@/components/common/SearchField';
import { ContentCard } from '@/components/common';
import { MasterSectionLayout } from '@/features/admin/master/components';
import { masterApi } from '@/features/admin/master/services/master.api';
import type {
  FeedProgramDto,
  FeedProgramDayUpsert,
  FeedProgramUpsert,
} from '@/features/admin/master/types';

type ProgramFormState = {
  programCode: string;
  programName: string;
  totalDays: string;
  totalKgPerHead: string;
  fcr: string;
  adgGramsPerDay: string;
  sortOrder: string;
  isActive: boolean;
};

type DayFormState = {
  id?: number | null;
  feedCode: string;
  dayFrom: string;
  dayTo: string;
  durationDays: string;
  kgPerHead: string;
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_PROGRAM: ProgramFormState = {
  programCode: '',
  programName: '',
  totalDays: '150',
  totalKgPerHead: '290',
  fcr: '2.39',
  adgGramsPerDay: '810',
  sortOrder: '1',
  isActive: true,
};

const EMPTY_DAY = (sortOrder = 1): DayFormState => ({
  id: null,
  feedCode: '',
  dayFrom: sortOrder === 1 ? '1' : '',
  dayTo: sortOrder === 1 ? '1' : '',
  durationDays: '1',
  kgPerHead: '',
  sortOrder,
  isActive: true,
});

function formatNumberText(value: number | string | null | undefined, fractionDigits = 0): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '-';
  return parsed.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function programToForm(program: FeedProgramDto): ProgramFormState {
  return {
    programCode: program.programCode ?? '',
    programName: program.programName ?? '',
    totalDays: String(program.totalDays ?? ''),
    totalKgPerHead: String(program.totalKgPerHead ?? ''),
    fcr: String(program.fcr ?? ''),
    adgGramsPerDay: String(program.adgGramsPerDay ?? ''),
    sortOrder: String(program.sortOrder ?? 1),
    isActive: Boolean(program.isActive),
  };
}

function dayToForm(day: FeedProgramDto['days'][number], sortOrder: number): DayFormState {
  return {
    id: day.id,
    feedCode: day.feedCode ?? '',
    dayFrom: String(day.dayFrom ?? ''),
    dayTo: String(day.dayTo ?? ''),
    durationDays: String(day.durationDays ?? ''),
    kgPerHead: String(day.kgPerHead ?? ''),
    sortOrder,
    isActive: Boolean(day.isActive),
  };
}

function createBlankProgram(): ProgramFormState {
  return { ...EMPTY_PROGRAM };
}

function createBlankDays(): DayFormState[] {
  return [EMPTY_DAY(1)];
}

export function MasterFeedProgramPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [programs, setPrograms] = useState<FeedProgramDto[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [form, setForm] = useState<ProgramFormState>(createBlankProgram());
  const [days, setDays] = useState<DayFormState[]>(createBlankDays());
  const [includeInactive, setIncludeInactive] = useState(true);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const filteredPrograms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return programs.filter((program) => {
      if (!includeInactive && !program.isActive) return false;
      if (!keyword) return true;
      const haystack = [
        program.programCode,
        program.programName,
        String(program.totalDays),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [includeInactive, programs, search]);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await masterApi.getFeedPrograms(true);
      setPrograms(rows);
      setSelectedProgramId((current) => {
        if (current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
      return rows;
    } catch (error) {
      console.error('Failed to load feed programs', error);
      setPrograms([]);
      setSelectedProgramId(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (!selectedProgram) {
      setForm(createBlankProgram());
      setDays(createBlankDays());
      return;
    }

    setForm(programToForm(selectedProgram));
    setDays(
      selectedProgram.days.length > 0
        ? selectedProgram.days
            .slice()
            .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)
            .map((day, index) => dayToForm(day, index + 1))
        : createBlankDays(),
    );
  }, [selectedProgram]);

  const setProgramField = <K extends keyof ProgramFormState>(key: K, value: ProgramFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setDayField = <K extends keyof DayFormState>(index: number, key: K, value: DayFormState[K]) => {
    setDays((prev) => prev.map((day, dayIndex) => (dayIndex === index ? { ...day, [key]: value } : day)));
  };

  const handleSelectProgram = (program: FeedProgramDto) => {
    setSelectedProgramId(program.id);
  };

  const handleCreateNew = () => {
    setSelectedProgramId(null);
    setForm(createBlankProgram());
    setDays(createBlankDays());
  };

  const handleAddDay = () => {
    setDays((prev) => {
      const last = prev[prev.length - 1];
      const nextSortOrder = prev.length + 1;
      const nextDayFrom = Number(last?.dayTo ?? 0) > 0 ? Number(last?.dayTo) + 1 : nextSortOrder === 1 ? 1 : '';
      return [
        ...prev,
        {
          ...EMPTY_DAY(nextSortOrder),
          dayFrom: nextDayFrom === '' ? '' : String(nextDayFrom),
          dayTo: nextDayFrom === '' ? '' : String(nextDayFrom),
        },
      ];
    });
  };

  const handleRemoveDay = (index: number) => {
    setDays((prev) => {
      const next = prev.filter((_, dayIndex) => dayIndex !== index);
      if (next.length === 0) {
        return createBlankDays();
      }
      return next.map((day, dayIndex) => ({ ...day, sortOrder: dayIndex + 1 }));
    });
  };

  const normalizeDayRows = (dayRows: DayFormState[]) => {
    const normalized: FeedProgramDayUpsert[] = dayRows.map((day, index) => {
      const dayFrom = Number(day.dayFrom);
      const dayTo = Number(day.dayTo);
      const durationDays = Number(day.durationDays) || (dayTo - dayFrom + 1);
      return {
        id: day.id ?? null,
        feedCode: day.feedCode.trim().toUpperCase(),
        dayFrom,
        dayTo,
        durationDays,
        kgPerHead: Number(day.kgPerHead),
        sortOrder: index + 1,
        isActive: day.isActive,
      };
    });
    return normalized;
  };

  const handleSave = async () => {
    const programCode = form.programCode.trim().toUpperCase();
    const programName = form.programName.trim();
    const totalDays = Number(form.totalDays);
    const totalKgPerHead = Number(form.totalKgPerHead);
    const fcr = Number(form.fcr);
    const adgGramsPerDay = Number(form.adgGramsPerDay);
    const sortOrder = Number(form.sortOrder);
    const normalizedDays = normalizeDayRows(days);

    if (!programCode || !programName) {
      await Swal.fire({ icon: 'warning', title: 'กรอกข้อมูลไม่ครบ', text: 'กรุณากรอกรหัสและชื่อโปรแกรม' });
      return;
    }
    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'จำนวนวันต้องเป็นตัวเลขมากกว่า 0' });
      return;
    }
    if (!Number.isFinite(totalKgPerHead) || totalKgPerHead <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ปริมาณรวมต้องเป็นตัวเลขมากกว่า 0' });
      return;
    }
    if (!Number.isFinite(fcr) || fcr <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'FCR ต้องเป็นตัวเลขมากกว่า 0' });
      return;
    }
    if (!Number.isFinite(adgGramsPerDay) || adgGramsPerDay <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ADG ต้องเป็นตัวเลขมากกว่า 0' });
      return;
    }
    if (!Number.isFinite(sortOrder) || sortOrder <= 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ลำดับแสดงต้องเป็นตัวเลขมากกว่า 0' });
      return;
    }

    let expectedDay = 1;
    for (const day of normalizedDays) {
      if (!day.feedCode) {
        await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกเบอร์อาหารให้ครบทุกช่วงวัน' });
        return;
      }
      if (day.dayFrom !== expectedDay) {
        await Swal.fire({ icon: 'warning', title: 'ช่วงวันไม่ต่อเนื่อง', text: 'ช่วงวันต้องเริ่มต่อกันตั้งแต่วัน 1 แบบไม่มีช่องว่าง' });
        return;
      }
      if (day.dayTo < day.dayFrom) {
        await Swal.fire({ icon: 'warning', title: 'ช่วงวันไม่ถูกต้อง', text: 'วันสิ้นสุดต้องมากกว่าหรือเท่ากับวันเริ่มต้น' });
        return;
      }
      expectedDay = day.dayTo + 1;
    }

    if (normalizedDays.length === 0) {
      await Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณาเพิ่มอย่างน้อย 1 ช่วงวัน' });
      return;
    }
    if (normalizedDays[0].dayFrom !== 1) {
      await Swal.fire({ icon: 'warning', title: 'ช่วงวันไม่ถูกต้อง', text: 'ช่วงวันแรกต้องเริ่มที่วัน 1' });
      return;
    }
    if (normalizedDays[normalizedDays.length - 1].dayTo !== totalDays) {
      await Swal.fire({ icon: 'warning', title: 'จำนวนวันไม่ตรง', text: 'จำนวนวันทั้งหมดต้องตรงกับวันสุดท้ายของโปรแกรม' });
      return;
    }

    const payload: FeedProgramUpsert = {
      programCode,
      programName,
      totalDays,
      totalKgPerHead,
      fcr,
      adgGramsPerDay,
      sortOrder,
      isActive: form.isActive,
      days: normalizedDays,
    };

    setSaving(true);
    try {
      const saved = selectedProgramId
        ? await masterApi.updateFeedProgram(selectedProgramId, payload)
        : await masterApi.createFeedProgram(payload);

      await loadPrograms();
      setSelectedProgramId(saved.id);
      await Swal.fire({ icon: 'success', title: 'บันทึกแล้ว', timer: 1200, showConfirmButton: false });
    } catch (error: any) {
      console.error('Failed to save feed program', error);
      const message =
        error?.response?.data?.message ??
        error?.response?.data?.title ??
        error?.message ??
        'บันทึกข้อมูลไม่สำเร็จ';
      await Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProgramId) return;
    const confirmed = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการยกเลิกใช้งาน?',
      text: 'โปรแกรมและช่วงวันจะถูกปิดการใช้งาน',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
    });

    if (!confirmed.isConfirmed) {
      return;
    }

    try {
      setSaving(true);
      await masterApi.deleteFeedProgram(selectedProgramId);
      const rows = await loadPrograms();
      setSelectedProgramId(rows[0]?.id ?? null);
      await Swal.fire({ icon: 'success', title: 'ปิดการใช้งานแล้ว', timer: 1200, showConfirmButton: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'ไม่สามารถลบข้อมูลได้';
      await Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: message });
    } finally {
      setSaving(false);
    }
  };

  const programSummary = useMemo(() => {
    const totalDuration = days.reduce((sum, day) => sum + (Number(day.durationDays) || 0), 0);
    const totalKg = days.reduce((sum, day) => sum + (Number(day.kgPerHead) || 0), 0);
    const firstDay = days[0]?.dayFrom ?? '-';
    const lastDay = days[days.length - 1]?.dayTo ?? '-';
    return { totalDuration, totalKg, firstDay, lastDay };
  }, [days]);

  return (
    <Box sx={{ height: 'calc(100dvh - 52px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: { xs: 2, md: 3 } }}>
      <MasterSectionLayout sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <ContentCard
          borderColor={alpha(theme.palette.divider, 0.9)}
          backgroundColor={theme.palette.background.paper}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <SearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาโปรแกรมให้อาหาร"
                sx={{ minWidth: { xs: '100%', md: 320 }, maxWidth: 420 }}
              />
              <FormControlLabel
                control={<Switch checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} />}
                label="แสดงข้อมูลไม่ใช้งาน"
              />
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" startIcon={<RefreshOutlined />} onClick={() => void loadPrograms()} disabled={loading || saving}>
                  โหลดใหม่
                </Button>
                <Button variant="outlined" startIcon={<Add />} onClick={handleCreateNew} disabled={saving}>
                  เพิ่มโปรแกรม
                </Button>
                <Button variant="contained" startIcon={<SaveOutlined />} onClick={() => void handleSave()} disabled={saving}>
                  บันทึก
                </Button>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ flex: 1, minHeight: 0 }}>
              <Grid size={{ xs: 12, md: 4, lg: 3 }} sx={{ minHeight: 0 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: '100%',
                    minHeight: 0,
                    p: 1.5,
                    borderRadius: 2,
                    overflow: 'auto',
                    borderColor: alpha(theme.palette.divider, 0.9),
                    bgcolor: alpha(theme.palette.background.default, 0.4),
                  }}
                >
                  <Stack spacing={1.1}>
                    <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                      รายการโปรแกรมอาหาร
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      เลือกโปรแกรมเพื่อแก้ไขช่วงวันและค่าสูตร
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                    {loading && programs.length === 0 ? (
                      <EmptyState title="กำลังโหลดข้อมูล" message="กรุณารอสักครู่" />
                    ) : filteredPrograms.length === 0 ? (
                      <EmptyState title="ไม่พบข้อมูล" message="ลองเปลี่ยนคำค้นหาหรือเปิดแสดงข้อมูลไม่ใช้งาน" />
                    ) : (
                      filteredPrograms.map((program) => {
                        const active = program.id === selectedProgramId;
                        return (
                          <Paper
                            key={program.id}
                            variant="outlined"
                            onClick={() => handleSelectProgram(program)}
                            sx={{
                              p: 1.25,
                              borderRadius: 1.8,
                              cursor: 'pointer',
                              borderColor: active ? theme.palette.primary.main : alpha(theme.palette.divider, 0.85),
                              bgcolor: active ? alpha(theme.palette.primary.main, 0.06) : theme.palette.background.paper,
                            }}
                          >
                            <Stack spacing={0.5}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                                <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary, fontSize: 13 }}>
                                  {program.programCode}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={program.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                                  color={program.isActive ? 'success' : 'default'}
                                  sx={{ fontWeight: 700, height: 24 }}
                                />
                              </Stack>
                              <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                                {program.programName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {program.totalDays} วัน • {program.days.length} ช่วง • {formatNumberText(program.totalKgPerHead, 0)} กก./ตัว
                              </Typography>
                            </Stack>
                          </Paper>
                        );
                      })
                    )}
                  </Stack>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 8, lg: 9 }} sx={{ minHeight: 0 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    height: '100%',
                    minHeight: 0,
                    borderRadius: 2,
                    p: 2,
                    borderColor: alpha(theme.palette.divider, 0.9),
                    bgcolor: theme.palette.background.paper,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  {selectedProgram || selectedProgramId === null ? (
                    <>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                          <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, color: theme.palette.text.primary }}>
                              {selectedProgramId ? 'แก้ไขโปรแกรมอาหาร' : 'เพิ่มโปรแกรมอาหาร'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              กรอกรายละเอียดโปรแกรมและช่วงวันของเบอร์อาหารให้ครบ
                            </Typography>
                          </Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              ใช้งานอยู่
                            </Typography>
                            <Switch checked={form.isActive} onChange={(event) => setProgramField('isActive', event.target.checked)} />
                          </Stack>
                        </Stack>

                        <Grid container spacing={1.25}>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField fullWidth size="small" label="รหัสโปรแกรม" value={form.programCode} onChange={(event) => setProgramField('programCode', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 12, md: 8 }}>
                            <TextField fullWidth size="small" label="ชื่อโปรแกรม" value={form.programName} onChange={(event) => setProgramField('programName', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField fullWidth size="small" type="number" label="Total Days" value={form.totalDays} onChange={(event) => setProgramField('totalDays', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField fullWidth size="small" type="number" label="ลำดับ" value={form.sortOrder} onChange={(event) => setProgramField('sortOrder', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField fullWidth size="small" type="number" label="รวม kg/ตัว" value={form.totalKgPerHead} onChange={(event) => setProgramField('totalKgPerHead', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField fullWidth size="small" type="number" label="FCR" value={form.fcr} onChange={(event) => setProgramField('fcr', event.target.value)} />
                          </Grid>
                          <Grid size={{ xs: 6, md: 2 }}>
                            <TextField fullWidth size="small" type="number" label="ADG" value={form.adgGramsPerDay} onChange={(event) => setProgramField('adgGramsPerDay', event.target.value)} />
                          </Grid>
                        </Grid>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          <Chip size="small" label={`ช่วงวัน ${programSummary.firstDay} - ${programSummary.lastDay}`} sx={{ fontWeight: 700 }} />
                          <Chip size="small" label={`รวม ${programSummary.totalDuration} วัน`} sx={{ fontWeight: 700 }} />
                          <Chip size="small" label={`รวม ${programSummary.totalKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg/ตัว`} sx={{ fontWeight: 700 }} />
                        </Stack>
                      </Stack>

                      <Divider />

                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                        <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                          ช่วงวันของเบอร์อาหาร
                        </Typography>
                        <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddDay} disabled={saving}>
                          เพิ่มช่วงวัน
                        </Button>
                      </Stack>

                      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${alpha(theme.palette.divider, 0.9)}`, borderRadius: 1.5 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>ลำดับ</TableCell>
                              <TableCell>เบอร์อาหาร</TableCell>
                              <TableCell>วันเริ่ม</TableCell>
                              <TableCell>วันจบ</TableCell>
                              <TableCell>จำนวนวัน</TableCell>
                              <TableCell>kg/ตัว</TableCell>
                              <TableCell>สถานะ</TableCell>
                              <TableCell align="center">จัดการ</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {days.map((day, index) => (
                              <TableRow key={`${day.sortOrder}-${index}`}>
                                <TableCell sx={{ width: 82 }}>
                                  <Chip size="small" label={day.sortOrder} sx={{ fontWeight: 700 }} />
                                </TableCell>
                                <TableCell>
                                  <TextField fullWidth size="small" value={day.feedCode} onChange={(event) => setDayField(index, 'feedCode', event.target.value)} />
                                </TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <TextField fullWidth size="small" type="number" value={day.dayFrom} onChange={(event) => setDayField(index, 'dayFrom', event.target.value)} />
                                </TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <TextField fullWidth size="small" type="number" value={day.dayTo} onChange={(event) => setDayField(index, 'dayTo', event.target.value)} />
                                </TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <TextField fullWidth size="small" type="number" value={day.durationDays} onChange={(event) => setDayField(index, 'durationDays', event.target.value)} />
                                </TableCell>
                                <TableCell sx={{ width: 140 }}>
                                  <TextField fullWidth size="small" type="number" value={day.kgPerHead} onChange={(event) => setDayField(index, 'kgPerHead', event.target.value)} />
                                </TableCell>
                                <TableCell sx={{ width: 110 }}>
                                  <Switch checked={day.isActive} onChange={(event) => setDayField(index, 'isActive', event.target.checked)} />
                                </TableCell>
                                <TableCell align="center" sx={{ width: 84 }}>
                                  <Tooltip title="ลบช่วงวัน">
                                    <span>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="text"
                                        startIcon={<DeleteOutline />}
                                        onClick={() => handleRemoveDay(index)}
                                        disabled={days.length === 1}
                                      >
                                        ลบ
                                      </Button>
                                    </span>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>

                      <Alert severity="info">
                        ระบบจะตรวจให้ช่วงวันต่อเนื่องจากวัน 1 จนถึงวันสุดท้ายของโปรแกรมก่อนบันทึก
                      </Alert>

                      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                        {selectedProgramId && (
                          <Button color="error" variant="outlined" onClick={() => void handleDelete()} disabled={saving}>
                            ปิดการใช้งาน
                          </Button>
                        )}
                        <Button variant="outlined" onClick={handleCreateNew} disabled={saving}>
                          ล้างฟอร์ม
                        </Button>
                        <Button variant="contained" startIcon={<SaveOutlined />} onClick={() => void handleSave()} disabled={saving}>
                          บันทึกข้อมูล
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <EmptyState title="ไม่พบรายการ" message="ยังไม่มีโปรแกรมอาหารในระบบ" />
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </ContentCard>
      </MasterSectionLayout>
    </Box>
  );
}
