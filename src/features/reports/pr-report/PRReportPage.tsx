'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Download, Refresh, Search as SearchIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DataTable, type Column } from '@/components/common';
import { PRDetailsDialog } from '@/features/production/purchase/components';
import { purchaseService } from '@/features/production/purchase/services/purchase.service';
import type { PurchaseFilterParams, PurchaseRequestResponse } from '@/features/production/purchase/types';
import { formatDateTime, toISODateString } from '@/lib/utils/date.util';
import { formatCurrency, formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import {
  BLOCK_ACTION_FIELDSET_SX,
  BLOCK_FIELDSET_SX,
  BLOCK_FIELDSET_LEGEND_SX,
  BLOCK_LAYOUT_TWO_COLUMN_SX,
  BLOCK_REFRESH_BUTTON_SX,
  BLOCK_TABLE_FIELDSET_ALIGNED_SX,
  MASTER_PROGRAM_CONTENT_SX,
  MASTER_PROGRAM_HEADER_BAR_SX,
  MASTER_PROGRAM_SHELL_FIELDSET_SX,
} from '@/core/ui-patterns/block-style.template';
import { AxiosError } from 'axios';

type PRReportPageProps = {
  initialItems?: PurchaseRequestResponse[];
};

const statusOptions = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'Draft', label: toThaiWorkflowStatus('Draft') },
  { value: 'Pending', label: toThaiWorkflowStatus('Pending') },
  { value: 'Returned', label: toThaiWorkflowStatus('Returned') },
  { value: 'Approved', label: toThaiWorkflowStatus('Approved') },
  { value: 'Rejected', label: toThaiWorkflowStatus('Rejected') },
  { value: 'Completed', label: toThaiWorkflowStatus('Completed') },
  { value: 'Canceled', label: toThaiWorkflowStatus('Canceled') },
];

function getEstimatedTotal(request: PurchaseRequestResponse): number {
  return request.lines.reduce((sum, line) => sum + line.quantity * line.estimatedPrice, 0);
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: PurchaseRequestResponse[]): string {
  const header = [
    'เลขที่ PR',
    'ผู้ขอ',
    'ความเร่งด่วน',
    'วันที่',
    'สถานะ',
    'มูลค่าโดยประมาณ',
  ];
  const lines = rows.map((row) => [
    row.documentNumber,
    row.requestorName,
    row.urgency,
    formatDateTime(row.requestDate),
    toThaiWorkflowStatus(row.status),
    String(getEstimatedTotal(row)),
  ]);

  return [header, ...lines]
    .map((line) => line.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');
}

export function PRReportPage({ initialItems = [] }: PRReportPageProps) {
  const today = toISODateString(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [items, setItems] = useState<PurchaseRequestResponse[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<PurchaseFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<PurchaseFilterParams>({
    searchTerm: '',
    requestDateFrom: today,
    requestDateTo: today,
    status: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequestResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const dateFromInputRef = useRef<HTMLInputElement | null>(null);
  const dateToInputRef = useRef<HTMLInputElement | null>(null);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await purchaseService.getReportList({
        page: 1,
        pageSize: 500,
      });
      setItems(response.items);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายงาน PR ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialItems.length > 0) return;
    void loadReport();
  }, [initialItems.length, loadReport]);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = appliedFilters.searchTerm.trim().toLowerCase();

    return items.filter((row) => {
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      const rowDate = row.requestDate.slice(0, 10);
      if (appliedFilters.requestDateFrom && rowDate < appliedFilters.requestDateFrom) {
        return false;
      }
      if (appliedFilters.requestDateTo && rowDate > appliedFilters.requestDateTo) {
        return false;
      }
      if (!normalizedKeyword) return true;
      return (
        row.documentNumber.toLowerCase().includes(normalizedKeyword) ||
        row.requestorName.toLowerCase().includes(normalizedKeyword) ||
        row.facilityName.toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [items, appliedFilters]);

  const summaryCards = useMemo(() => {
    const total = items.length;
    return [
      { title: 'ใบขอซื้อทั้งหมด', value: total, subtitle: 'เอกสารทั้งหมด', color: '#2166D1' },
      { title: 'รอตรวจสอบ', value: items.filter((row) => row.status === 'Pending').length, subtitle: 'สถานะ Pending', color: '#ED6C02' },
      { title: 'อนุมัติแล้ว', value: items.filter((row) => row.status === 'Approved').length, subtitle: 'สถานะ Approved', color: '#2E7D32' },
      { title: 'ไม่อนุมัติ/ตีกลับ', value: items.filter((row) => row.status === 'Rejected' || row.status === 'Returned').length, subtitle: 'Rejected + Returned', color: '#C62828' },
    ];
  }, [items]);

  const handleExportExcel = () => {
    const csv = toCsv(filteredItems);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);

    anchor.href = url;
    anchor.download = `pr-report-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = useCallback(async (request: PurchaseRequestResponse) => {
    try {
      const fullRequest = await purchaseService.getById(request.id);
      setSelectedRequest(fullRequest);
      setDetailDialogOpen(true);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายละเอียดใบขอซื้อได้');
    }
  }, []);

  const columns: Column<PurchaseRequestResponse>[] = [
    {
      id: 'documentNumber',
      label: 'เลขที่ PR',
      align: 'left',
      format: (value) => (
        <Typography variant="body2" fontWeight={600} textAlign="left">
          {value as string}
        </Typography>
      ),
    },
    {
      id: 'requestorName',
      label: 'ผู้ขอ',
      align: 'left',
    },
    {
      id: 'urgency',
      label: 'ความเร่งด่วน',
      align: 'center',
      format: (value) => {
        const urgency = value as string;
        return (
          <Chip
            size="small"
            label={urgency}
            color={urgency === 'Urgent' ? 'error' : urgency === 'High' ? 'warning' : 'default'}
          />
        );
      },
    },
    {
      id: 'requestDate',
      label: 'วันที่',
      align: 'center',
      format: (value) => formatDateTime(value as string),
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      format: (value) => {
        const current = value as string;
        return <Chip size="small" label={toThaiWorkflowStatus(current)} sx={getWorkflowStatusChipSx(current)} />;
      },
    },
    {
      id: 'estimatedTotal',
      label: 'มูลค่าโดยประมาณ',
      align: 'right',
      sortAccessor: (row) => getEstimatedTotal(row),
      format: (_, row) => (
        <Typography variant="body2" fontWeight={600} textAlign="right">
          {formatCurrency(getEstimatedTotal(row))}
        </Typography>
      ),
    },
  ];

  const handleFilterChange = (next: Partial<PurchaseFilterParams>) => {
    setDraftFilters((prev) => ({ ...prev, ...next }));
  };

  const handleFilterSearch = () => {
    setAppliedFilters(draftFilters);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box
        component="fieldset"
        sx={MASTER_PROGRAM_SHELL_FIELDSET_SX}
      >
        <Box sx={MASTER_PROGRAM_HEADER_BAR_SX}>
          รายงานใบขอซื้อ (PR)
        </Box>

        <Box
          sx={{
            ...MASTER_PROGRAM_CONTENT_SX,
            mb: 3,
            ...BLOCK_LAYOUT_TWO_COLUMN_SX,
          }}
        >
          <Box
            component="fieldset"
            sx={BLOCK_FIELDSET_SX}
          >
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>
              สัดส่วนรายงาน PR
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0,1fr))' }, gap: 1.25 }}>
              {summaryCards.map((card) => (
                <Card key={card.title} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 1.25 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" sx={{ color: card.color, fontWeight: 700, lineHeight: 1.1 }}>
                      {formatNumber(Number(card.value || 0))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Box
            component="fieldset"
            sx={BLOCK_ACTION_FIELDSET_SX}
          >
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>
              จัดการรายงาน
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadReport}
              variant="outlined"
              sx={BLOCK_REFRESH_BUTTON_SX}
            >
              รีเฟรช
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportExcel}
              disabled={filteredItems.length === 0}
            >
              Export Excel
            </Button>
          </Box>
        </Box>

        <Box
          component="fieldset"
          sx={{ ...BLOCK_TABLE_FIELDSET_ALIGNED_SX, mx: 2 }}
        >
          <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>
            รายการ PR
          </Typography>

          <Box
            sx={{
              mb: 1,
              display: 'grid',
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
              placeholder="ค้นหาเลขที่เอกสาร"
              value={draftFilters.searchTerm}
              onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
              size="small"
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': { height: 40 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              placeholder="สถานะ"
              value={draftFilters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              size="small"
              SelectProps={{
                displayEmpty: true,
                renderValue: (value) => (value ? String(value) : 'สถานะ'),
              }}
              sx={{
                '& .MuiOutlinedInput-root': { height: 40, width: '100%' },
                '& .MuiSelect-select': {
                  color: draftFilters.status ? 'inherit' : 'text.secondary',
                },
              }}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                type="date"
                value={draftFilters.requestDateFrom}
                onChange={(e) => handleFilterChange({ requestDateFrom: e.target.value })}
                onClick={() => {
                  const input = dateFromInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                  input?.focus();
                  input?.showPicker?.();
                }}
                inputRef={dateFromInputRef}
                size="small"
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
                type="date"
                value={draftFilters.requestDateTo}
                onChange={(e) => handleFilterChange({ requestDateTo: e.target.value })}
                onClick={() => {
                  const input = dateToInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
                  input?.focus();
                  input?.showPicker?.();
                }}
                inputRef={dateToInputRef}
                size="small"
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
                onClick={handleFilterSearch}
                sx={{ height: 40, width: { xs: '100%', md: '120px' }, minWidth: '120px' }}
              >
                ค้นหา
              </Button>
            </Box>
          </Box>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          ) : null}
          <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
            *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
          </Typography>
          <DataTable
            columns={columns}
            data={filteredItems}
            loading={loading}
            emptyMessage="ไม่พบข้อมูลรายงาน PR"
            onRowDoubleClick={handleViewDetails}
            paperSx={{
              borderRadius: '15px 15px 0 0',
              height: PR_MAIN_TABLE_HEIGHT,
              pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
            }}
            tableContainerSx={{ height: '100%', overflowX: 'auto', overflowY: 'auto', scrollbarGutter: 'stable' }}
            detachedHeader={!isMobile}
            stickyHeader={isMobile}
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
            tableSx={{
              '& .MuiTable-root': {
                minWidth: { xs: 1030, md: 1030 },
                tableLayout: 'fixed',
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                whiteSpace: 'nowrap',
                overflowWrap: 'normal',
                wordBreak: 'normal',
              },
              '& .MuiTableBody-root .MuiTableCell-root': {
                py: 1,
                verticalAlign: 'middle',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              },
              '& .MuiTableCell-head .MuiTableSortLabel-root': {
                color: '#fff !important',
              },
              '& .MuiTableCell-head .MuiTableSortLabel-icon': {
                display: 'none',
              },
            }}
          />
        </Box>
      </Box>

      <PRDetailsDialog
        open={detailDialogOpen}
        request={selectedRequest}
        onClose={() => setDetailDialogOpen(false)}
        canTakeApprovalAction={false}
      />
    </Box>
  );
}
