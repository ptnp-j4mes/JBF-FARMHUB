'use client';

import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AddCircleOutlineRounded } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import type { ReceivablePurchaseRequestRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { StatusBadge } from '@/design-system';
import { StockActionButton } from './StockActionButton';

type ReceivablePurchaseRequestListProps = {
  rows: ReceivablePurchaseRequestRow[];
  centralWarehouseId?: number | null;
  loading?: boolean;
  disabled?: boolean;
  onReceive: (row: ReceivablePurchaseRequestRow) => void;
};

function receiptStatusMeta(status: string) {
  switch (status) {
    case 'Completed':
      return { label: 'รับครบ', color: 'success' as const };
    case 'PartiallyReceived':
      return { label: 'รับบางส่วน', color: 'warning' as const };
    default:
      return { label: 'ยังไม่รับ', color: 'default' as const };
  }
}

function requestTypeMeta(requestType?: string) {
  if ((requestType ?? '').toLowerCase() === 'pig') {
    return { label: 'Pig', color: 'warning' as const };
  }

  return { label: 'Material', color: 'info' as const };
}

export function ReceivablePurchaseRequestList({
  rows,
  centralWarehouseId = null,
  loading = false,
  disabled = false,
  onReceive,
}: ReceivablePurchaseRequestListProps) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <TableContainer sx={{ maxHeight: 360, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table size="small" stickyHeader sx={{
            minWidth: 1400,
            tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              bgcolor: 'background.paper',
              backgroundImage: (t: any) =>
                `linear-gradient(${alpha(t.palette.primary.main, 0.06)}, ${alpha(t.palette.primary.main, 0.06)})`,
              color: 'text.primary',
              fontWeight: 800,
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '1px solid',
              borderBottomColor: 'divider',
              borderRight: '1px solid',
              borderRightColor: 'divider',
              '&:last-of-type': { borderRight: 'none' },
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              py: 1,
              verticalAlign: 'middle',
              borderBottom: '1px solid',
              borderBottomColor: 'divider',
              color: 'text.primary',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: (t: any) => alpha(t.palette.primary.main, 0.04) },
          }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 160 }}>เลขที่ PR</TableCell>
              <TableCell sx={{ width: 180 }}>ฟาร์ม</TableCell>
              <TableCell sx={{ width: 180 }}>คลังปลายทาง</TableCell>
              <TableCell sx={{ width: 140 }}>ผู้ขอ</TableCell>
              <TableCell sx={{ width: 380 }}>รายการ</TableCell>
              <TableCell sx={{ width: 120 }}>สถานะรับ</TableCell>
              <TableCell align="center" sx={{ width: 90 }}>ครั้งที่รับ</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  กำลังโหลดรายการรอรับสินค้า...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  ไม่มี PR ที่พร้อมรับสินค้า
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const statusMeta = receiptStatusMeta(row.receiptStatus);
                const typeMeta = requestTypeMeta(row.requestType);

                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Stack spacing={0.5} alignItems="flex-start">
                        <Typography variant="body2" fontWeight={800} color="success.main">
                          {row.documentNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(row.requestDate).toLocaleDateString('th-TH')}
                        </Typography>
                        <StatusBadge
                          label={typeMeta.label}
                          type={typeMeta.color}
                          size="small"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.facilityName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.3}>
                        <Typography variant="body2" fontWeight={700}>
                          {row.destinationWarehouseName || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.destinationWarehouseId != null && row.destinationWarehouseId === centralWarehouseId
                            ? 'คลังกลาง'
                            : 'คลังฟาร์ม'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2">{row.requestorName}</Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 360 }}>
                      <Stack spacing={0.9}>
                        {row.lines.map((line) => (
                          <Box key={line.purchaseRequestLineId}>
                            <Typography variant="body2" fontWeight={700}>
                              {String(row.requestType).toLowerCase() === 'pig'
                                ? line.pigItemName || [line.itemCategoryCode, line.itemCategoryName].filter(Boolean).join(' - ') || line.itemName
                                : line.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              รับแล้ว {formatNumber(line.receivedQuantity)}/
                              {formatNumber(line.quantity)} {line.uomName}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                ml: 0.8,
                                color: theme.palette.warning.main,
                                fontWeight: 700,
                              }}
                            >
                              (คงค้าง {formatNumber(line.remainingQuantity)})
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <StatusBadge
                        label={statusMeta.label}
                        type={statusMeta.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 90 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.receiveCount} ครั้ง
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 140 }}>
                      <StockActionButton
                        tone="success"
                        size="small"
                        shape="pill"
                        startIcon={<AddCircleOutlineRounded />}
                        onClick={() => onReceive(row)}
                        disabled={disabled}
                      >
                        รับสินค้า
                      </StockActionButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
