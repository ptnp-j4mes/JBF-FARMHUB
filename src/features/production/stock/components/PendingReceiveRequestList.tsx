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
import { EditOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import type { StockReceiveRequestResponse } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { getFeedSiloDisplayLabel } from '../utils/location-display.util';
import { StatusBadge } from '@/design-system';
import { StockActionButton } from './StockActionButton';

type PendingReceiveRequestListProps = {
  rows: StockReceiveRequestResponse[];
  loading?: boolean;
  disabled?: boolean;
  onManage: (row: StockReceiveRequestResponse) => void;
};

function pendingStatusMeta(status: string) {
  switch (status) {
    case 'AwaitingCompletion':
      return { label: 'รอรับเข้าคลัง', color: 'warning' as const };
    case 'Pending':
      return { label: 'รอดำเนินการ', color: 'info' as const };
    case 'Completed':
      return { label: 'เข้าคลังแล้ว', color: 'success' as const };
    default:
      return { label: status || '-', color: 'default' as const };
  }
}

export function PendingReceiveRequestList({
  rows,
  loading = false,
  disabled = false,
  onManage,
}: PendingReceiveRequestListProps) {
  return (
    <Paper
      sx={{
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <TableContainer sx={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table
          size="small"
          stickyHeader
          sx={{
            minWidth: 1380,
            tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              bgcolor: (t: any) => alpha(t.palette.primary.main, 0.06),
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
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 170 }}>เลขที่ใบรับสินค้า</TableCell>
              <TableCell sx={{ width: 150 }}>อ้างอิง PR</TableCell>
              <TableCell sx={{ width: 180 }}>ฟาร์ม</TableCell>
              <TableCell sx={{ width: 180 }}>คลังปลายทาง</TableCell>
              <TableCell sx={{ width: 380 }}>รายการรับสินค้า</TableCell>
              <TableCell sx={{ width: 140 }}>สถานะ</TableCell>
              <TableCell sx={{ width: 150 }}>ผู้รับสินค้า</TableCell>
              <TableCell align="right" sx={{ width: 130 }}>จัดการ</TableCell>
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
                const statusMeta = pendingStatusMeta(row.status || '');

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onDoubleClick={() => {
                      if (!disabled) {
                        onManage(row);
                      }
                    }}
                    sx={{
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography variant="body2" fontWeight={800} color="warning.main">
                        {row.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(row.requestDate).toLocaleString('th-TH')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.purchaseRequestNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.facilityName}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.warehouseName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 360 }}>
                      <Stack spacing={0.9}>
                        {row.lines.map((line) => (
                          <Box key={line.id}>
                            <Typography variant="body2" fontWeight={700}>
                              {line.itemName || line.pigItemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              รับ {formatNumber(line.receiveQuantity)} {line.uomName}
                              {line.unitCost != null && line.unitCost > 0
                                ? ` • ราคา ${formatNumber(line.unitCost, 2)} บาท/${line.uomName}`
                                : ' • ยังไม่กรอกราคา'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Lot: {line.lotNumber || '-'}
                            </Typography>
                            {line.allocations.length > 0 ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                ไซโล: {line.allocations.map((allocation) => getFeedSiloDisplayLabel(allocation.feedSiloName, allocation.feedSiloCode)).join(', ')}
                              </Typography>
                            ) : null}
                          </Box>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <StatusBadge
                        label={statusMeta.label}
                        type={statusMeta.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2">{row.receiverName || '-'}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ minWidth: 140 }}>
                      <StockActionButton
                        tone="info"
                        size="small"
                        shape="pill"
                        startIcon={<EditOutlined />}
                        onClick={() => onManage(row)}
                        disabled={disabled}
                      >
                        จัดการ
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
