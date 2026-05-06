'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AssignmentTurnedInOutlined,
  Download,
  PendingActionsOutlined,
  TodayOutlined,
  UndoOutlined,
} from '@mui/icons-material';
import { AxiosError } from 'axios';
import Swal from 'sweetalert2';
import { QuickStatusButtonGroup, StatsCard } from '@/components/common';
import { DataTable, DialogTitleWithClose, type Column } from '@/components/common';
import { WorkspaceHeader } from '@/design-system';
import { formatDateShort, toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { buildingOpeningService } from '@/features/production/building-opening/services/building-opening.service';
import type {
  BuildingOpeningFacilityOption,
  BuildingOpeningHouseOption,
  BuildingOpeningFilterParams,
  BuildingOpeningResponse,
} from '@/features/production/building-opening/types';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import {
  buildingOpeningDialogActionsSx,
  buildingOpeningDialogContentSx,
  buildingOpeningDialogPaperSx,
  buildingOpeningDialogTitleSx,
  buildingOpeningInputSx,
  buildingOpeningPageShellSx,
  buildingOpeningPrimaryButtonSx,
  buildingOpeningOutlinedButtonSx,
} from '@/features/production/building-opening/components/BuildingOpeningWorkspaceChrome';
import { stockPanelSx } from '@/features/production/stock/components/StockWorkspaceChrome';
import {
  buildBuildingOpeningStatusItems,
  matchesBuildingOpeningFilters,
} from '@/features/production/building-opening/utils/building-opening-filters';

type Props = {
  initialData?: BuildingOpeningResponse[];
  mode?: 'approval' | 'report';
  embedded?: boolean;
  compact?: boolean;
  onClose?: () => void;
};

const DIALOG_PAPER_SX = buildingOpeningDialogPaperSx;
const DIALOG_TITLE_SX = buildingOpeningDialogTitleSx;
const DIALOG_CONTENT_SX = buildingOpeningDialogContentSx;
const DIALOG_ACTIONS_SX = buildingOpeningDialogActionsSx;
const OUTLINED_BUTTON_SX = buildingOpeningOutlinedButtonSx;
const PRIMARY_BUTTON_SX = buildingOpeningPrimaryButtonSx;

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: BuildingOpeningResponse[]): string {
  const header = ['เลขที่เอกสาร', 'วันที่', 'ฟาร์ม', 'โรงเรือน', 'จำนวน', 'สถานะ'];
  const lines = rows.map((row) => [
    row.documentNumber,
    formatDateShort(row.requestDate),
    row.facilityName,
    row.houseName,
    String(Number(row.quantity ?? 0)),
    toThaiWorkflowStatus(row.status),
  ]);

  return [header, ...lines]
    .map((line) => line.map((cell) => escapeCsv(String(cell ?? ''))).join(','))
    .join('\n');
}

export function BuildingOpeningApprovalPage({ initialData = [], mode = 'approval', embedded = false, compact = false, onClose }: Props) {
  const today = toISODateString(new Date());
  const [rows, setRows] = useState<BuildingOpeningResponse[]>(() =>
    mode === 'approval'
      ? initialData.filter((row) => row.status === 'Submitted')
      : initialData,
  );
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BuildingOpeningResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');
  const initialBootstrapSkippedRef = useRef(false);
  const [facilities, setFacilities] = useState<BuildingOpeningFacilityOption[]>([]);
  const [houses, setHouses] = useState<BuildingOpeningHouseOption[]>([]);

  const [docNo, setDocNo] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [houseCode, setHouseCode] = useState('');
  const [requestDateFrom, setRequestDateFrom] = useState(today);
  const [requestDateTo, setRequestDateTo] = useState(today);
  const [appliedDocNo, setAppliedDocNo] = useState('');
  const [appliedFacilityId, setAppliedFacilityId] = useState('');
  const [appliedHouseCode, setAppliedHouseCode] = useState('');
  const [appliedRequestDateFrom, setAppliedRequestDateFrom] = useState(today);
  const [appliedRequestDateTo, setAppliedRequestDateTo] = useState(today);
  const [statusFilter, setStatusFilter] = useState<BuildingOpeningFilterParams['status']>('all');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<BuildingOpeningFilterParams['status']>('all');

  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await buildingOpeningService.getAll({ status: 'all' });
      setRows(mode === 'approval' ? data.filter((row) => row.status === 'Submitted') : data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายการรออนุมัติเปิดโรงเรือนได้');
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    if (!initialBootstrapSkippedRef.current && initialData.length > 0) {
      initialBootstrapSkippedRef.current = true;
      return;
    }
    void loadRows();
  }, [initialData.length, loadRows]);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const options = await buildingOpeningService.getCreateOptions();
        if (!active) return;
        setFacilities(options.facilities ?? []);
        setHouses(options.houses ?? []);
      } catch {
        if (!active) return;
        setFacilities([]);
        setHouses([]);
      }
    };

    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const houseOptions = useMemo(() => {
    if (!facilityId) return [];
    const targetFacilityId = Number(facilityId);
    return houses.filter((house) => house.facilityNodeId === targetFacilityId);
  }, [facilityId, houses]);

  const houseOptionById = useMemo(() => {
    const map = new Map<number, BuildingOpeningHouseOption>();
    for (const item of houses) {
      map.set(item.id, item);
    }
    return map;
  }, [houses]);

  const openDetails = useCallback(async (row: BuildingOpeningResponse) => {
    try {
      const full = await buildingOpeningService.getById(row.id);
      setSelected(full);
      setComment('');
      setOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายละเอียดได้');
    }
  }, []);

  const executeAction = useCallback(async (title: string, run: () => Promise<void>) => {
    const confirm = await Swal.fire({
      icon: 'question',
      title,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await run();
      await loadRows();
      if (selected) {
        const full = await buildingOpeningService.getById(selected.id);
        setSelected(full);
      }
      await Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1200, showConfirmButton: false });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: axiosError.response?.data?.message ?? 'เกิดข้อผิดพลาด',
      });
    } finally {
      setActionLoading(false);
    }
  }, [loadRows, selected]);

  const filteredRowsWithoutStatus = useMemo(() => {
    const filters = {
      searchTerm: appliedDocNo,
      requestDateFrom: appliedRequestDateFrom,
      requestDateTo: appliedRequestDateTo,
      facilityId: appliedFacilityId ? Number(appliedFacilityId) : null,
      houseId: null,
      status: 'all' as const,
    };

    return rows.filter((row) =>
      matchesBuildingOpeningFilters(
        row,
        filters,
        houseOptionById,
        false,
      ),
    ).filter((row) => {
      if (!appliedHouseCode) return true;
      return (row.houseCode || '').toLowerCase() === appliedHouseCode.toLowerCase();
    });
  }, [appliedDocNo, appliedFacilityId, appliedHouseCode, appliedRequestDateFrom, appliedRequestDateTo, houseOptionById, rows]);

  const filteredRows = useMemo(() => {
    const filters = {
      searchTerm: appliedDocNo,
      requestDateFrom: appliedRequestDateFrom,
      requestDateTo: appliedRequestDateTo,
      facilityId: appliedFacilityId ? Number(appliedFacilityId) : null,
      houseId: null,
      status: appliedStatusFilter,
    };

    return filteredRowsWithoutStatus.filter((row) =>
      matchesBuildingOpeningFilters(
        row,
        filters,
        houseOptionById,
        true,
      ),
    );
  }, [
    appliedDocNo,
    appliedFacilityId,
    appliedHouseCode,
    appliedRequestDateFrom,
    appliedRequestDateTo,
    appliedStatusFilter,
    filteredRowsWithoutStatus,
    houseOptionById,
  ]);

  const statusQuickStatuses = useMemo(
    () => buildBuildingOpeningStatusItems(filteredRowsWithoutStatus),
    [filteredRowsWithoutStatus],
  );

  const columns: Column<BuildingOpeningResponse>[] = [
    { id: 'documentNumber', label: 'เลขที่เอกสาร', align: 'left', minWidth: 180 },
    {
      id: 'requestDate',
      label: 'วันที่',
      align: 'center',
      minWidth: 120,
      format: (value) => formatDateShort(String(value)),
    },
    { id: 'facilityName', label: 'ฟาร์ม', align: 'left', minWidth: 220 },
    { id: 'houseName', label: 'โรงเรือน', align: 'left', minWidth: 130 },
    {
      id: 'quantity',
      label: 'จำนวน',
      align: 'right',
      minWidth: 100,
      format: (value) => formatNumber(Number(value ?? 0)),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 120,
      format: (value) => <Chip size="small" sx={getWorkflowStatusChipSx(String(value))} label={toThaiWorkflowStatus(String(value))} />,
    },
  ];

  const handleExportExcel = useCallback((event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();

    const csv = toCsv(filteredRows);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);

    anchor.href = url;
    anchor.download = `building-opening-approvals-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  const summaryCards = useMemo(() => {
    const submitted = filteredRows.filter((row) => row.status === 'Submitted').length;
    const approved = filteredRows.filter((row) => row.status === 'Approved').length;
    const returned = filteredRows.filter((row) => row.status === 'Returned').length;

    return [
      {
        key: 'all',
        title: 'รายการทั้งหมด',
        subtitle: 'เอกสารเปิดโรงเรือน',
        value: filteredRows.length,
        icon: <TodayOutlined />,
        color: 'info' as const,
      },
      {
        key: 'submitted',
        title: 'รอดำเนินการ',
        subtitle: 'งานรออนุมัติ',
        value: submitted,
        icon: <PendingActionsOutlined />,
        color: 'warning' as const,
      },
      {
        key: 'approved',
        title: 'อนุมัติแล้ว',
        subtitle: 'พร้อมดำเนินงาน',
        value: approved,
        icon: <AssignmentTurnedInOutlined />,
        color: 'success' as const,
      },
      {
        key: 'returned',
        title: 'ตีกลับ',
        subtitle: 'ต้องแก้ไขข้อมูล',
        value: returned,
        icon: <UndoOutlined />,
        color: 'error' as const,
      },
    ];
  }, [filteredRows]);

  return (
    <Box
      sx={{
        ...buildingOpeningPageShellSx,
        maxWidth: compact ? 'none' : embedded ? 'none' : 1400,
        mx: compact ? 0 : embedded ? 0 : 'auto',
        p: compact ? 0 : embedded ? 0 : { xs: 1.5, md: 2 },
        bgcolor: compact ? 'transparent' : embedded ? 'transparent' : 'background.default',
      }}
    >
      {!compact ? (
        <>
          <WorkspaceHeader
            chipLabel={mode === 'report' ? 'Building Opening Report' : 'Building Opening Approval'}
            title={mode === 'report' ? 'รายงานเปิดโรงเรือน' : 'รายการอนุมัติโรงเรือน'}
            subtitle="ตรวจสอบและอนุมัติรายการได้จากมุมมองเดียวกัน"
            meta={embedded ? 'Embedded view' : 'Dashboard / รายการอนุมัติ'}
          />
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' } }}>
            {summaryCards.map((card) => (
              <StatsCard
                key={card.key}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                color={card.color}
              />
            ))}
          </Box>
        </>
      ) : null}

      <Box sx={{ ...stockPanelSx, p: 1.5 }}>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', lineHeight: 1.1 }}>
                {mode === 'report' ? 'รายงานเปิดโรงเรือน' : 'รายการอนุมัติโรงเรือน'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {mode === 'report' ? 'ดูรายการและส่งออกข้อมูลได้จากหน้าจอเดียว' : 'ค้นหา ตรวจสอบ และอนุมัติรายการได้จากมุมมองเดียว'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {mode === 'report' ? (
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExportExcel}
                  disabled={filteredRows.length === 0}
                  sx={buildingOpeningPrimaryButtonSx}
                >
                  Export Excel
                </Button>
              ) : null}
              {embedded && onClose ? (
                <Button variant="outlined" onClick={onClose} sx={buildingOpeningOutlinedButtonSx}>
                  ปิดรายการอนุมัติ
                </Button>
              ) : null}
            </Stack>
          </Box>

          <QuickStatusButtonGroup
            items={statusQuickStatuses}
            selectedValue={statusFilter}
            onChange={(value) => {
              const nextStatus = value as typeof statusFilter;
              setStatusFilter(nextStatus);
              setAppliedStatusFilter(nextStatus);
            }}
          />

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: '1.1fr 1fr 1fr minmax(300px,1.1fr) auto',
              },
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              placeholder="ค้นหาเลขที่เอกสาร"
              value={docNo}
              onChange={(event) => setDocNo(event.target.value)}
              sx={buildingOpeningInputSx}
            />
            <TextField
              size="small"
              select
              label="ฟาร์ม"
              value={facilityId}
              onChange={(event) => {
                setFacilityId(event.target.value);
                setHouseCode('');
              }}
              sx={buildingOpeningInputSx}
            >
              <MenuItem value="all">ทั้งหมด</MenuItem>
              {facilities.map((facility) => (
                <MenuItem key={facility.id} value={String(facility.id)}>
                  {facility.code} - {facility.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              select
              label="โรงเรือน"
              value={houseCode}
              onChange={(event) => setHouseCode(event.target.value)}
              disabled={!facilityId}
              sx={buildingOpeningInputSx}
            >
              <MenuItem value="all">{facilityId ? 'ทั้งหมด' : 'เลือกฟาร์มก่อน'}</MenuItem>
              {houseOptions.map((house) => (
                <MenuItem key={house.id} value={house.houseCode}>
                  {house.zoneName ? `${house.zoneName}/` : ''}{house.houseCode} - {house.houseName}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                type="date"
                value={requestDateFrom}
                onChange={(event) => setRequestDateFrom(event.target.value)}
                sx={{ flex: 1, ...buildingOpeningInputSx }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
                ถึง
              </Typography>
              <TextField
                size="small"
                type="date"
                value={requestDateTo}
                onChange={(event) => setRequestDateTo(event.target.value)}
                sx={{ flex: 1, ...buildingOpeningInputSx }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={() => {
                setAppliedDocNo(docNo);
                setAppliedFacilityId(facilityId);
                setAppliedHouseCode(houseCode);
                setAppliedRequestDateFrom(requestDateFrom);
                setAppliedRequestDateTo(requestDateTo);
                setAppliedStatusFilter(statusFilter);
              }}
              sx={buildingOpeningPrimaryButtonSx}
            >
              ค้นหา
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
            *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
          </Typography>

          <DataTable
            columns={columns}
            data={filteredRows}
            loading={loading}
            headerCellSx={{
              bgcolor: 'background.paper !important',
              color: 'text.primary !important',
              fontWeight: 800,
              fontSize: '15px',
              py: 0,
              verticalAlign: 'middle',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
            onRowDoubleClick={openDetails}
            emptyMessage="ไม่มีรายการเปิดโรงเรือน"
            stickyHeader
            paperSx={{
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              bgcolor: 'background.paper',
              height: PR_MAIN_TABLE_HEIGHT,
              pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
            }}
            tableContainerSx={{ overflowX: 'auto', overflowY: 'auto', scrollbarGutter: 'stable' }}
            tableSx={{
              '& .MuiTable-root': { minWidth: { xs: 980, md: 980 }, tableLayout: 'fixed' },
              '& .MuiTableBody-root .MuiTableCell-root': {
                py: 1.05,
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
            }}
          />
        </Stack>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
        <DialogTitleWithClose onClose={() => setOpen(false)} disabled={actionLoading} sx={DIALOG_TITLE_SX}>
          {mode === 'report' ? 'รายละเอียดเปิดโรงเรือน' : 'อนุมัติเปิดโรงเรือน'}
        </DialogTitleWithClose>
        <DialogContent dividers sx={DIALOG_CONTENT_SX}>
          {selected ? (
            <Stack spacing={1.2}>
              <Typography><strong>เลขที่เอกสาร:</strong> {selected.documentNumber}</Typography>
              <Typography><strong>ฟาร์ม:</strong> {selected.facilityName}</Typography>
              <Typography><strong>โรงเรือน:</strong> {selected.houseCode} - {selected.houseName}</Typography>
              <Typography><strong>จำนวน:</strong> {formatNumber(Number(selected.quantity ?? 0))}</Typography>
              <Typography><strong>แหล่งสุกร:</strong> {selected.pigSource}</Typography>
              <Typography><strong>สถานะ:</strong> {toThaiWorkflowStatus(selected.status)}</Typography>
              {mode === 'approval' ? (
                <TextField
                  size="small"
                  label="Comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="ระบุเหตุผล (จำเป็นสำหรับ Return/Reject)"
                  multiline
                  minRows={2}
                  fullWidth
                />
              ) : null}
            </Stack>
          ) : null}
        </DialogContent>
        {mode === 'approval' ? (
          <DialogActions sx={DIALOG_ACTIONS_SX}>
            <Button
              color="error"
              variant="outlined"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={OUTLINED_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                if (!comment.trim()) {
                  void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Reject' });
                  return;
                }
                void executeAction('ยืนยันไม่อนุมัติรายการนี้', async () => {
                  await buildingOpeningService.reject(selected.id, { comment: comment.trim() });
                });
              }}
            >
              Reject
            </Button>
            <Button
              color="warning"
              variant="outlined"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={OUTLINED_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                if (!comment.trim()) {
                  void Swal.fire({ icon: 'warning', title: 'กรุณาใส่เหตุผลสำหรับ Return' });
                  return;
                }
                void executeAction('ยืนยันตีกลับรายการนี้', async () => {
                  await buildingOpeningService.returnForRevision(selected.id, { comment: comment.trim() });
                });
              }}
            >
              Return
            </Button>
            <Button
              color="success"
              variant="contained"
              disabled={!selected || actionLoading || selected.status !== 'Submitted'}
              sx={PRIMARY_BUTTON_SX}
              onClick={() => {
                if (!selected) return;
                void executeAction('ยืนยันอนุมัติรายการนี้', async () => {
                  await buildingOpeningService.approve(selected.id, { comment: comment.trim() || undefined });
                });
              }}
            >
              Approve
            </Button>
          </DialogActions>
        ) : null}
      </Dialog>
    </Box>
  );
}
