'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { DataTable, DialogTitleWithClose, type Column } from '@/components/common';
import { stockService } from '@/features/production/stock/services/stock.service';
import type {
  StockBalancePagedResponse,
  StockBalancePagedRow,
  StockStatusFilter,
  WarehouseResponse,
} from '@/features/production/stock/types';
import { formatCurrency, formatNumber } from '@/lib/utils/format.util';
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

type StockReportPageProps = {
  initialRows?: StockBalancePagedRow[];
};

type StockReportRow = StockBalancePagedRow & {
  id: string;
  facilityId: number | null;
  facilityCode: string;
  facilityName: string;
};

type WarehouseStockDetailRow = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  quantity: number;
  uomName: string;
  stockValue: number;
};

function getStockLevelFromQty(quantity: number): 'normal' | 'low' | 'out' {
  if (quantity <= 0) return 'out';
  if (quantity <= 10) return 'low';
  return 'normal';
}

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: StockReportRow[]): string {
  const header = [
    'รหัสสินค้า',
    'ชื่อสินค้า',
    'คงเหลือ',
    'หน่วย',
    'มูลค่า (บาท)',
  ];

  const lines = rows.map((row) => [
    row.itemCode,
    row.itemName,
    String(row.quantity),
    row.uomName,
    String(row.stockValue),
  ]);

  return [header, ...lines]
    .map((line) => line.map((cell) => escapeCsv(cell)).join(','))
    .join('\n');
}

export function StockReportPage({
  initialRows = [],
}: StockReportPageProps) {
  const [rows, setRows] = useState<StockReportRow[]>([]);
  const [sourceRows, setSourceRows] = useState<StockBalancePagedRow[]>(initialRows);
  const [loading, setLoading] = useState(initialRows.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<StockReportRow | null>(null);

  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);

  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftStockStatus, setDraftStockStatus] = useState<StockStatusFilter>('all');

  const [keyword, setKeyword] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all');

  const warehouseMap = useMemo(() => {
    const map = new Map<number, WarehouseResponse>();
    warehouses.forEach((warehouse) => {
      map.set(warehouse.id, warehouse);
    });
    return map;
  }, [warehouses]);

  const mapRows = useCallback((source: StockBalancePagedRow[]): StockReportRow[] => {
    const grouped = new Map<string, StockReportRow>();

    source.forEach((row, index) => {
      const warehouse = warehouseMap.get(row.warehouseId);
      const nodeId = warehouse?.facilityNodeId ?? null;
      const key = `${row.itemId}|${row.itemCode}|${row.uomName}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.quantity += Number(row.quantity || 0);
        existing.stockValue += Number(row.stockValue || 0);
        return;
      }

      grouped.set(key, {
        ...row,
        id: `${row.itemId}-${index}`,
        facilityId: nodeId,
        facilityCode: '',
        facilityName: warehouse?.facilityNodeName ?? '',
        lotNumber: '-',
        quantity: Number(row.quantity || 0),
        stockValue: Number(row.stockValue || 0),
      });
    });

    return Array.from(grouped.values()).sort((left, right) =>
      `${left.itemCode} ${left.itemName}`.localeCompare(`${right.itemCode} ${right.itemName}`),
    );
  }, [warehouseMap]);

  const loadMasters = useCallback(async () => {
    try {
      const warehouseData = await stockService.getWarehouses();
      setWarehouses(warehouseData);
    } catch {
      setWarehouses([]);
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response: StockBalancePagedResponse = await stockService.getPagedBalances({
        keyword: keyword.trim() || undefined,
        stockStatus: 'all',
        includeZero: true,
        sortBy: 'itemCode',
        sortDir: 'asc',
        page: 1,
        pageSize: 5000,
      });

      setSourceRows(response.data ?? []);
      setRows(mapRows(response.data ?? []));
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดรายงานคลังได้');
      setSourceRows([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, mapRows]);

  useEffect(() => {
    void loadMasters();
  }, [loadMasters]);

  useEffect(() => {
    if (initialRows.length > 0) {
      setSourceRows(initialRows);
      setRows(mapRows(initialRows));
      setLoading(false);
      return;
    }

    void loadReport();
  }, [initialRows, loadReport, mapRows]);

  useEffect(() => {
    if (initialRows.length > 0 && keyword === '' && stockStatus === 'all') {
      return;
    }

    void loadReport();
  }, [initialRows.length, keyword, loadReport, stockStatus]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (stockStatus === 'all') return true;
      return getStockLevelFromQty(row.quantity) === stockStatus;
    });
  }, [rows, stockStatus]);

  const totalCount = filteredRows.length;
  const totalStockValue = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.stockValue || 0), 0),
    [filteredRows],
  );
  const summaryCards = useMemo(() => {
    const activeFarmCount = new Set(
      rows
        .filter((row) => row.facilityId)
        .map((row) => row.facilityId as number),
    ).size;

    return [
      { title: 'รายการคงคลัง', value: formatNumber(totalCount), subtitle: 'รวมทุกคลังตามสิทธิ์', color: '#2166D1' },
      { title: 'มูลค่าคงคลังรวม', value: formatCurrency(totalStockValue), subtitle: 'บาท', color: '#14b8a6' },
      { title: 'จำนวนฟาร์มที่มีรายการ', value: formatNumber(activeFarmCount), subtitle: 'ในหน้าปัจจุบัน', color: '#7c3aed' },
      { title: 'จำนวนรายการในหน้า', value: formatNumber(rows.length), subtitle: 'page data', color: '#475569' },
    ];
  }, [rows, totalCount, totalStockValue]);

  const columns: Column<StockReportRow>[] = [
    {
      id: 'itemCode',
      label: 'รหัสสินค้า',
      align: 'left',
      minWidth: 140,
    },
    {
      id: 'itemName',
      label: 'ชื่อสินค้า',
      align: 'left',
      minWidth: 240,
    },
    {
      id: 'quantity',
      label: 'คงเหลือ',
      align: 'right',
      minWidth: 120,
      format: (value) => formatNumber(Number(value) || 0),
    },
    {
      id: 'uomName',
      label: 'หน่วย',
      align: 'center',
      minWidth: 90,
    },
    {
      id: 'stockValue',
      label: 'มูลค่า (บาท)',
      align: 'right',
      minWidth: 140,
      format: (value) => (
        <Typography variant="body2" fontWeight={700} textAlign="right">
          {formatCurrency(Number(value) || 0)}
        </Typography>
      ),
    },
    {
      id: 'stockStatus',
      label: 'สถานะ',
      align: 'center',
      minWidth: 90,
      sortable: false,
      format: (_, row) => {
        const level = getStockLevelFromQty(row.quantity ?? 0);
        const chip = level === 'out'
          ? { label: 'Out', color: 'error' as const }
          : level === 'low'
            ? { label: 'Low', color: 'warning' as const }
            : { label: 'Normal', color: 'success' as const };
        return <Chip size="small" label={chip.label} color={chip.color} />;
      },
    },
  ];

  const warehouseDetailRows = useMemo<WarehouseStockDetailRow[]>(() => {
    if (!detailItem) {
      return [];
    }

    const grouped = new Map<number, WarehouseStockDetailRow>();
    sourceRows
      .filter((row) => row.itemId === detailItem.itemId)
      .forEach((row) => {
        const warehouse = warehouseMap.get(row.warehouseId);
        const existing = grouped.get(row.warehouseId);

        if (existing) {
          existing.quantity += Number(row.quantity || 0);
          existing.stockValue += Number(row.stockValue || 0);
          return;
        }

        grouped.set(row.warehouseId, {
          id: `warehouse-${row.warehouseId}`,
          warehouseCode: warehouse?.code ?? '',
          warehouseName: warehouse?.name ?? row.warehouseName,
          quantity: Number(row.quantity || 0),
          uomName: row.uomName,
          stockValue: Number(row.stockValue || 0),
        });
      });

    return Array.from(grouped.values()).sort((left, right) =>
      `${left.warehouseCode} ${left.warehouseName}`.localeCompare(`${right.warehouseCode} ${right.warehouseName}`),
    );
  }, [detailItem, sourceRows, warehouseMap]);

  const warehouseDetailColumns: Column<WarehouseStockDetailRow>[] = [
    {
      id: 'warehouseCode',
      label: 'รหัสคลัง',
      align: 'left',
      minWidth: 140,
    },
    {
      id: 'warehouseName',
      label: 'ชื่อคลัง',
      align: 'left',
      minWidth: 260,
    },
    {
      id: 'quantity',
      label: 'คงเหลือ',
      align: 'right',
      minWidth: 120,
      format: (value) => formatNumber(Number(value) || 0),
    },
    {
      id: 'uomName',
      label: 'หน่วย',
      align: 'center',
      minWidth: 90,
    },
    {
      id: 'stockValue',
      label: 'มูลค่า (บาท)',
      align: 'right',
      minWidth: 140,
      format: (value) => (
        <Typography variant="body2" fontWeight={700} textAlign="right">
          {formatCurrency(Number(value) || 0)}
        </Typography>
      ),
    },
  ];

  const handleExportExcel = () => {
    const csv = toCsv(filteredRows);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
    anchor.href = url;
    anchor.download = `stock-report-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 } }}>
      <Box component="fieldset" sx={MASTER_PROGRAM_SHELL_FIELDSET_SX}>
        <Box sx={MASTER_PROGRAM_HEADER_BAR_SX}>รายงานคลังสินค้า</Box>

        <Box sx={MASTER_PROGRAM_CONTENT_SX}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2, ...BLOCK_LAYOUT_TWO_COLUMN_SX, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 224px' } }}>
            <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
              <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>สรุปข้อมูล</Typography>
              <Box sx={{ mb: 1, display: 'grid', gap: 1.25, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
                {summaryCards.map((card) => (
                  <Card key={card.title} sx={{ borderRadius: 10}}>
                    <CardContent sx={{ p: 1.25 }}>
                      <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: card.color, lineHeight: 1.15 }}>{card.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{card.subtitle}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>

            <Box component="fieldset" sx={BLOCK_ACTION_FIELDSET_SX}>
              <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>จัดการรายการ</Typography>
              <Button variant="contained" startIcon={<Download />} onClick={handleExportExcel} disabled={rows.length === 0}>
                Export Excel
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={loadReport} sx={BLOCK_REFRESH_BUTTON_SX}>
                รีเฟรช
              </Button>
            </Box>
          </Box>



          <Box component="fieldset" sx={{ ...BLOCK_TABLE_FIELDSET_ALIGNED_SX, mx: 0 }}>
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>รายการสินค้ารวมคลัง</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                  md: 'minmax(360px,1fr) 180px minmax(220px,1fr) auto',
                },
                alignItems: 'center',
              }}
            >
              <TextField
                size="small"
                placeholder="ค้นหาสินค้า/รหัสสินค้า"
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              />

              <TextField
                size="small"
                select
                value={draftStockStatus}
                onChange={(event) => setDraftStockStatus(event.target.value as StockStatusFilter)}
                sx={{ '& .MuiInputBase-root': { height: 40 } }}
              >
                <MenuItem value="all">ทุกสถานะ</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="out">Out</MenuItem>
              </TextField>

              <Box />

              <Button
                variant="contained"
                onClick={() => {
                  setKeyword(draftKeyword);
                  setStockStatus(draftStockStatus);
                }}
                sx={{ height: 40, minWidth: 110 }}
              >
                ค้นหา
              </Button>
            </Box>
            <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
              *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
            </Typography>
            <DataTable
              columns={columns}
              data={filteredRows}
              loading={loading}
              sortable
              stickyHeader
              onRowDoubleClick={(row) => {
                setDetailItem(row);
                setDetailOpen(true);
              }}
              headerCellSx={{
                bgcolor: '#2166D1 !important',
                color: '#fff !important',
                fontWeight: 700,
                fontSize: '16px',
                height: 50,
                lineHeight: 1,
                borderRight: '1px solid rgba(255,255,255,0.25)',
                '&:last-of-type': { borderRight: 'none' },
                '& .MuiTableSortLabel-root': {
                  color: '#fff !important',
                  fontWeight: 700,
                },
              }}
              tableSx={{
                width: '100%',
                '& .MuiTableCell-root': {
                  fontSize: '0.92rem',
                },
                '& .MuiTableBody-root .MuiTableRow-root': {
                  height: 30,
                },
                '& .MuiTableBody-root .MuiTableCell-root': {
                  py: 0.2,
                },
                '& .MuiTableBody-root .MuiTableCell-root:nth-of-type(3), & .MuiTableBody-root .MuiTableCell-root:nth-of-type(5)': {
                  textAlign: 'right',
                },
              }}
              tableContainerSx={{
                maxHeight: 500,
                minHeight: 500,
                height: 500,
                overflowY: 'auto',
                overflowX: 'auto',
                '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#b0b7c3', borderRadius: 10},
              }}
              paperSx={{
                borderRadius: 10,
                boxShadow: 'none',
                border: '1px solid',
                borderColor: 'divider',
                mb: 0,
              }}
            />
          </Box>
        </Box>
      </Box>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitleWithClose
          onClose={() => setDetailOpen(false)}
          sx={{
            textAlign: 'center',
            bgcolor: '#2166D1',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.25)',
            '& .MuiIconButton-root': {
              color: '#fff',
            },
          }}
        >
          รายงานสินค้าแยกคลัง
        </DialogTitleWithClose>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box
              component="fieldset"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.5, minWidth: 0 }}
            >
              <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
                ข้อมูลสินค้า
              </Typography>
              {detailItem ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2"><strong>สินค้า:</strong> {detailItem.itemCode} - {detailItem.itemName}</Typography>
                  <Typography variant="body2"><strong>หน่วย:</strong> {detailItem.uomName}</Typography>
                  <Typography variant="body2"><strong>คงเหลือรวม:</strong> {formatNumber(detailItem.quantity)} {detailItem.uomName}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">ไม่พบข้อมูลสินค้า</Typography>
              )}
            </Box>

            <Box
              component="fieldset"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.5, minWidth: 0 }}
            >
              <Typography component="legend" sx={{ px: 1, fontSize: '0.95rem', fontWeight: 700 }}>
                รายการแยกคลัง (ไม่แยก Lot)
              </Typography>
              <DataTable
                columns={warehouseDetailColumns}
                data={warehouseDetailRows}
                emptyMessage="ไม่พบข้อมูลคลังสำหรับสินค้านี้"
                headerCellSx={{
                  bgcolor: '#2166D1 !important',
                  color: '#fff !important',
                  fontWeight: 700,
                  fontSize: '15px',
                  py: 0,
                  borderRight: '1px solid rgba(255,255,255,0.25)',
                  '&:last-of-type': { borderRight: 'none' },
                }}
                tableContainerSx={{ maxHeight: 420, overflowY: 'auto' }}
                paperSx={{ borderRadius: 10, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setDetailOpen(false)}>
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
