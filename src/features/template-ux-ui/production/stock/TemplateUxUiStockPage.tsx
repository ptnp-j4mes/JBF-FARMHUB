'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import type {
  DashboardMetricResponse,
  ItemOption,
  StockBalanceResponse,
  UomOption,
  WarehouseResponse,
} from '@/features/production/stock/types';
import DataTable, { type Column } from '@/components/common/DataTable';
import { formatNumber } from '@/lib/utils/format.util';

type TemplateUxUiStockPageProps = {
  initialStockBalances?: StockBalanceResponse[];
  initialDashboard?: DashboardMetricResponse | null;
  initialWarehouses?: WarehouseResponse[];
  initialItems?: ItemOption[];
  initialUoms?: UomOption[];
};

type StockTableRow = {
  id: string;
  warehouseId: number;
  itemCode: string;
  itemName: string;
  warehouseName: string;
  quantity: number;
  uomName: string;
  status: 'ปกติ' | 'ต่ำ' | 'หมด';
};

const GREEN = {
  main: '#4CAF50',
  deep: '#2E7D32',
  soft: '#81C784',
  bg: '#FFFFFF',
  border: '#DDE9DD',
  tableHeader: '#EAF6EA',
  textMain: '#17351A',
  textSub: '#4A5D4B',
};

const FIELDSET_SX = {
  border: `1px solid ${GREEN.border}`,
  borderRadius: 10,
  backgroundColor: GREEN.bg,
  p: { xs: 1.5, md: 2 },
  mb: 2,
};

const LEGEND_SX = {
  px: 1,
  color: GREEN.deep,
  fontWeight: 700,
  fontSize: '0.95rem',
};

const getStockStatus = (qty: number): StockTableRow['status'] => {
  if (qty <= 0) return 'หมด';
  if (qty <= 20) return 'ต่ำ';
  return 'ปกติ';
};

function statusChip(status: StockTableRow['status']) {
  if (status === 'ปกติ') {
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: '#E8F5E9', color: GREEN.deep, fontWeight: 700, borderRadius: 10}}
      />
    );
  }

  if (status === 'ต่ำ') {
    return (
      <Chip
        label={status}
        size="small"
        sx={{ bgcolor: '#FFF8E1', color: '#9A6B00', fontWeight: 700, borderRadius: 10}}
      />
    );
  }

  return (
    <Chip
      label={status}
      size="small"
      sx={{ bgcolor: '#FDECEA', color: '#B42318', fontWeight: 700, borderRadius: 10}}
    />
  );
}

export function TemplateUxUiStockPage({
  initialStockBalances = [],
  initialDashboard = null,
  initialWarehouses = [],
}: TemplateUxUiStockPageProps) {
  const [keyword, setKeyword] = useState('');
  const [warehouseId, setWarehouseId] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<'all' | StockTableRow['status']>('all');

  const rows = useMemo<StockTableRow[]>(() => {
    return initialStockBalances.map((row, index) => {
      const itemCode = row.itemCode || row.pigItemCode || '-';
      const itemName = row.itemName || row.pigItemName || '-';
      const quantity = Number(row.quantity || 0);
      return {
        id: `${row.warehouseId}-${row.itemId ?? row.pigItemId ?? index}-${row.stockLotId ?? 'n'}`,
        warehouseId: row.warehouseId,
        itemCode,
        itemName,
        warehouseName: row.warehouseName || '-',
        quantity,
        uomName: row.uomName || '-',
        status: getStockStatus(quantity),
      };
    });
  }, [initialStockBalances]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchedKeyword =
        keyword.trim() === '' ||
        `${row.itemCode} ${row.itemName} ${row.warehouseName}`
          .toLowerCase()
          .includes(keyword.toLowerCase());

      const matchedWarehouse =
        warehouseId === 'all' || row.warehouseId === warehouseId;

      const matchedStatus = status === 'all' || row.status === status;
      return matchedKeyword && matchedWarehouse && matchedStatus;
    });
  }, [initialWarehouses, keyword, rows, status, warehouseId]);

  const summary = useMemo(() => {
    const totalQty = filteredRows.reduce((sum, row) => sum + row.quantity, 0);
    const normalCount = filteredRows.filter((row) => row.status === 'ปกติ').length;
    const lowCount = filteredRows.filter((row) => row.status === 'ต่ำ').length;
    const outCount = filteredRows.filter((row) => row.status === 'หมด').length;
    return {
      totalItems: filteredRows.length,
      totalQty,
      normalCount,
      lowCount,
      outCount,
      stockValue: Number(initialDashboard?.totalStockValue || 0),
    };
  }, [filteredRows, initialDashboard?.totalStockValue]);

  const columns: Column<StockTableRow>[] = [
    {
      id: 'itemCode',
      label: 'รหัสสินค้า',
      minWidth: 120,
      width: 120,
      sortable: true,
    },
    {
      id: 'itemName',
      label: 'ชื่อสินค้า',
      minWidth: 220,
      sortable: true,
    },
    {
      id: 'warehouseName',
      label: 'คลัง',
      minWidth: 160,
      sortable: true,
    },
    {
      id: 'quantity',
      label: 'คงเหลือ',
      align: 'right',
      minWidth: 100,
      format: (value) => formatNumber(Number(value || 0)),
      sortable: true,
    },
    {
      id: 'uomName',
      label: 'หน่วย',
      minWidth: 90,
      sortable: true,
    },
    {
      id: 'status',
      label: 'สถานะ',
      minWidth: 110,
      align: 'center',
      format: (value) => statusChip(value as StockTableRow['status']),
      sortable: true,
    },
    {
      id: 'actions',
      label: 'จัดการ',
      minWidth: 100,
      align: 'center',
      format: () => (
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: GREEN.main,
            color: '#fff',
            borderRadius: 10,
            px: 1.5,
            '&:hover': { bgcolor: GREEN.deep },
          }}
        >
          ดู
        </Button>
      ),
      sortable: false,
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 1440,
        mx: 'auto',
        p: { xs: 1.5, md: 2 },
        color: GREEN.textMain,
        backgroundColor: GREEN.bg,
      }}
    >
      <Box component="fieldset" sx={{ ...FIELDSET_SX, mb: 1.5 }}>
        <Typography
          component="legend"
          sx={{
            ...LEGEND_SX,
            bgcolor: GREEN.soft,
            borderRadius: 10,
            color: GREEN.deep,
          }}
        >
          เทมเพลต UX/UI: คลังสินค้า (Green Theme)
        </Typography>
        <Typography sx={{ color: GREEN.textSub, fontSize: '0.92rem' }}>
          หน้านี้เป็นสำเนา UX/UI สำหรับทดลองดีไซน์ใหม่ โดยแยกจากหน้าคลังจริง
        </Typography>
      </Box>

      <Box component="fieldset" sx={FIELDSET_SX}>
        <Typography component="legend" sx={LEGEND_SX}>
          ภาพรวมคลังสินค้า
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' },
          }}
        >
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>รายการทั้งหมด</Typography>
              <Typography variant="h6" sx={{ color: GREEN.deep, fontWeight: 700 }}>{formatNumber(summary.totalItems)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>คงเหลือรวม</Typography>
              <Typography variant="h6" sx={{ color: GREEN.deep, fontWeight: 700 }}>{formatNumber(summary.totalQty)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>สถานะปกติ</Typography>
              <Typography variant="h6" sx={{ color: GREEN.main, fontWeight: 700 }}>{formatNumber(summary.normalCount)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>สถานะต่ำ</Typography>
              <Typography variant="h6" sx={{ color: '#B7791F', fontWeight: 700 }}>{formatNumber(summary.lowCount)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>สถานะหมด</Typography>
              <Typography variant="h6" sx={{ color: '#C62828', fontWeight: 700 }}>{formatNumber(summary.outCount)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ borderRadius: 10, border: `1px solid ${GREEN.border}` }}>
            <CardContent sx={{ p: 1.25 }}>
              <Typography variant="caption" sx={{ color: GREEN.textSub }}>มูลค่าคงคลัง (บาท)</Typography>
              <Typography variant="h6" sx={{ color: GREEN.deep, fontWeight: 700 }}>{formatNumber(summary.stockValue)}</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box component="fieldset" sx={FIELDSET_SX}>
        <Typography component="legend" sx={LEGEND_SX}>
          ตัวกรองและคำสั่ง
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr 1fr auto' },
            gap: 1.2,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="ค้นหารหัสสินค้า / ชื่อสินค้า / คลัง"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: GREEN.main }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" fullWidth>
            <Select
              value={warehouseId}
              onChange={(event) => {
                const next = event.target.value;
                setWarehouseId(next === 'all' ? 'all' : Number(next));
              }}
            >
              <MenuItem value="all">ทุกคลัง</MenuItem>
              {initialWarehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | StockTableRow['status'])}
            >
              <MenuItem value="all">ทุกสถานะ</MenuItem>
              <MenuItem value="ปกติ">ปกติ</MenuItem>
              <MenuItem value="ต่ำ">ต่ำ</MenuItem>
              <MenuItem value="หมด">หมด</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshOutlined />}
            onClick={() => {
              setKeyword('');
              setWarehouseId('all');
              setStatus('all');
            }}
            sx={{
              color: GREEN.deep,
              borderColor: GREEN.soft,
              height: 40,
              '&:hover': { borderColor: GREEN.main, bgcolor: '#F6FBF6' },
            }}
          >
            รีเซ็ต
          </Button>
        </Box>
      </Box>

      <Box component="fieldset" sx={FIELDSET_SX}>
        <Typography component="legend" sx={LEGEND_SX}>
          ตารางรายการคงคลัง
        </Typography>
        <DataTable
          columns={columns}
          data={filteredRows}
          stickyHeader
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="ไม่พบข้อมูลคงคลังตามเงื่อนไขที่เลือก"
          headerCellSx={{
            bgcolor: `${GREEN.tableHeader} !important`,
            color: `${GREEN.deep} !important`,
            fontWeight: 700,
            borderBottom: `1px solid ${GREEN.border}`,
          }}
          tableContainerSx={{
            borderRadius: 10,
            border: `1px solid ${GREEN.border}`,
            maxHeight: { xs: 460, md: 560 },
          }}
          tableSx={{
            '& .MuiTableRow-root:hover': {
              backgroundColor: '#F4FAF4',
            },
          }}
        />
      </Box>

      <Typography sx={{ mt: 1, color: GREEN.textSub, fontSize: '0.8rem' }}>
        UX Notes: โครงสร้างหน้าออกแบบให้ scan ข้อมูลเร็ว, hierarchy ชัด, และลดความล้าตาในการใช้งานต่อเนื่อง
      </Typography>
    </Box>
  );
}
