'use client';

import {
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
import type { StockTransactionRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';

type TransferTransactionListProps = {
  rows: StockTransactionRow[];
  loading?: boolean;
  onView?: (row: StockTransactionRow) => void;
};

export function TransferTransactionList({
  rows,
  loading = false,
  onView,
}: TransferTransactionListProps) {
  return (
    <Paper
      sx={{
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
        border: '1px solid',
        borderColor: '#dde2de',
        bgcolor: '#f8faf8',
      }}
    >
      <TableContainer sx={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table
          size="small"
          stickyHeader
          sx={{
            minWidth: 1260,
            tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              bgcolor: '#f2f6f3',
              color: '#4a5451',
              fontWeight: 800,
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '1px solid #dde2de',
              borderRight: '1px solid #dde2de',
              '&:last-of-type': { borderRight: 'none' },
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              py: 1,
              verticalAlign: 'middle',
              borderBottom: '1px solid #dde2de',
              color: '#2f3a37',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: '#f1f5f2' },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 150 }}>เลขที่เอกสาร</TableCell>
              <TableCell sx={{ width: 150 }}>วันที่</TableCell>
              <TableCell sx={{ width: 300 }}>รายการ</TableCell>
              <TableCell sx={{ width: 180 }}>จากคลัง</TableCell>
              <TableCell sx={{ width: 180 }}>ไปคลัง</TableCell>
              <TableCell sx={{ width: 150 }}>ผู้ทำรายการ</TableCell>
              <TableCell sx={{ width: 220 }}>หมายเหตุ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  กำลังโหลดรายการโอนย้าย...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  ยังไม่มีรายการโอนย้าย
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const firstLine = row.lines[0];

                return (
                  <TableRow key={row.id} hover onDoubleClick={() => onView?.(row)} sx={{ cursor: onView ? 'pointer' : 'default' }}>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2" fontWeight={800}>
                        {row.documentNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2">
                        {new Date(row.transactionDate).toLocaleString('th-TH')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Stack spacing={0.8}>
                        {row.lines.map((line) => (
                          <div key={line.id}>
                            <Typography variant="body2" fontWeight={700}>
                              {(row.requestType ?? '').toLowerCase() === 'pig' ? (line.pigItemName || line.itemName) : line.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatNumber(line.quantity)} {line.uomName}
                              {line.lotNumber ? ` • Lot ${line.lotNumber}` : ''}
                            </Typography>
                          </div>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2">
                        {firstLine?.fromWarehouseName ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2">
                        {firstLine?.toWarehouseName ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2">
                        {row.createdByUsername}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 220 }}>
                      <Typography variant="body2" color="text.secondary">
                        {row.remarks || '-'}
                      </Typography>
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
