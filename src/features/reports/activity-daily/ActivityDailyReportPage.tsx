'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Download, Refresh, Search as SearchIcon } from '@mui/icons-material';
import { DataTable, type Column } from '@/components/common';
import { httpClient } from '@/core/api/http-client';
import { toISODateString } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import {
  BLOCK_ACTION_FIELDSET_SX,
  BLOCK_FIELDSET_LEGEND_SX,
  BLOCK_FIELDSET_SX,
  BLOCK_LAYOUT_TWO_COLUMN_SX,
  BLOCK_REFRESH_BUTTON_SX,
  BLOCK_TABLE_FIELDSET_ALIGNED_SX,
  MASTER_PROGRAM_CONTENT_SX,
  MASTER_PROGRAM_HEADER_BAR_SX,
  MASTER_PROGRAM_SHELL_FIELDSET_SX,
} from '@/core/ui-patterns/block-style.template';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';

export type ActivityDailyHeaderRow = {
  id: number;
  docNo: string;
  entryDate: string;
  facilityId: number;
  facilityCode: string;
  facilityName: string;
  status: string;
  updatedDate?: string | null;
  createdDate: string;
};

type ActivityDailyDetailResponse = {
  header: ActivityDailyHeaderRow & {
    documentType?: string | null;
    mortalityDocNo?: string | null;
    remark?: string | null;
  };
  payload?: Record<string, unknown> | null;
  mortalityFlowRecords?: Array<{
    id: number;
    eventDate?: string | null;
    deathHead?: number | null;
    cullHead?: number | null;
    cause?: string | null;
    sourceDocument?: string | null;
    remarks?: string | null;
    createdDate?: string | null;
    createdBy?: string | null;
  }>;
};

type Props = {
  initialItems?: ActivityDailyHeaderRow[];
};

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: ActivityDailyHeaderRow[]): string {
  const header = ['เลขที่เอกสาร', 'วันที่เอกสาร', 'ฟาร์ม', 'สถานะ', 'แก้ไขล่าสุด'];
  const lines = rows.map((row) => [
    row.docNo,
    formatDateTime(row.entryDate),
    `${row.facilityCode} - ${row.facilityName}`,
    toThaiWorkflowStatus(row.status),
    formatDateTime(row.updatedDate || row.createdDate),
  ]);
  return [header, ...lines]
    .map((line) => line.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');
}

export function ActivityDailyReportPage({ initialItems = [] }: Props) {
  const today = toISODateString(new Date());
  const [items, setItems] = useState<ActivityDailyHeaderRow[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [searchDocNo, setSearchDocNo] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState(today);
  const [searchDateTo, setSearchDateTo] = useState(today);
  const [searchStatus, setSearchStatus] = useState('');
  const [appliedDocNo, setAppliedDocNo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState(today);
  const [appliedDateTo, setAppliedDateTo] = useState(today);
  const [appliedStatus, setAppliedStatus] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<ActivityDailyDetailResponse | null>(null);
  const dateFromInputRef = useRef<HTMLInputElement | null>(null);
  const dateToInputRef = useRef<HTMLInputElement | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await httpClient.get<ActivityDailyHeaderRow[]>('/api/ProductionActivities');
      setItems(Array.isArray(response.data) ? response.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const filteredItems = useMemo(() => {
    const keyword = appliedDocNo.trim().toLowerCase();
    return items.filter((row) => {
      if (appliedStatus && row.status !== appliedStatus) return false;
      const rowDate = (row.entryDate || '').slice(0, 10);
      if (appliedDateFrom && rowDate < appliedDateFrom) return false;
      if (appliedDateTo && rowDate > appliedDateTo) return false;
      if (!keyword) return true;
      return (
        row.docNo.toLowerCase().includes(keyword) ||
        row.facilityCode.toLowerCase().includes(keyword) ||
        row.facilityName.toLowerCase().includes(keyword)
      );
    });
  }, [appliedDateFrom, appliedDateTo, appliedDocNo, appliedStatus, items]);

  const summaryCards = useMemo(() => ([
    { title: 'เอกสารทั้งหมด', value: items.length, color: '#2166D1' },
    { title: 'แบบร่าง', value: items.filter((row) => row.status === 'DRAFT').length, color: '#64748b' },
    { title: 'ส่งรายงานแล้ว', value: items.filter((row) => row.status === 'SUBMITTED').length, color: '#ED6C02' },
    { title: 'อนุมัติแล้ว', value: items.filter((row) => row.status === 'APPROVED').length, color: '#2E7D32' },
  ]), [items]);

  const columns: Column<ActivityDailyHeaderRow>[] = [
    { id: 'docNo', label: 'เลขที่เอกสาร', align: 'left', minWidth: 180 },
    {
      id: 'entryDate',
      label: 'วันที่เอกสาร',
      align: 'center',
      minWidth: 160,
      format: (value) => formatDateTime(String(value)),
    },
    {
      id: 'facilityName',
      label: 'ฟาร์ม',
      align: 'left',
      minWidth: 260,
      format: (_, row) => `${row.facilityCode} - ${row.facilityName}`,
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 130,
      format: (value) => <Chip size="small" label={toThaiWorkflowStatus(String(value))} sx={getWorkflowStatusChipSx(String(value))} />,
    },
    {
      id: 'updatedDate',
      label: 'แก้ไขล่าสุด',
      align: 'center',
      minWidth: 180,
      format: (_, row) => formatDateTime(row.updatedDate || row.createdDate),
    },
  ];

  const handleExportExcel = () => {
    const csv = toCsv(filteredItems);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
    anchor.href = url;
    anchor.download = `activity-daily-report-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleOpenDetail = useCallback(async (row: ActivityDailyHeaderRow) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const response = await httpClient.get<ActivityDailyDetailResponse>(`/api/ProductionActivities/${row.id}`);
      setSelectedDetail(response.data ?? null);
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const mortalityRows = useMemo(() => {
    const payload = selectedDetail?.payload as { mortalityRecords?: Array<Record<string, unknown>> } | undefined;
    if (Array.isArray(payload?.mortalityRecords) && payload.mortalityRecords.length > 0) {
      return payload.mortalityRecords;
    }

    const fallbackRows = selectedDetail?.mortalityFlowRecords ?? [];
    const normalizedRows: Array<Record<string, unknown>> = [];
    fallbackRows.forEach((row, idx) => {
      const reason = row.cause || row.remarks || '-';
      const eventDate = row.eventDate ? String(row.eventDate).slice(0, 10) : '-';
      const deathHead = Number(row.deathHead ?? 0);
      const cullHead = Number(row.cullHead ?? 0);

      if (deathHead > 0) {
        normalizedRows.push({
          id: `${row.id}-death-${idx}`,
          type: 'ตาย',
          reason: `${reason} (${eventDate})`,
          amount: deathHead,
          weight: '-',
        });
      }
      if (cullHead > 0) {
        normalizedRows.push({
          id: `${row.id}-cull-${idx}`,
          type: 'คัดทิ้ง',
          reason: `${reason} (${eventDate})`,
          amount: cullHead,
          weight: '-',
        });
      }
    });

    return normalizedRows;
  }, [selectedDetail]);

  const feedRows = useMemo(() => {
    const payload = selectedDetail?.payload as { feedRecords?: Array<Record<string, unknown>> } | undefined;
    return Array.isArray(payload?.feedRecords) ? payload.feedRecords : [];
  }, [selectedDetail]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box component="fieldset" sx={MASTER_PROGRAM_SHELL_FIELDSET_SX}>
        <Box sx={MASTER_PROGRAM_HEADER_BAR_SX}>รายงานบันทึกข้อมูลประจำวัน</Box>
        <Box sx={MASTER_PROGRAM_CONTENT_SX}>
          <Box sx={{ mb: 2, ...BLOCK_LAYOUT_TWO_COLUMN_SX, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 224px' } }}>
            <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
              <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>จำนวนรายการทั้งหมด</Typography>

              <Box sx={{ mb: 2, display: 'grid', gap: 1.25, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
                {summaryCards.map((card) => (
                  <Card key={card.title} sx={{ borderRadius: 10}}>
                    <CardContent sx={{ p: 1.25 }}>
                      <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: card.color, lineHeight: 1.15 }}>
                        {formatNumber(Number(card.value || 0))}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            <Box component="fieldset" sx={BLOCK_ACTION_FIELDSET_SX}>
              <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>จัดการรายการ</Typography>
              <Button variant="contained" startIcon={<Download />} onClick={handleExportExcel} disabled={filteredItems.length === 0}>
                Export Excel
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={loadReport} sx={BLOCK_REFRESH_BUTTON_SX}>
                รีเฟรช
              </Button>
            </Box>
          </Box>



          <Box component="fieldset" sx={{ ...BLOCK_TABLE_FIELDSET_ALIGNED_SX, mb: 1 }}>
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>รายการรายงาน Activity Daily</Typography>
            <Box
              sx={{
                display: 'grid',
                mb: 1,
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: 'minmax(320px,1fr) 160px minmax(220px,1fr) minmax(330px,1.2fr) auto',
                },
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                placeholder="ค้นหาเลขที่เอกสาร"
                value={searchDocNo}
                onChange={(event) => setSearchDocNo(event.target.value)}
                sx={{ width: '100%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                size="small"
                select
                placeholder="สถานะ"
                value={searchStatus}
                onChange={(event) => setSearchStatus(event.target.value)}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => (value ? String(value) : 'สถานะ'),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { height: 40, width: '100%' },
                  '& .MuiSelect-select': {
                    color: searchStatus ? 'inherit' : 'text.secondary',
                  },
                }}
              >
                <MenuItem value="">ทั้งหมด</MenuItem>
                <MenuItem value="DRAFT">{toThaiWorkflowStatus('DRAFT')}</MenuItem>
                <MenuItem value="SUBMITTED">{toThaiWorkflowStatus('SUBMITTED')}</MenuItem>
                <MenuItem value="APPROVED">{toThaiWorkflowStatus('APPROVED')}</MenuItem>
                <MenuItem value="RETURNED">{toThaiWorkflowStatus('RETURNED')}</MenuItem>
                <MenuItem value="REJECTED">{toThaiWorkflowStatus('REJECTED')}</MenuItem>
              </TextField>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  type="date"
                  value={searchDateFrom}
                  onChange={(event) => setSearchDateFrom(event.target.value)}
                  onClick={() => {
                    const input = dateFromInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                    input?.focus();
                    input?.showPicker?.();
                  }}
                  inputRef={dateFromInputRef}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer' },
                    '& input': { cursor: 'pointer' },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20, textAlign: 'center' }}>
                  ถึง
                </Typography>
                <TextField
                  size="small"
                  type="date"
                  value={searchDateTo}
                  onChange={(event) => setSearchDateTo(event.target.value)}
                  onClick={() => {
                    const input = dateToInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                    input?.focus();
                    input?.showPicker?.();
                  }}
                  inputRef={dateToInputRef}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': { height: 40, cursor: 'pointer' },
                    '& input': { cursor: 'pointer' },
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setAppliedDocNo(searchDocNo);
                    setAppliedDateFrom(searchDateFrom);
                    setAppliedDateTo(searchDateTo);
                    setAppliedStatus(searchStatus);
                  }}
                  sx={{ height: 40, width: { xs: '100%', md: '120px' }, minWidth: '120px' }}
                >
                  ค้นหา
                </Button>
              </Box>
            </Box>
            <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
              *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
            </Typography>
            <DataTable
              columns={columns}
              data={filteredItems}
              loading={loading}
              onRowDoubleClick={handleOpenDetail}
              headerCellSx={{
                bgcolor: '#2166D1 !important',
                color: '#fff !important',
                fontWeight: 700,
                fontSize: '16px',
                height: 50,
                py: 0,
                verticalAlign: 'middle',
                borderBottom: '1px solid rgba(255,255,255,0.45)',
                borderRight: '1px solid rgba(255,255,255,0.3)',
                '&:last-of-type': { borderRight: 'none' },
              }}
              stickyHeader
              emptyMessage="ไม่มีข้อมูลรายงานบันทึกประจำวัน"
              paperSx={{ borderRadius: 10, height: PR_MAIN_TABLE_HEIGHT, pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px` }}
              tableContainerSx={{ overflowX: 'auto', overflowY: 'auto' }}
            />
          </Box>
        </Box>
      </Box>

      <Dialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedDetail(null);
        }}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>รายละเอียดรายงานบันทึกข้อมูลประจำวัน</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Typography color="text.secondary">กำลังโหลดข้อมูล...</Typography>
          ) : null}

          {!detailLoading && !selectedDetail ? (
            <Typography color="error">ไม่สามารถโหลดรายละเอียดเอกสารได้</Typography>
          ) : null}

          {!detailLoading && selectedDetail ? (
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <Typography variant="body2"><strong>เลขที่เอกสาร:</strong> {selectedDetail.header.docNo}</Typography>
              <Typography variant="body2"><strong>ประเภท:</strong> {selectedDetail.header.documentType || '-'}</Typography>
              <Typography variant="body2"><strong>ฟาร์ม:</strong> {selectedDetail.header.facilityCode} - {selectedDetail.header.facilityName}</Typography>
              <Typography variant="body2"><strong>วันที่เอกสาร:</strong> {formatDateTime(selectedDetail.header.entryDate)}</Typography>
              <Typography variant="body2"><strong>สถานะ:</strong> {toThaiWorkflowStatus(selectedDetail.header.status)}</Typography>
              <Typography variant="body2"><strong>เลขที่เอกสารตาย:</strong> {selectedDetail.header.mortalityDocNo || '-'}</Typography>
              <Typography variant="body2"><strong>หมายเหตุ:</strong> {selectedDetail.header.remark || '-'}</Typography>

              {mortalityRows.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                    รายการตาย/คัดทิ้ง
                  </Typography>
                  <TableContainer sx={{ border: '1px solid #cfd8e3', borderRadius: 10}}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">ลำดับ</TableCell>
                          <TableCell>ประเภท</TableCell>
                          <TableCell>สาเหตุ</TableCell>
                          <TableCell align="center">วันที่ตาย</TableCell>
                          <TableCell align="center">คอก</TableCell>
                          <TableCell align="center">จำนวน</TableCell>
                          <TableCell align="center">น้ำหนัก</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mortalityRows.map((row, idx) => (
                          <TableRow key={`${row.id ?? idx}-${idx}`}>
                            <TableCell align="center">{idx + 1}</TableCell>
                            <TableCell>{String(row.type ?? '-')}</TableCell>
                            <TableCell>{String(row.reason ?? '-')}</TableCell>
                            <TableCell align="center">
                              {row.deathDay ? `Day ${String(row.deathDay)}` : '-'}
                            </TableCell>
                            <TableCell align="center">{String(row.stall ?? '-')}</TableCell>
                            <TableCell align="center">{formatNumber(Number(row.amount ?? 0))}</TableCell>
                            <TableCell align="center">{String(row.weight ?? '-')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : feedRows.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 700 }}>
                    รายการอาหาร
                  </Typography>
                  <TableContainer sx={{ border: '1px solid #cfd8e3', borderRadius: 10}}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">ลำดับ</TableCell>
                          <TableCell>โรงเรือน</TableCell>
                          <TableCell>เบอร์อาหาร</TableCell>
                          <TableCell align="right">ปริมาณ</TableCell>
                          <TableCell>หมายเหตุ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {feedRows.map((row, idx) => {
                          const amountKg = Number(row.amountKg ?? row.amount ?? 0);
                          const isBagDisplay = Boolean(row.isBagDisplay);
                          const displayQty = Number(row.displayQty ?? row.amount ?? 0);
                          const displayText = isBagDisplay
                            ? `${formatNumber(displayQty)} ${String(row.displayUomName ?? 'กระสอบ')} (${formatNumber(amountKg)} กก.)`
                            : `${formatNumber(amountKg)} กก.`;

                          return (
                            <TableRow key={`${String(row.id ?? idx)}-${idx}`}>
                              <TableCell align="center">{idx + 1}</TableCell>
                              <TableCell>{String(row.house ?? '-')}</TableCell>
                              <TableCell>{String(row.feedCode ?? row.feedNo ?? '-')}</TableCell>
                              <TableCell align="right">{displayText}</TableCell>
                              <TableCell>{String(row.note ?? '-')}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <TextField
                  label="Payload"
                  multiline
                  minRows={10}
                  value={JSON.stringify(selectedDetail.payload ?? {}, null, 2)}
                  InputProps={{ readOnly: true }}
                />
              )}
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
