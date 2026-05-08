'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  RefreshOutlined,
  Search as SearchIcon,
  LayersOutlined,
  InputOutlined,
  Inventory2Outlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import dayjs from '@/lib/dayjs';
import { formatNumber } from '@/lib/utils/format.util';
import { FACILITY_CHANGED_EVENT, getCurrentFacilityCode } from '@/lib/facility-context';
import { DataTable, DialogTitleWithClose, type Column } from '@/components/common';
import {
  PR_DIALOG_TABLE_HEIGHT,
  PR_MAIN_TABLE_BOTTOM_PADDING,
  PR_MAIN_TABLE_HEIGHT,
  MASTER_DIALOG_FORM_SX,
} from '@/core/ui-patterns/pr-ui.constants';
import {
  BLOCK_ACTION_FIELDSET_SX,
  BLOCK_FIELDSET_LEGEND_SX,
  BLOCK_FIELDSET_SX,
  BLOCK_LAYOUT_TWO_COLUMN_SX,
  BLOCK_REFRESH_BUTTON_SX,
  BLOCK_TABLE_FIELDSET_ALIGNED_SX,
} from '@/core/ui-patterns/block-style.template';
import { stockService } from './services/stock.service';
import { PigMovementsTable } from './components/PigMovementsTable';
import type { PigBatchItemOption, PigBatchRow, PigBatchTraceDetail } from './types';

const STATUS_OPTIONS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'active', label: 'ใช้งาน' },
  { value: 'closed', label: 'ปิดรุ่น' },
];

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  field: '#fbfcfb',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSoft: '#dce8e4',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 10,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

const pigDetailDialogTitleSx = {
  textAlign: 'center',
  bgcolor: UI.accent,
  color: '#fff',
  borderBottom: '1px solid rgba(255,255,255,0.18)',
  '& .MuiIconButton-root': {
    color: '#fff',
  },
} as const;

function formatCodeNameLabel(code?: string | null, name?: string | null): string {
  const normalizedCode = code?.trim() ?? '';
  const normalizedName = name?.trim() ?? '';

  if (!normalizedCode) {
    return normalizedName || '-';
  }

  if (!normalizedName) {
    return normalizedCode;
  }

  const lowerCode = normalizedCode.toLowerCase();
  const lowerName = normalizedName.toLowerCase();
  if (lowerName === lowerCode || lowerName.startsWith(`${lowerCode} -`)) {
    return normalizedName;
  }

  return `${normalizedCode} - ${normalizedName}`;
}

function formatHouseLabel(code?: string | null, name?: string | null): string {
  const normalizedCode = code?.trim() ?? '';
  const normalizedName = name?.trim() ?? '';

  if (!normalizedCode) {
    return normalizedName || '-';
  }

  if (!normalizedName) {
    return normalizedCode;
  }

  const lowerCode = normalizedCode.toLowerCase();
  const lowerName = normalizedName.toLowerCase();
  if (lowerName === lowerCode || lowerName.startsWith(`${lowerCode} -`)) {
    return normalizedName;
  }

  return `${normalizedCode} - ${normalizedName}`;
}

export function PigStockPage() {
  const [rows, setRows] = useState<PigBatchRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchNoKeyword, setBatchNoKeyword] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [itemOptions, setItemOptions] = useState<PigBatchItemOption[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<PigBatchTraceDetail | null>(null);
  const [detailRow, setDetailRow] = useState<PigBatchRow | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const facilityCode = getCurrentFacilityCode() ?? undefined;
      const response = await stockService.getPaged({
        facilityCode,
        batchNo: batchNoKeyword.trim() || undefined,
        itemId: selectedItemId === '' ? undefined : selectedItemId,
        status: status || undefined,
        page: page + 1,
        pageSize,
        sortBy: 'receivedDate',
        sortDir: 'desc',
      });

      setRows(response.data ?? []);
      setTotalCount(response.totalCount ?? 0);
    } catch {
      setRows([]);
      setTotalCount(0);
      setError('ไม่สามารถโหลดข้อมูลสต๊อกสุกรได้');
    } finally {
      setLoading(false);
    }
  }, [batchNoKeyword, page, pageSize, selectedItemId, status]);

  const loadItemOptions = useCallback(async () => {
    try {
      const facilityCode = getCurrentFacilityCode() ?? undefined;
      const options = await stockService.getItemOptions(facilityCode);
      setItemOptions(options);
    } catch {
      setItemOptions([]);
    }
  }, []);

  const reloadFromFirstPage = useCallback(() => {
    if (page !== 0) {
      setPage(0);
      return;
    }
    void loadData();
  }, [loadData, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onFacilityChanged = () => {
      void loadItemOptions();
      reloadFromFirstPage();
    };

    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, [loadItemOptions, reloadFromFirstPage]);

  useEffect(() => {
    void loadItemOptions();
  }, [loadItemOptions]);

  const summary = useMemo(() => {
    const totalInitial = rows.reduce((sum, row) => sum + Number(row.initialQuantity ?? 0), 0);
    const totalCurrent = rows.reduce((sum, row) => sum + Number(row.currentQuantity ?? 0), 0);
    const activeCount = rows.filter((row) => String(row.status).toLowerCase() === 'active').length;
    return { totalInitial, totalCurrent, activeCount };
  }, [rows]);

  const summaryCards = useMemo(() => ([
    {
      key: 'total-batch',
      title: 'จำนวนรุ่นทั้งหมด',
      value: formatNumber(totalCount),
      subtitle: 'รายการทั้งหมด',
      icon: <LayersOutlined sx={{ color: '#4a6982', fontSize: 20 }} />,
      iconBg: '#efe8da',
      bar: '#4a6982',
    },
    {
      key: 'total-in',
      title: 'จำนวนรับเข้า',
      value: formatNumber(summary.totalInitial),
      subtitle: 'หน้าปัจจุบัน',
      icon: <InputOutlined sx={{ color: '#7c5ce5', fontSize: 20 }} />,
      iconBg: '#e4ddf4',
      bar: '#7c5ce5',
    },
    {
      key: 'total-current',
      title: 'สต๊อกคงเหลือ',
      value: formatNumber(summary.totalCurrent),
      subtitle: 'หน้าปัจจุบัน',
      icon: <Inventory2Outlined sx={{ color: '#2e7d32', fontSize: 20 }} />,
      iconBg: '#dfe9db',
      bar: '#2e7d32',
    },
    {
      key: 'active-batch',
      title: 'รุ่นที่ใช้งาน',
      value: formatNumber(summary.activeCount),
      subtitle: 'สถานะ Active',
      icon: <CheckCircleOutlineOutlined sx={{ color: '#d09100', fontSize: 20 }} />,
      iconBg: '#f2ead8',
      bar: '#d09100',
    },
  ]), [summary.activeCount, summary.totalCurrent, summary.totalInitial, totalCount]);

  const openDetailDialog = useCallback(async (row: PigBatchRow) => {
    setDetailRow(row);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const trace = await stockService.getTrace(row.id);
      setDetailData(trace);
    } catch {
      setDetailError('ไม่สามารถโหลดรายละเอียดรุ่นสุกรได้');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openMovementDetail = useCallback(async (movementRow: { pigBatchId?: number | null }) => {
    if (!movementRow.pigBatchId) return;
    try {
      const batch = await stockService.getById(Number(movementRow.pigBatchId), true);
      void openDetailDialog(batch);
    } catch {
      setDetailError('ไม่สามารถโหลดรายละเอียดรุ่นสุกรได้');
      setDetailOpen(true);
      setDetailLoading(false);
    }
  }, [openDetailDialog]);

  const columns: Column<PigBatchRow>[] = [
    { id: 'batchNo', label: 'รุ่น', align: 'center', minWidth: 108, width: 108 },
    {
      id: 'itemName',
      label: 'รายการ',
      align: 'center',
      minWidth: 212,
      width: 212,
      format: (_, row) => `${row.itemCode} - ${row.itemName}`,
    },
    {
      id: 'currentHouseName',
      label: 'โรงเรือน',
      align: 'center',
      minWidth: 182,
      width: 182,
      format: (_, row) => formatHouseLabel(row.currentHouseCode, row.currentHouseName),
    },
    {
      id: 'initialQuantity',
      label: 'รับเข้า',
      align: 'right',
      minWidth: 102,
      width: 102,
      format: (value) => formatNumber(Number(value ?? 0)),
    },
    {
      id: 'currentQuantity',
      label: 'สต๊อกปัจจุบัน',
      align: 'right',
      minWidth: 126,
      width: 126,
      format: (value, row) => `${formatNumber(Number(value ?? 0))} ${row.uomName}`,
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 106,
      width: 106,
      format: (value) => (
        <Chip
          label={String(value || '-')}
          size="small"
          color={String(value).toLowerCase() === 'active' ? 'success' : 'default'}
          variant="outlined"
        />
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          ...panelSx,
          background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label="Pig Stock"
            sx={{
              bgcolor: '#fff',
              color: UI.accent,
              fontWeight: 800,
              border: `1px solid ${UI.borderStrong}`,
              height: 28,
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
            ติดตามสต๊อกรายรุ่น การเคลื่อนไหวล่าสุด
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              สต๊อกสุกร
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              ดูรุ่นสุกรที่ยังใช้งานอยู่ คลังที่เกี่ยวข้อง และรายละเอียดการรับเข้า
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / สต๊อกสุกร
          </Typography>
        </Box>
      </Box>
      <Stack spacing={2.5}>
        <Box
          sx={{
            ...panelSx,
            px: 1.2,
            py: 1.1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 0,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTabs-flexContainer': { gap: 0.8 },
            }}
          >
            <Tab
              label="ภาพรวมสต๊อกสุกร (รายรุ่น)"
              sx={{
                minHeight: 40,
                px: 2.2,
                py: 0.82,
                borderRadius: 10,
                border: '1px solid #c8d0cb',
                bgcolor: UI.panelSoft,
                color: '#8b9390',
                fontWeight: 800,
                fontSize: '0.96rem',
                textTransform: 'none',
                '&.Mui-selected': { bgcolor: UI.accentSurface, color: UI.accent, borderColor: alpha(UI.accent, 0.22) },
              }}
            />
            <Tab
              label="การเคลื่อนไหวล่าสุด"
              sx={{
                minHeight: 40,
                px: 2.2,
                py: 0.82,
                borderRadius: 10,
                border: '1px solid #c8d0cb',
                bgcolor: UI.panelSoft,
                color: '#8b9390',
                fontWeight: 800,
                fontSize: '0.96rem',
                textTransform: 'none',
                '&.Mui-selected': { bgcolor: UI.accentSurface, color: UI.accent, borderColor: alpha(UI.accent, 0.22) },
              }}
            />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <>
            <Box
              sx={{
                ...BLOCK_LAYOUT_TWO_COLUMN_SX,
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 240px' },
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 1.2,
                }}
              >
                {summaryCards.map((card) => (
                  <Paper
                    key={card.key}
                    variant="outlined"
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      p: 1.5,
                      borderColor: UI.border,
                      bgcolor: UI.panel,
                      boxShadow: UI.shadow,
                      borderRadius: 10,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(135deg, ${alpha(card.iconBg, 0.8)} 0%, rgba(255,255,255,0) 55%)`,
                        pointerEvents: 'none',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1, color: '#172422' }}>
                          {card.value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: UI.text, mt: 0.45, fontWeight: 800 }}>
                          {card.title}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: 10,
                          bgcolor: '#fff',
                          border: `1px solid ${alpha(card.bar, 0.15)}`,
                          boxShadow: UI.shadowSoft,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Box>
                    <Box sx={{ position: 'relative', zIndex: 1, width: 96, height: 6, borderRadius: 10, bgcolor: alpha(card.bar, 0.2) }}>
                      <Box sx={{ width: 54, height: '100%', borderRadius: 10, bgcolor: card.bar }} />
                    </Box>
                    <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, display: 'block', color: UI.muted, mt: 0.8 }}>
                      {card.subtitle}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Box
                sx={{
                  ...BLOCK_ACTION_FIELDSET_SX,
                  flexDirection: 'column',
                  p: 1.5,
                  borderRadius: 10,
                  bgcolor: UI.panel,
                  boxShadow: UI.shadow,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: UI.text, mb: 1.1 }}>
                  ตัวเลือกหน้า
                </Typography>
                <StockActionButton
                  tone="neutral"
                  startIcon={<RefreshOutlined />}
                  onClick={() => void loadData()}
                  disabled={loading}
                >
                  รีเฟรช
                </StockActionButton>
              </Box>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box
              sx={{
                p: 1.5,
                borderRadius: 10,
                bgcolor: UI.panel,
                boxShadow: UI.shadow,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.1 }}>
                <Box>
                  <Typography sx={{ fontSize: '1.08rem', fontWeight: 900, color: UI.text, mb: 0.45 }}>
                    รายการสต๊อกสุกร
                  </Typography>
                  <Typography sx={{ fontSize: '0.88rem', color: UI.muted }}>
                    ค้นหา ดูสถานะรายรุ่น และเปิดดูรายละเอียดจากตารางเดียว
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.5,
                  mb: 1.5,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1.2fr 1fr auto' },
                  alignItems: 'center',
                }}
              >
                <TextField
                  size="small"
                  placeholder="ค้นหาด้วยเลขรุ่น"
                  value={batchNoKeyword}
                  onChange={(event) => setBatchNoKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      reloadFromFirstPage();
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
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
                  label="รายการ"
                  value={selectedItemId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedItemId(value === '' ? '' : Number(value));
                    setPage(0);
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 10, bgcolor: UI.panelSoft, boxShadow: UI.shadowSoft } }}
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {itemOptions.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  select
                  label="สถานะ"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(0);
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { height: 40, borderRadius: 10, bgcolor: UI.panelSoft, boxShadow: UI.shadowSoft } }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                <StockActionButton
                  tone="primary"
                  onClick={() => {
                    reloadFromFirstPage();
                  }}
                  disabled={loading}
                >
                  ค้นหา
                </StockActionButton>
              </Box>
              <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
                *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
              </Typography>
              <DataTable
                columns={columns}
                data={rows}
                emptyMessage="ไม่พบข้อมูลสต๊อกสุกร"
                includeManagementColumn={false}
                page={page}
                rowsPerPage={pageSize}
                totalCount={totalCount}
                onPageChange={setPage}
                onRowsPerPageChange={(nextRowsPerPage) => {
                  setPageSize(nextRowsPerPage);
                  setPage(0);
                }}
                onRowDoubleClick={(row) => {
                  void openDetailDialog(row);
                }}
                stickyHeader
                paperSx={{
                  borderRadius: 10,
                  border: `1px solid ${UI.border}`,
                  boxShadow: UI.shadow,
                  height: PR_MAIN_TABLE_HEIGHT,
                  pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
                  bgcolor: UI.panelSoft,
                }}
                tableContainerSx={{
                  overflowX: 'auto',
                  overflowY: 'auto',
                  scrollbarGutter: 'stable',
                }}
                headerCellSx={{
                  bgcolor: `${UI.panelMuted} !important`,
                  color: '#4a5451 !important',
                  fontWeight: 800,
                  fontSize: '15px',
                  py: 0,
                  textAlign: 'center !important',
                  verticalAlign: 'middle',
                  borderBottom: `1px solid ${UI.border}`,
                }}
                tableSx={{
                  '& .MuiTable-root': {
                    minWidth: { xs: 836, md: 836 },
                    tableLayout: 'fixed',
                  },
                  '& .MuiTableBody-root .MuiTableCell-root': {
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    py: 1.05,
                    verticalAlign: 'middle',
                    borderBottom: `1px solid ${UI.border}`,
                    color: UI.text,
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    whiteSpace: 'nowrap',
                    overflowWrap: 'normal',
                    wordBreak: 'normal',
                  },
                }}
              />
            </Box>
          </>
        )}

        {activeTab === 1 && <PigMovementsTable onRowDoubleClick={(row) => void openMovementDetail(row)} />}
      </Stack>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 10,
            border: '1px solid #8a9aac',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitleWithClose onClose={() => setDetailOpen(false)} sx={pigDetailDialogTitleSx}>
          รายละเอียดรุ่นสุกร
        </DialogTitleWithClose>
        <DialogContent dividers sx={{ ...MASTER_DIALOG_FORM_SX, px: { xs: 1.25, md: 2 }, py: 1.5 }}>
          {detailLoading ? (
            <Box sx={{ minHeight: 220, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : !detailData ? (
            <Alert severity="warning">ไม่พบข้อมูลรายละเอียด</Alert>
          ) : (
            <Stack spacing={2}>
              <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
                <Typography component="legend" sx={{ ...BLOCK_FIELDSET_LEGEND_SX, color: UI.accent }}>ข้อมูลรับเข้า</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
                  <Typography><strong>รุ่นสุกร:</strong> {detailData.batchNo}</Typography>
                  <Typography><strong>รายการ:</strong> {detailData.itemCode} - {detailData.itemName}</Typography>
                  <Typography><strong>ฟาร์ม:</strong> {detailData.facilityCode} - {detailData.facilityName}</Typography>
                  <Typography><strong>สถานะ:</strong> {detailRow?.status || '-'}</Typography>
                  <Typography><strong>จำนวนรับเข้า:</strong> {formatNumber(Number(detailRow?.initialQuantity ?? 0))}</Typography>
                  <Typography>
                    <strong>ราคาต่อหน่วย:</strong>{' '}
                    {detailRow?.unitCost != null
                      ? `${formatNumber(Number(detailRow.unitCost))} บาท`
                      : detailData.unitCost != null
                        ? `${formatNumber(Number(detailData.unitCost))} บาท`
                        : '-'}
                  </Typography>
                  <Typography><strong>สต๊อกปัจจุบัน:</strong> {formatNumber(Number(detailRow?.currentQuantity ?? 0))}</Typography>
                  <Typography><strong>หน่วย:</strong> {detailRow?.uomName || '-'}</Typography>
                  <Typography><strong>อ้างอิง PR:</strong> {detailData.sourcePurchaseRequestNumber || '-'}</Typography>
                  <Typography><strong>รับเข้าโดย:</strong> {detailData.receivedByName || '-'}</Typography>
                  <Typography>
                    <strong>รับเข้าเมื่อ:</strong>{' '}
                    {detailData.receiveTransactionDate
                      ? dayjs(detailData.receiveTransactionDate).format('DD/MM/YYYY HH:mm')
                      : dayjs(detailData.receivedDate).format('DD/MM/YYYY HH:mm')}
                  </Typography>
                  <Typography><strong>คลัง:</strong> {formatCodeNameLabel(detailData.warehouseCode, detailData.warehouseName)}</Typography>
                </Box>
              </Box>

              <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
                <Typography component="legend" sx={{ ...BLOCK_FIELDSET_LEGEND_SX, color: UI.accent }}>การผูกเข้าโรงเรือน</Typography>
                <Box
                  sx={{
                    border: '1px solid #8a9aac',
                    borderRadius: 10,
                    overflowX: 'auto',
                    overflowY: 'auto',
                    height: `${PR_DIALOG_TABLE_HEIGHT}px`,
                    minHeight: `${PR_DIALOG_TABLE_HEIGHT}px`,
                  }}
                >
                  <Table size="small" stickyHeader sx={{ minWidth: 760 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>เอกสารเปิดโรงเรือน</TableCell>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>โรงเรือน</TableCell>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>สถานะ</TableCell>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>จำนวนรับเข้า</TableCell>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>รับเข้าโรงเรือนเมื่อ</TableCell>
                        <TableCell align="center" sx={{ bgcolor: UI.accent, color: '#fff', fontWeight: 700 }}>บันทึกโดย</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailData.houseAssignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">ยังไม่มีการผูกเข้าโรงเรือน</TableCell>
                        </TableRow>
                      ) : (
                        detailData.houseAssignments.map((entry) => (
                          <TableRow key={entry.buildingOpeningId}>
                            <TableCell>{entry.buildingOpeningDocumentNumber}</TableCell>
                            <TableCell>{entry.zone ? `${entry.zone}/${entry.houseCode}` : entry.houseCode} - {entry.houseName}</TableCell>
                            <TableCell align="center">{entry.status}</TableCell>
                            <TableCell align="right">{formatNumber(Number(entry.actualReceivedQuantity ?? 0))}</TableCell>
                            <TableCell align="center">
                              {entry.receivedDate ? dayjs(entry.receivedDate).format('DD/MM/YYYY HH:mm') : '-'}
                            </TableCell>
                            <TableCell>{entry.issueByName || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
}
