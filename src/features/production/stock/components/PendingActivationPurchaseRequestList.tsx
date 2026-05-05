'use client';

import {
  Box,
  Button,
  Chip,
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
import { EditOutlined } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import type { ReceivablePurchaseRequestRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { STOCK_DIALOG_UI } from './stock-dialog.constants';

type PendingActivationPurchaseRequestListProps = {
  rows: ReceivablePurchaseRequestRow[];
  centralWarehouseId?: number | null;
  loading?: boolean;
  disabled?: boolean;
  onManage: (row: ReceivablePurchaseRequestRow) => void;
};

function pendingStatusMeta(status: string) {
  switch (status) {
    case 'รอกรอกราคา':
      return { color: 'warning' as const };
    case 'รอรับเข้าให้ครบ':
      return { color: 'info' as const };
    case 'รอกรอกราคาและรับให้ครบ':
      return { color: 'error' as const };
    default:
      return { color: 'default' as const };
  }
}

export function PendingActivationPurchaseRequestList({
  rows,
  centralWarehouseId = null,
  loading = false,
  disabled = false,
  onManage,
}: PendingActivationPurchaseRequestListProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Paper
      sx={{
        borderRadius: '15px 15px 0 0',
        overflow: 'hidden',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <TableContainer sx={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table
          size="small"
          stickyHeader
          sx={{
            '& .MuiTableCell-head': {
              bgcolor: STOCK_DIALOG_UI.accent,
              color: '#fff',
              fontWeight: 700,
              textAlign: 'center',
              verticalAlign: 'middle',
              borderRight: `1px solid ${alpha(STOCK_DIALOG_UI.accentDark, 0.3)}`,
              '&:last-of-type': { borderRight: 'none' },
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              py: 1,
              verticalAlign: 'middle',
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>เลขที่ PR</TableCell>
              <TableCell>ฟาร์ม</TableCell>
              <TableCell>คลังปลายทาง</TableCell>
              <TableCell>รายการที่รอเข้าคลัง</TableCell>
              <TableCell>สถานะรอ</TableCell>
              <TableCell align="center">ครั้งที่รับ</TableCell>
              <TableCell>รับล่าสุด</TableCell>
              <TableCell align="right">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  กำลังโหลดรายการรอรับเข้าคลัง...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  ไม่มีรายการรอรับเข้าคลัง
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const statusMeta = pendingStatusMeta(row.pendingActivationStatus || '');
                const waitingLines = row.lines.filter((line) => line.receivedQuantity > 0);

                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2" fontWeight={800} color="warning.main">
                        {row.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(row.requestDate).toLocaleDateString('th-TH')}
                      </Typography>
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
                    <TableCell sx={{ minWidth: 360 }}>
                      <Stack spacing={0.9}>
                        {waitingLines.map((line) => (
                          <Box key={line.purchaseRequestLineId}>
                            <Typography variant="body2" fontWeight={700}>
                              {line.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              รับแล้ว {formatNumber(line.receivedQuantity)}/
                              {formatNumber(line.quantity)} {line.uomName}
                            </Typography>
                            <Typography variant="caption" sx={{ ml: 0.8, color: theme.palette.warning.main, fontWeight: 700 }}>
                              {line.actualUnitPrice && line.actualUnitPrice > 0
                                ? `(ราคา ${formatNumber(line.actualUnitPrice, 2)} บาท/${line.uomName})`
                                : '(ยังไม่กรอกราคา)'}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Chip
                        label={row.pendingActivationStatus || '-'}
                        size="small"
                        color={statusMeta.color}
                        sx={{
                          fontWeight: 700,
                          bgcolor:
                            statusMeta.color === 'default'
                              ? alpha(theme.palette.text.secondary, isDarkMode ? 0.24 : 0.12)
                              : undefined,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 90 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.receiveCount} ครั้ง
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2">
                        {row.lastReceiveDate
                          ? new Date(row.lastReceiveDate).toLocaleString('th-TH')
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 140 }}>
                      <Button
                        variant="outlined"
                        color="warning"
                        startIcon={<EditOutlined />}
                        onClick={() => onManage(row)}
                        disabled={disabled}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      >
                        จัดการ
                      </Button>
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
